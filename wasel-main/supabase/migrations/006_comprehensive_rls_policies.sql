-- =====================================================
-- COMPREHENSIVE RLS POLICIES - Row Level Security
-- Migration: 006_comprehensive_rls_policies.sql
-- =====================================================

-- =====================================================
-- 1. USERS TABLE - RLS Policies
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "users_read_own" ON public.users
  FOR SELECT USING (auth.uid() = auth_id);

-- Users can update their own data (except sensitive fields)
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id)
  WITH CHECK (
    auth.uid() = auth_id
    AND role = (SELECT role FROM public.users WHERE auth_id = auth.uid()) -- Prevent role escalation
  );

-- Admins can read all users
CREATE POLICY "users_admin_read" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'operator')
    )
  );

-- Admins can update users (with restrictions)
CREATE POLICY "users_admin_update" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'operator')
    )
  );

-- =====================================================
-- 2. ADDRESSES TABLE - RLS Policies
-- =====================================================
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses_owner" ON public.addresses
  FOR ALL USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- =====================================================
-- 3. PRODUCTS TABLE - RLS Policies
-- =====================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Everyone can read active products
CREATE POLICY "products_read_active" ON public.products
  FOR SELECT USING (is_active = true);

-- Admins can manage all products
CREATE POLICY "products_admin_all" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'operator')
    )
  );

-- =====================================================
-- 4. FAMILY_CARTS TABLE - RLS Policies
-- =====================================================
ALTER TABLE public.family_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_carts_owner" ON public.family_carts
  FOR ALL USING (owner_user = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- =====================================================
-- 5. CART_ITEMS TABLE - RLS Policies
-- =====================================================
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_items_owner" ON public.cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.family_carts fc
      WHERE fc.id = cart_id
      AND fc.owner_user = (SELECT id FROM public.users WHERE auth_id = auth.uid())
    )
  );

-- =====================================================
-- 6. ORDERS TABLE - RLS Policies
-- =====================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own orders
CREATE POLICY "orders_user_read" ON public.orders
  FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Users can create their own orders
CREATE POLICY "orders_user_insert" ON public.orders
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Users can update their pending orders only
CREATE POLICY "orders_user_update" ON public.orders
  FOR UPDATE USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
    AND payment_status = 'pending'
  );

-- Couriers can read assigned orders
CREATE POLICY "orders_courier_read" ON public.orders
  FOR SELECT USING (
    courier_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid()
      AND role = 'courier'
    )
  );

-- Couriers can update shipping status of assigned orders
CREATE POLICY "orders_courier_update" ON public.orders
  FOR UPDATE USING (courier_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()))
  WITH CHECK (
    courier_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
    AND payment_status = (SELECT payment_status FROM public.orders WHERE id = orders.id) -- Prevent payment status changes
  );

-- Admins can read all orders
CREATE POLICY "orders_admin_read" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'operator')
    )
  );

-- Admins can update any order
CREATE POLICY "orders_admin_update" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'operator')
    )
  );

-- =====================================================
-- 7. FAVORITES TABLE - RLS Policies
-- =====================================================
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_owner" ON public.favorites
  FOR ALL USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- =====================================================
-- 8. INTERACTIONS TABLE - RLS Policies
-- =====================================================
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own interactions
CREATE POLICY "interactions_user_insert" ON public.interactions
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Users can read their own interactions
CREATE POLICY "interactions_user_read" ON public.interactions
  FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Admins can read all interactions
CREATE POLICY "interactions_admin_read" ON public.interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'operator')
    )
  );

-- =====================================================
-- 9. CHAT_MESSAGES TABLE - RLS Policies
-- =====================================================
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_owner" ON public.chat_messages
  FOR ALL USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- =====================================================
-- 10. EMBEDDINGS TABLE - RLS Policies
-- =====================================================
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- Read access for AI functionality (authenticated users)
CREATE POLICY "embeddings_read" ON public.embeddings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin write access
CREATE POLICY "embeddings_admin_write" ON public.embeddings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'operator')
    )
  );

-- =====================================================
-- 11. PAYMENTS TABLE - RLS Policies
-- =====================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "payments_user_read" ON public.payments
  FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- System can insert payments (via functions)
CREATE POLICY "payments_system_insert" ON public.payments
  FOR INSERT WITH CHECK (true);

-- Admins can read all payments
CREATE POLICY "payments_admin_read" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'operator')
    )
  );

-- =====================================================
-- 12. AUDIT_LOGS TABLE - RLS Policies
-- =====================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "audit_logs_admin_read" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'operator')
    )
  );

-- System can insert audit logs
CREATE POLICY "audit_logs_system_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 13. IDEMPOTENCY_KEYS TABLE - RLS Policies
-- =====================================================
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "idempotency_keys_owner" ON public.idempotency_keys
  FOR ALL USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- =====================================================
-- 14. WEBHOOK_LOGS TABLE - RLS Policies
-- =====================================================
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can access webhook logs
CREATE POLICY "webhook_logs_admin" ON public.webhook_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'operator')
    )
  );

-- =====================================================
-- 15. SECURITY_EVENTS TABLE - RLS Policies
-- =====================================================
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can access security events
CREATE POLICY "security_events_admin" ON public.security_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'operator')
    )
  );

-- =====================================================
-- 16. RATE_LIMITS TABLE - RLS Policies
-- =====================================================
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- System access only
CREATE POLICY "rate_limits_system" ON public.rate_limits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'operator')
    )
  );

-- =====================================================
-- 17. ENCRYPTION_KEYS TABLE - RLS Policies
-- =====================================================
ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;

-- Only system/admin access to encryption keys
CREATE POLICY "encryption_keys_admin" ON public.encryption_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- 18. FINANCIAL_REPORTS TABLE - RLS Policies
-- =====================================================
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;

-- Only admins can access financial reports
CREATE POLICY "financial_reports_admin" ON public.financial_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'operator')
    )
  );

-- =====================================================
-- RLS POLICIES COMPLETE
-- =====================================================
