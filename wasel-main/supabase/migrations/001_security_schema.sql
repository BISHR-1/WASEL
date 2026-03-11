-- =====================================================
-- WASEL SECURITY SCHEMA - Complete Database Structure
-- =====================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- for text search
CREATE EXTENSION IF NOT EXISTS "vector";       -- pgvector for embeddings

-- =====================================================
-- 1. USERS TABLE (Enhanced)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('guest', 'user', 'courier', 'operator', 'admin')),
  password_hash TEXT, -- bcrypt hashed
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT, -- encrypted
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_created ON public.users(created_at DESC);

-- =====================================================
-- 2. ADDRESSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL, -- 'home', 'work', 'other'
  full_address TEXT NOT NULL,
  city TEXT,
  region TEXT,
  country TEXT DEFAULT 'Syria',
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address_json JSONB,
  is_default BOOLEAN DEFAULT false,
  delivery_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_addresses_user ON public.addresses(user_id);
CREATE INDEX idx_addresses_default ON public.addresses(user_id, is_default) WHERE is_default = true;

-- =====================================================
-- 3. PRODUCTS TABLE (Enhanced)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0), -- USD cents
  price_lira INTEGER, -- Syrian Lira
  original_price_cents INTEGER, -- for discounts
  currency TEXT DEFAULT 'USD',
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  reserved_stock INTEGER DEFAULT 0 CHECK (reserved_stock >= 0),
  low_stock_threshold INTEGER DEFAULT 5,
  images JSONB DEFAULT '[]', -- array of image URLs
  thumbnail_url TEXT,
  attributes JSONB DEFAULT '{}', -- color, size, etc.
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  rating_avg DECIMAL(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX idx_products_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_price ON public.products(price_cents);
CREATE INDEX idx_products_stock ON public.products(stock) WHERE stock > 0;
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_tags ON public.products USING gin(tags);
CREATE INDEX idx_products_title_trgm ON public.products USING gin(title gin_trgm_ops);

-- =====================================================
-- 4. FAMILY CARTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.family_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  family_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  name TEXT DEFAULT 'My Cart',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'checkout', 'completed', 'expired')),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  shared_with UUID[] DEFAULT '{}', -- other user IDs
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_family_carts_owner ON public.family_carts(owner_user_id);
CREATE INDEX idx_family_carts_token ON public.family_carts(family_token);
CREATE INDEX idx_family_carts_status ON public.family_carts(status) WHERE status = 'active';
CREATE INDEX idx_family_carts_expires ON public.family_carts(expires_at) WHERE status = 'active';

-- =====================================================
-- 5. CART ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES public.family_carts(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  price_snapshot_cents INTEGER NOT NULL, -- snapshot at add time
  price_snapshot_lira INTEGER,
  attributes_snapshot JSONB DEFAULT '{}', -- selected options
  added_by_user_id UUID REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cart_id, product_id, attributes_snapshot)
);

CREATE INDEX idx_cart_items_cart ON public.cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON public.cart_items(product_id);

-- =====================================================
-- 6. ORDERS TABLE (Enhanced)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL, -- human readable: WAS-20260205-XXXX
  user_id UUID REFERENCES public.users(id) NOT NULL,
  cart_id UUID REFERENCES public.family_carts(id),
  
  -- Cart snapshot (immutable)
  cart_snapshot JSONB NOT NULL,
  items_count INTEGER NOT NULL,
  
  -- Pricing
  subtotal_cents BIGINT NOT NULL,
  discount_cents BIGINT DEFAULT 0,
  shipping_cents BIGINT DEFAULT 0,
  tax_cents BIGINT DEFAULT 0,
  total_cents BIGINT NOT NULL,
  currency TEXT DEFAULT 'USD',
  exchange_rate DECIMAL(10,4), -- USD to LYR at order time
  
  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded')),
  payment_provider TEXT, -- 'paypal', 'bank_transfer', 'cash_on_delivery'
  payment_provider_order_id TEXT,
  payment_provider_response JSONB,
  paid_at TIMESTAMPTZ,
  
  -- Shipping
  shipping_address JSONB NOT NULL,
  shipping_method TEXT,
  shipping_status TEXT DEFAULT 'pending' CHECK (shipping_status IN ('pending', 'processing', 'shipped', 'in_transit', 'delivered', 'returned', 'cancelled')),
  tracking_number TEXT,
  estimated_delivery TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Courier
  courier_id UUID REFERENCES public.users(id),
  courier_assigned_at TIMESTAMPTZ,
  
  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_number ON public.orders(order_number);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_shipping_status ON public.orders(shipping_status);
