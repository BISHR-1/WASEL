-- =====================================================
-- COMPREHENSIVE SECURITY SCHEMA - Enhanced Database Structure
-- Migration: 005_comprehensive_security_schema.sql
-- =====================================================

-- Extensions for security and performance
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgjwt";
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE - Enhanced with Security Fields
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  phone text,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('guest', 'user', 'courier', 'operator', 'admin')),
  password_hash text, -- For additional security layer
  email_verified boolean DEFAULT false,
  phone_verified boolean DEFAULT false,
  two_factor_enabled boolean DEFAULT false,
  two_factor_secret text,
  last_login_at timestamptz,
  login_attempts integer DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for security
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_locked_until ON public.users(locked_until) WHERE locked_until IS NOT NULL;

-- =====================================================
-- 2. ADDRESSES TABLE - Saved Addresses with Security
-- =====================================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  address_json jsonb NOT NULL, -- Encrypted address data
  address_hash text, -- Hash for integrity checking
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 3. PRODUCTS TABLE - Enhanced Product Management
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents > 0),
  price_lry integer, -- Computed or stored Lira equivalent
  currency text DEFAULT 'USD',
  stock integer DEFAULT 0 CHECK (stock >= 0),
  images jsonb,
  tags text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_active ON public.products(is_active) WHERE is_active = true;

