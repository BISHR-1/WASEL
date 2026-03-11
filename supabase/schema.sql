-- 0. Extensions
-- Enable necessary extensions for crypto, JWT, and vector operations
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgjwt"; -- optional, standard in Supabase
CREATE EXTENSION IF NOT EXISTS "pgvector"; -- for embeddings

-- 1. users
-- Core user table. Role-based access control (RBAC) is central here.
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  phone text,
  full_name text,
  role text not null default 'user' check (role in ('guest', 'user', 'courier', 'operator', 'admin')),
  created_at timestamptz default now()
);

-- 2. addresses (saved addresses)
-- Encrypted or protected addresses for users.
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  label text,
  address_json jsonb, -- structured address data
  is_default boolean default false,
  created_at timestamptz default now()
);

-- 3. products
-- Product catalog with dual currency support.
create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  title text,
  description text,
  category text,
  price_cents integer not null, -- Store in USD cents to avoid float errors
  price_lry integer, -- Store in Lira
  currency text default 'USD',
  stock integer default 0,
  images jsonb, -- Array of image URLs/metadata
  created_at timestamptz default now()
);

-- 4. family_carts / temporary carts
-- Shared or individual carts. Designed for session persistence.
create table public.family_carts (
  id uuid primary key default gen_random_uuid(),
  owner_user uuid references public.users(id) on delete cascade,
  family_token text unique not null, -- Secure random token for sharing
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- 5. cart_items
-- Items within a cart. Snapshot price is critical for integrity.
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references public.family_carts(id) on delete cascade,
  product_id uuid references public.products(id),
  qty integer default 1,
  price_snapshot_cents integer, -- Snapshot price at time of add
  created_at timestamptz default now()
);

-- 6. orders
-- Finalized orders. Payment status is the source of truth.
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  cart_snapshot jsonb, -- Freeze cart state for history
  total_cents bigint,
  currency text,
  payment_status text default 'pending' check (payment_status in ('pending', 'succeeded', 'failed', 'refunded')),
  payment_provider text, -- e.g., 'paypal', 'stripe'
  payment_provider_response jsonb, -- Audit log of payment gateway response
  created_at timestamptz default now()
);

-- 7. favorites (hearts)
-- User wishlists.
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- 8. interactions
-- Analytics for every user action.
create table public.interactions (
  id bigserial primary key,
  user_id uuid references public.users(id),
  session_id text,
  event_type text, -- view_product, add_to_cart, favorite, checkout_click
  payload jsonb,
  created_at timestamptz default now()
);

-- 9. chat_messages (encrypted)
-- Secure chat storage. Content is encrypted application-side before insert.
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  message_enc bytea, -- Encrypted payload (contains iv + tag + ciphertext)
  role text check (role in ('user', 'assistant', 'system')),
  metadata jsonb, -- Non-sensitive metadata
  created_at timestamptz default now()
);

-- 10. embeddings (vector store)
-- For RAG and semantic search.
create table public.embeddings (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid, -- Reference to product_id or chunk_id
  vector vector(1536), -- OpenAI embedding size
  metadata jsonb,
  created_at timestamptz default now()
);

-- 11. idempotency_keys
-- Prevent duplicate operations (crucial for payments).
create table public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  key text unique,
  response jsonb,
  created_at timestamptz default now()
);

-- --- RLS Policies ---

-- Addresses: Users manage their own.
alter table public.addresses enable row level security;
create policy "addresses_owner_select" on public.addresses for select using (user_id = auth.uid());
create policy "addresses_owner_insert" on public.addresses for insert with check (user_id = auth.uid());
create policy "addresses_owner_update" on public.addresses for update using (user_id = auth.uid());
create policy "addresses_owner_delete" on public.addresses for delete using (user_id = auth.uid());

-- Orders: Users see their own, Admins see all.
alter table public.orders enable row level security;
create policy "orders_user_select" on public.orders for select using (user_id = auth.uid());
create policy "orders_user_insert" on public.orders for insert with check (user_id = auth.uid());
-- Only admins usually update orders (e.g. status changes), or system service role.
create policy "orders_admin_all" on public.orders for all using (
  exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'operator'))
);

-- Favorites: Users manage their own.
alter table public.favorites enable row level security;
create policy "favorites_owner_select" on public.favorites for select using (user_id = auth.uid());
create policy "favorites_owner_insert" on public.favorites for insert with check (user_id = auth.uid());
create policy "favorites_owner_delete" on public.favorites for delete using (user_id = auth.uid());

-- Interactions: Insert allowed for auth users, Select only for Admins.
alter table public.interactions enable row level security;
create policy "interactions_insert" on public.interactions for insert with check (auth.uid() is not null);
create policy "interactions_admin_select" on public.interactions for select using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Chat Messages: Users see their own.
alter table public.chat_messages enable row level security;
create policy "chat_owner" on public.chat_messages for all using (user_id = auth.uid());

-- Products: Public read, Admin write.
alter table public.products enable row level security;
create policy "products_public_read" on public.products for select using (true);
create policy "products_admin_write" on public.products for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Cart: Owners manage their own.
alter table public.family_carts enable row level security;
create policy "carts_owner" on public.family_carts for all using (owner_user = auth.uid());

-- Cart Items: Via Cart ownership.
alter table public.cart_items enable row level security;
create policy "cart_items_owner" on public.cart_items for all using (
  exists (select 1 from public.family_carts fc where fc.id = cart_items.cart_id and fc.owner_user = auth.uid())
);

-- --- Triggers & Functions ---

-- Trigger: Clear cart on successful order payment
create or replace function public.on_order_paid() returns trigger as $$
begin
  -- 1. Expire the cart
  update public.family_carts set expires_at = now() where id = (NEW.cart_snapshot->>'cart_id')::uuid;
  
  -- 2. Clear items (Optional: if we want to physically remove rows, or just rely on expiry)
  -- Here we delete to keep table clean, assuming snapshot is preserved in `orders.cart_snapshot`
  delete from public.cart_items where cart_id = (NEW.cart_snapshot->>'cart_id')::uuid;
  
  return NEW;
end; $$ language plpgsql;

create trigger trg_on_order_paid
after update on public.orders
for each row
when (OLD.payment_status <> 'succeeded' and NEW.payment_status = 'succeeded')
execute function public.on_order_paid();

-- Function: Stock Management (Optimistic Locking / Decrement)
create or replace function public.decrement_stock(p_product_id uuid, p_qty integer) returns boolean as $$
declare
  current_stock integer;
begin
  select stock into current_stock from public.products where id = p_product_id for update;
  
  if current_stock >= p_qty then
    update public.products set stock = stock - p_qty where id = p_product_id;
    return true;
  else
    return false;
  end if;
end; $$ language plpgsql security definer;