CREATE INDEX idx_orders_courier ON public.orders(courier_id) WHERE courier_id IS NOT NULL;
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX idx_orders_idempotency ON public.orders(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- =====================================================
-- 7. FAVORITES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_favorites_product ON public.favorites(product_id);

-- =====================================================
-- 8. INTERACTIONS TABLE (Analytics)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.interactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- view_product, add_to_cart, remove_from_cart, favorite, unfavorite, checkout_start, checkout_complete, search, page_view, button_click
  event_category TEXT, -- product, cart, checkout, navigation, search
  target_id TEXT, -- product_id, page_name, etc.
  target_type TEXT, -- product, page, button, etc.
  payload JSONB DEFAULT '{}',
  page_url TEXT,
  referrer_url TEXT,
  device_type TEXT, -- mobile, tablet, desktop
  browser TEXT,
  os TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_interactions_user ON public.interactions(user_id);
CREATE INDEX idx_interactions_session ON public.interactions(session_id);
CREATE INDEX idx_interactions_event ON public.interactions(event_type);
CREATE INDEX idx_interactions_target ON public.interactions(target_id);
CREATE INDEX idx_interactions_created ON public.interactions(created_at DESC);

-- Partition by month for performance (optional - implement if needed)
-- CREATE TABLE public.interactions_2026_02 PARTITION OF public.interactions
-- FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- =====================================================
-- 9. CHAT MESSAGES TABLE (Encrypted)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL,
  message_enc BYTEA NOT NULL, -- AES-256-GCM encrypted
  encryption_iv BYTEA NOT NULL, -- 12 bytes for GCM
  encryption_tag BYTEA NOT NULL, -- 16 bytes auth tag
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  tokens_used INTEGER,
  model_used TEXT,
  response_time_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_session ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at DESC);

-- =====================================================
-- 10. EMBEDDINGS TABLE (Vector Store)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL, -- 'product', 'chat_message', 'faq', 'category'
  source_id UUID NOT NULL,
  content_hash TEXT NOT NULL, -- to detect changes
  embedding vector(1536) NOT NULL, -- OpenAI ada-002 dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_type, source_id)
);

CREATE INDEX idx_embeddings_source ON public.embeddings(source_type, source_id);
CREATE INDEX idx_embeddings_vector ON public.embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =====================================================
-- 11. IDEMPOTENCY KEYS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.users(id),
  endpoint TEXT NOT NULL,
  request_hash TEXT NOT NULL, -- hash of request body
  response_status INTEGER,
  response_body JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

CREATE INDEX idx_idempotency_key ON public.idempotency_keys(key);
CREATE INDEX idx_idempotency_expires ON public.idempotency_keys(expires_at);

-- =====================================================
-- 12. AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, PAYMENT, etc.
  table_name TEXT,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- =====================================================
-- 13. RATE LIMITS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- user_id or IP
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  window_end TIMESTAMPTZ DEFAULT (now() + interval '1 minute'),
  UNIQUE(identifier, endpoint, window_start)
);

CREATE INDEX idx_rate_limits_identifier ON public.rate_limits(identifier, endpoint);
CREATE INDEX idx_rate_limits_window ON public.rate_limits(window_end);

-- =====================================================
-- 14. WEBHOOK LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 'paypal', 'stripe', etc.
  event_type TEXT NOT NULL,
  event_id TEXT, -- provider's event ID
  payload JSONB NOT NULL,
  signature TEXT,
  signature_valid BOOLEAN,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_webhook_logs_provider ON public.webhook_logs(provider);
CREATE INDEX idx_webhook_logs_event ON public.webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_processed ON public.webhook_logs(processed) WHERE processed = false;

-- =====================================================
-- 15. REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  images JSONB DEFAULT '[]',
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id, order_id)
);

CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_approved ON public.reviews(is_approved) WHERE is_approved = true;

