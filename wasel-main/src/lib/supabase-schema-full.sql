-- Profiles Table (for saving user details)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  full_name text,
  phone text,
  address text,
  country text,
  whatsapp text,
  saved_recipients jsonb default '[]'::jsonb, -- Array of saved recipients
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for Profiles
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Orders Table (Ensure it exists)
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id), -- Nullable for guest checkout? Maybe link by email too
  user_email text, -- For tracking by email
  status text default 'pending', -- pending, processing, delivering, completed, cancelled
  total_amount numeric,
  currency text default 'USD',
  sender_details jsonb,
  recipient_details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for Orders
alter table orders enable row level security;
create policy "Users can view own orders" on orders for select using (auth.uid() = user_id or user_email = auth.email());
create policy "Anyone can create orders" on orders for insert with check (true); -- Public insert for unauth users?

-- Order Items Table
create table if not exists order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade,
  product_name text,
  product_id text, -- ID from source system
  quantity integer,
  price numeric,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for Order Items
alter table order_items enable row level security;
create policy "Users can view own order items" on order_items for select using (
  exists (select 1 from orders where orders.id = order_items.order_id and (orders.user_id = auth.uid() or orders.user_email = auth.email()))
);
create policy "Anyone can insert order items" on order_items for insert with check (true);

-- Reviews Table (Updated for Item Level)
-- Drop existing if needed or alter. For now, assume we can alter or create new.
-- We'll create 'product_reviews' to handle item specific reviews
create table if not exists product_reviews (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id),
  order_item_id uuid references order_items(id),
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table product_reviews enable row level security;
create policy "Public read reviews" on product_reviews for select using (true);
create policy "Users can create reviews" on product_reviews for insert with check (true);
