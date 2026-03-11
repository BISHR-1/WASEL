-- =====================================================
-- WASEL ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- =====================================================
-- 1. USERS TABLE RLS
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = auth.uid());

-- Users can update their own data (except role)
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.users WHERE id = auth.uid()));

-- Admins can read all users
CREATE POLICY "users_admin_select" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update all users
CREATE POLICY "users_admin_update" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- 2. ADDRESSES TABLE RLS
-- =====================================================
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own addresses
CREATE POLICY "addresses_owner_all" ON public.addresses
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 3. PRODUCTS TABLE RLS
-- =====================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Everyone can read active products
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (is_active = true);

-- Admins can read all products
CREATE POLICY "products_admin_read" ON public.products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'operator'))
  );

-- Only admins/operators can insert/update products
CREATE POLICY "products_admin_insert" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'operator'))
  );

CREATE POLICY "products_admin_update" ON public.products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'operator'))
  );

-- =====================================================
-- 4. FAMILY CARTS TABLE RLS
-- =====================================================
ALTER TABLE public.family_carts ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own carts
CREATE POLICY "carts_owner_select" ON public.family_carts
  FOR SELECT USING (
    owner_user_id = auth.uid() OR auth.uid() = ANY(shared_with)
  );

CREATE POLICY "carts_owner_insert" ON public.family_carts
  FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "carts_owner_update" ON public.family_carts
  FOR UPDATE USING (
    owner_user_id = auth.uid() OR auth.uid() = ANY(shared_with)
  );

CREATE POLICY "carts_owner_delete" ON public.family_carts
  FOR DELETE USING (owner_user_id = auth.uid());

-- =====================================================
-- 5. CART ITEMS TABLE RLS
-- =====================================================
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Users can CRUD items in their carts
CREATE POLICY "cart_items_owner_all" ON public.cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.family_carts 
      WHERE id = cart_items.cart_id 
      AND (owner_user_id = auth.uid() OR auth.uid() = ANY(shared_with))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_carts 
      WHERE id = cart_items.cart_id 
      AND (owner_user_id = auth.uid() OR auth.uid() = ANY(shared_with))
    )
  );

-- =====================================================
-- 6. ORDERS TABLE RLS
-- =====================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own orders
CREATE POLICY "orders_user_select" ON public.orders
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own orders
CREATE POLICY "orders_user_insert" ON public.orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Couriers can see assigned orders
CREATE POLICY "orders_courier_select" ON public.orders
  FOR SELECT USING (
    courier_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'courier')
  );

-- Couriers can update shipping status of assigned orders
CREATE POLICY "orders_courier_update" ON public.orders
  FOR UPDATE USING (courier_id = auth.uid())
  WITH CHECK (
    courier_id = auth.uid() AND
    -- Only allow updating shipping-related fields
    payment_status = (SELECT payment_status FROM public.orders WHERE id = orders.id)
  );

-- Admins/Operators can read all orders
CREATE POLICY "orders_admin_select" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'operator'))
  );

-- Admins can update any order
CREATE POLICY "orders_admin_update" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'operator'))
  );

-- =====================================================
-- 7. FAVORITES TABLE RLS
-- =====================================================
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own favorites
CREATE POLICY "favorites_owner_all" ON public.favorites
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 8. INTERACTIONS TABLE RLS
-- =====================================================
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own interactions
CREATE POLICY "interactions_insert" ON public.interactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR user_id IS NULL
  );

-- Users cannot read interactions (analytics only)
-- Only admins can read
CREATE POLICY "interactions_admin_select" ON public.interactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- 9. CHAT MESSAGES TABLE RLS
-- =====================================================
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own messages
CREATE POLICY "chat_messages_owner_all" ON public.chat_messages
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 10. EMBEDDINGS TABLE RLS
-- =====================================================
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- Public read for product embeddings (for search)
CREATE POLICY "embeddings_public_read" ON public.embeddings
  FOR SELECT USING (source_type = 'product');

-- Users can read their own chat embeddings
CREATE POLICY "embeddings_user_chat" ON public.embeddings
  FOR SELECT USING (
    source_type = 'chat_message' AND
    EXISTS (SELECT 1 FROM public.chat_messages WHERE id = embeddings.source_id AND user_id = auth.uid())
  );

-- Only service role can insert/update embeddings
CREATE POLICY "embeddings_service_insert" ON public.embeddings
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
  );

-- =====================================================
-- 11. AUDIT LOGS TABLE RLS
-- =====================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role can insert
CREATE POLICY "audit_logs_service_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 12. WEBHOOK LOGS TABLE RLS
-- =====================================================
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read webhook logs
CREATE POLICY "webhook_logs_admin_select" ON public.webhook_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role can insert/update
CREATE POLICY "webhook_logs_service_all" ON public.webhook_logs
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 13. REVIEWS TABLE RLS
-- =====================================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can read approved reviews
CREATE POLICY "reviews_public_read" ON public.reviews
  FOR SELECT USING (is_approved = true);

-- Users can read their own reviews (even unapproved)
CREATE POLICY "reviews_owner_read" ON public.reviews
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert reviews for products they ordered
CREATE POLICY "reviews_user_insert" ON public.reviews
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE user_id = auth.uid() 
      AND payment_status = 'succeeded'
      AND cart_snapshot::text LIKE '%' || product_id::text || '%'
    )
  );

-- Users can update their own reviews
CREATE POLICY "reviews_owner_update" ON public.reviews
  FOR UPDATE USING (user_id = auth.uid());

-- Admins can manage all reviews
CREATE POLICY "reviews_admin_all" ON public.reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'operator'))
  );

-- =====================================================
-- 14. COUPONS TABLE RLS
-- =====================================================
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Everyone can read active coupons (code only, for validation)
CREATE POLICY "coupons_public_read" ON public.coupons
  FOR SELECT USING (is_active = true AND valid_until > now());

-- Admins can manage coupons
CREATE POLICY "coupons_admin_all" ON public.coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- 15. IDEMPOTENCY KEYS TABLE RLS
-- =====================================================
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Users can read/insert their own idempotency keys
CREATE POLICY "idempotency_user_all" ON public.idempotency_keys
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- =====================================================
-- 16. RATE LIMITS TABLE RLS
-- =====================================================
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role only
CREATE POLICY "rate_limits_service" ON public.rate_limits
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on tables
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.coupons TO anon;
GRANT SELECT ON public.embeddings TO anon;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