-- =====================================================
-- 16. COUPONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value INTEGER NOT NULL, -- percentage or cents
  min_order_cents INTEGER DEFAULT 0,
  max_discount_cents INTEGER,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  user_limit INTEGER DEFAULT 1, -- per user
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  applicable_categories TEXT[],
  applicable_products UUID[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_active ON public.coupons(is_active) WHERE is_active = true;

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
    AND table_schema = 'public'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;
      CREATE TRIGGER trg_%I_updated_at
      BEFORE UPDATE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
    ', t, t, t, t);
  END LOOP;
END;
$$;

-- Function: Generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  today_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM public.orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  NEW.order_number = 'WAS-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_number
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- Function: Clear cart on order success
CREATE OR REPLACE FUNCTION public.on_order_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.payment_status <> 'succeeded' AND NEW.payment_status = 'succeeded' THEN
    -- Mark cart as completed
    UPDATE public.family_carts 
    SET status = 'completed', updated_at = now()
    WHERE id = NEW.cart_id;
    
    -- Delete cart items
    DELETE FROM public.cart_items WHERE cart_id = NEW.cart_id;
    
    -- Update product order counts
    UPDATE public.products p
    SET order_count = order_count + (item->>'quantity')::INTEGER
    FROM jsonb_array_elements(NEW.cart_snapshot->'items') AS item
    WHERE p.id = (item->>'product_id')::UUID;
    
    -- Log audit
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (NEW.user_id, 'PAYMENT_SUCCESS', 'orders', NEW.id::TEXT, 
            jsonb_build_object('order_number', NEW.order_number, 'total_cents', NEW.total_cents));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_order_paid
AFTER UPDATE ON public.orders
FOR EACH ROW
WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
EXECUTE FUNCTION public.on_order_paid();

-- Function: Reserve stock on cart add
CREATE OR REPLACE FUNCTION public.reserve_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET reserved_stock = reserved_stock + NEW.quantity
  WHERE id = NEW.product_id
  AND stock - reserved_stock >= NEW.quantity;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reserve_stock
AFTER INSERT ON public.cart_items
FOR EACH ROW EXECUTE FUNCTION public.reserve_stock();

-- Function: Release stock on cart item delete
CREATE OR REPLACE FUNCTION public.release_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET reserved_stock = GREATEST(0, reserved_stock - OLD.quantity)
  WHERE id = OLD.product_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_release_stock
AFTER DELETE ON public.cart_items
FOR EACH ROW EXECUTE FUNCTION public.release_stock();

-- Function: Update product rating
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET 
    rating_avg = (SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND is_approved = true),
    rating_count = (SELECT COUNT(*) FROM public.reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND is_approved = true)
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_product_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();

-- Function: Ensure only one default address
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id <> NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_default_address
BEFORE INSERT OR UPDATE ON public.addresses
FOR EACH ROW
WHEN (NEW.is_default = true)
EXECUTE FUNCTION public.ensure_single_default_address();

-- Function: Clean expired data
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS void AS $$
BEGIN
  -- Delete expired carts
  DELETE FROM public.family_carts 
  WHERE expires_at < now() AND status = 'active';
  
  -- Delete expired idempotency keys
  DELETE FROM public.idempotency_keys 
  WHERE expires_at < now();
  
  -- Delete old rate limit records
  DELETE FROM public.rate_limits 
  WHERE window_end < now() - interval '1 hour';
  
  -- Archive old interactions (optional - move to archive table)
  -- DELETE FROM public.interactions WHERE created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function: Check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_limit INTEGER DEFAULT 100,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := date_trunc('minute', now());
  
  INSERT INTO public.rate_limits (identifier, endpoint, window_start, window_end)
  VALUES (p_identifier, p_endpoint, v_window_start, v_window_start + (p_window_seconds || ' seconds')::interval)
  ON CONFLICT (identifier, endpoint, window_start) 
  DO UPDATE SET request_count = public.rate_limits.request_count + 1
  RETURNING request_count INTO v_count;
  
  RETURN v_count <= p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Search products with vector similarity
CREATE OR REPLACE FUNCTION public.search_products_semantic(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  product_id UUID,
  title TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.source_id as product_id,
    p.title,
    1 - (e.embedding <=> query_embedding) as similarity
  FROM public.embeddings e
  JOIN public.products p ON p.id = e.source_id
  WHERE e.source_type = 'product'
  AND p.is_active = true
  AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CLEANUP & MAINTENANCE
-- =====================================================

-- Schedule cleanup (run via pg_cron or external scheduler)
-- SELECT cron.schedule('cleanup-expired', '0 * * * *', 'SELECT public.cleanup_expired_data()');

COMMENT ON TABLE public.users IS 'User accounts with roles and security fields';
COMMENT ON TABLE public.orders IS 'Orders with payment and shipping tracking';
COMMENT ON TABLE public.chat_messages IS 'Encrypted chat messages with AI assistant';
COMMENT ON TABLE public.embeddings IS 'Vector embeddings for semantic search';
COMMENT ON TABLE public.interactions IS 'User interaction events for analytics';