-- =====================================================
-- 4. FAMILY_CARTS TABLE - Temporary Carts with Security
-- =====================================================
CREATE TABLE IF NOT EXISTS public.family_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user uuid REFERENCES public.users(id) ON DELETE CASCADE,
  family_token text UNIQUE NOT NULL, -- Secure random token
  session_id text, -- For tracking
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 5. CART_ITEMS TABLE - Cart Items with Price Snapshots
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES public.family_carts(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  qty integer DEFAULT 1 CHECK (qty > 0),
  price_snapshot_cents integer NOT NULL, -- Prevents price drift
  attributes_snapshot jsonb, -- Product attributes at time of adding
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 6. ORDERS TABLE - Comprehensive Order Management
-- =====================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES public.users(id),
  cart_snapshot jsonb NOT NULL, -- Complete cart snapshot
  shipping_address_snapshot jsonb NOT NULL, -- Encrypted address snapshot
  billing_address_snapshot jsonb, -- For payments
  total_cents bigint NOT NULL,
  currency text DEFAULT 'USD',
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
  payment_provider text CHECK (payment_provider IN ('paypal', 'stripe', 'bank_transfer', 'cash_on_delivery')),
  payment_provider_response jsonb, -- Encrypted payment data
  payment_intent_id text, -- For idempotency
  idempotency_key text UNIQUE,
  ip_address inet,
  user_agent text,
  session_id text,
  coupon_code text,
  discount_cents integer DEFAULT 0,
  tax_cents integer DEFAULT 0,
  shipping_cents integer DEFAULT 0,
  notes text,
  courier_id uuid REFERENCES public.users(id),
  courier_assigned_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance and security
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_idempotency_key ON public.orders(idempotency_key);

-- =====================================================
-- 7. FAVORITES TABLE - User Favorites/Hearts
-- =====================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- =====================================================
-- 8. INTERACTIONS TABLE - Every Click/Action Tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS public.interactions (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.users(id),
  session_id text NOT NULL,
  event_type text NOT NULL, -- view_product, add_to_cart, favorite, checkout_click, etc.
  payload jsonb, -- Event-specific data
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Partitioning for performance (optional)
-- CREATE TABLE public.interactions_y2024m01 PARTITION OF public.interactions FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Indexes
CREATE INDEX idx_interactions_user_session ON public.interactions(user_id, session_id);
CREATE INDEX idx_interactions_event_type ON public.interactions(event_type);
CREATE INDEX idx_interactions_created_at ON public.interactions(created_at DESC);

-- =====================================================
-- 9. CHAT_MESSAGES TABLE - Encrypted Chat Messages
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  session_id text NOT NULL,
  message_enc bytea NOT NULL, -- AES-256-GCM encrypted
  message_iv bytea NOT NULL, -- Initialization vector
  message_tag bytea NOT NULL, -- Authentication tag
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  metadata jsonb, -- Non-sensitive metadata
  embedding_id uuid, -- Reference to vector embedding
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chat_messages_user_session ON public.chat_messages(user_id, session_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- =====================================================
-- 10. EMBEDDINGS TABLE - Vector Store for AI
-- =====================================================
CREATE TABLE IF NOT EXISTS public.embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id uuid NOT NULL, -- Reference to product, message, etc.
  doc_type text NOT NULL, -- 'product', 'chat_message', 'faq', etc.
  vector vector(1536) NOT NULL, -- OpenAI ada-002 dimension
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes for vector search
CREATE INDEX idx_embeddings_vector ON public.embeddings USING ivfflat (vector vector_cosine_ops);
CREATE INDEX idx_embeddings_doc_type ON public.embeddings(doc_type);

-- =====================================================
-- 11. PAYMENTS TABLE - Enhanced Payment Tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  provider text NOT NULL CHECK (provider IN ('paypal', 'stripe', 'bank_transfer', 'cash')),
  provider_transaction_id text UNIQUE,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text DEFAULT 'USD',
  status text DEFAULT 'initiated' CHECK (status IN ('initiated', 'pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
  payment_method_details jsonb, -- Encrypted
  failure_reason text,
  refunded_amount_cents integer DEFAULT 0,
  refund_reason text,
  raw_provider_response bytea, -- Encrypted full response
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  succeeded_at timestamptz,
  failed_at timestamptz,
  refunded_at timestamptz
);

-- Indexes
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_provider_transaction_id ON public.payments(provider_transaction_id);

-- =====================================================
-- 12. AUDIT_LOGS TABLE - Legal Audit Trail
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  actor_type text DEFAULT 'user' CHECK (actor_type IN ('user', 'admin', 'system')),
  action_type text NOT NULL CHECK (action_type IN (
    'create', 'update', 'delete', 'login', 'logout',
    'payment_initiated', 'payment_succeeded', 'payment_failed',
    'security_alert', 'data_access', 'admin_action'
  )),
  target_table text NOT NULL,
  target_id uuid NOT NULL,
  old_value jsonb,
  new_value jsonb,
  change_reason text,
  ip_address inet,
  user_agent text,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for audit performance
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_target ON public.audit_logs(target_table, target_id);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- =====================================================
-- 13. IDEMPOTENCY_KEYS TABLE - Prevent Duplicates
-- =====================================================
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  user_id uuid REFERENCES public.users(id),
  endpoint text NOT NULL,
  request_hash text NOT NULL,
  response_status integer NOT NULL,
  response_body jsonb,
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 14. WEBHOOK_LOGS TABLE - PayPal Webhook Security
-- =====================================================
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL, -- 'paypal', 'stripe', etc.
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  payload bytea NOT NULL, -- Encrypted payload
  signature text,
  verified boolean DEFAULT false,
  processed boolean DEFAULT false,
  processing_attempts integer DEFAULT 0,
  last_attempt_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- =====================================================
-- 15. SECURITY_EVENTS TABLE - Security Monitoring
-- =====================================================
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL, -- 'failed_login', 'suspicious_activity', 'rate_limit_exceeded', etc.
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id uuid REFERENCES public.users(id),
  ip_address inet,
  user_agent text,
  details jsonb,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_security_events_type ON public.security_events(event_type);
CREATE INDEX idx_security_events_severity ON public.security_events(severity);
CREATE INDEX idx_security_events_created_at ON public.security_events(created_at DESC);

-- =====================================================
-- 16. RATE_LIMITING TABLE - API Rate Limiting
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- IP or user_id
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  window_end timestamptz DEFAULT (now() + interval '1 hour'),
  blocked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(identifier, endpoint, window_start)
);

-- =====================================================
-- 17. ENCRYPTION_KEYS TABLE - Key Management
-- =====================================================
CREATE TABLE IF NOT EXISTS public.encryption_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id text UNIQUE NOT NULL,
  key_data bytea NOT NULL, -- Encrypted master key
  algorithm text DEFAULT 'aes-256-gcm',
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 18. FINANCIAL_REPORTS TABLE - Automated Reports
-- =====================================================
CREATE TABLE IF NOT EXISTS public.financial_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL, -- 'daily', 'weekly', 'monthly'
  report_date date NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  total_orders integer DEFAULT 0,
  completed_orders integer DEFAULT 0,
  completion_rate numeric(5,2),
  total_revenue_cents bigint DEFAULT 0,
  net_revenue_cents bigint DEFAULT 0,
  total_delivery_fees_cents bigint DEFAULT 0,
  total_discounts_cents bigint DEFAULT 0,
  unique_customers integer DEFAULT 0,
  average_order_value_cents numeric(10,2),
  report_data jsonb, -- Additional metrics
  generated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_financial_reports_type_date ON public.financial_reports(report_type, report_date DESC);
CREATE UNIQUE INDEX idx_financial_reports_unique ON public.financial_reports(report_type, report_date);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
