-- =====================================================
-- حل مشكلة "user_id does not exist"
-- Fix for "user_id does not exist" error
-- =====================================================
-- نفذ هذا الملف في Supabase SQL Editor
-- Run this file in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- الخطوة 1: حذف جميع الـ policies القديمة
-- Step 1: Drop all old policies
-- =====================================================

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- حذف جميع policies التي تحتوي على user_id
    FOR r IN 
        SELECT 
            n.nspname AS schema_name,
            c.relname AS table_name,
            pol.polname AS policy_name
        FROM pg_policy pol
        JOIN pg_class c ON pol.polrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE;', 
            r.policy_name, r.schema_name, r.table_name);
        RAISE NOTICE 'تم حذف: %.%.%', r.schema_name, r.table_name, r.policy_name;
    END LOOP;
END $$;

-- =====================================================
-- الخطوة 2: إعادة إنشاء الـ policies بشكل صحيح
-- Step 2: Recreate policies correctly
-- =====================================================

-- تأكد من تفعيل RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Policies للقراءة العامة (Public Read)
-- =====================================================

CREATE POLICY "public_read_restaurants" 
  ON public.restaurants FOR SELECT 
  USING (is_active = true);

CREATE POLICY "public_read_menu_items" 
  ON public.menu_items FOR SELECT 
  USING (is_available = true);

CREATE POLICY "public_read_products" 
  ON public.products FOR SELECT 
  USING (is_available = true);

CREATE POLICY "public_read_gifts" 
  ON public.gifts FOR SELECT 
  USING (is_available = true);

CREATE POLICY "public_read_packages" 
  ON public.packages FOR SELECT 
  USING (is_active = true);

-- =====================================================
-- Policies لجدول Users
-- =====================================================

CREATE POLICY "users_select_own" 
  ON public.users FOR SELECT 
  USING (auth.uid() = auth_id);

CREATE POLICY "users_update_own" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = auth_id);

-- =====================================================
-- Policies لجدول Orders
-- =====================================================

CREATE POLICY "orders_select_own" 
  ON public.orders FOR SELECT 
  USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

CREATE POLICY "orders_insert_own" 
  ON public.orders FOR INSERT 
  WITH CHECK (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- =====================================================
-- Policies لجدول Order Items
-- =====================================================

CREATE POLICY "order_items_select_own" 
  ON public.order_items FOR SELECT 
  USING (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
    )
  );

-- =====================================================
-- Policies لجدول Cart
-- =====================================================

CREATE POLICY "cart_all_own" 
  ON public.cart FOR ALL 
  USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- =====================================================
-- Policies لجدول Favorites
-- =====================================================

CREATE POLICY "favorites_all_own" 
  ON public.favorites FOR ALL 
  USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- =====================================================
-- Policies لجدول Addresses
-- =====================================================

CREATE POLICY "addresses_all_own" 
  ON public.addresses FOR ALL 
  USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- =====================================================
-- Policies لجدول Notifications
-- =====================================================

CREATE POLICY "notifications_select_own" 
  ON public.notifications FOR SELECT 
  USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

CREATE POLICY "notifications_update_own" 
  ON public.notifications FOR UPDATE 
  USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- =====================================================
-- Policies لجدول Reviews
-- =====================================================

CREATE POLICY "reviews_select_all" 
  ON public.reviews FOR SELECT 
  USING (true);

CREATE POLICY "reviews_insert_own" 
  ON public.reviews FOR INSERT 
  WITH CHECK (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

CREATE POLICY "reviews_update_own" 
  ON public.reviews FOR UPDATE 
  USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

CREATE POLICY "reviews_delete_own" 
  ON public.reviews FOR DELETE 
  USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- =====================================================
-- النهاية - تم إصلاح جميع الـ Policies
-- Done - All policies fixed
-- =====================================================

-- للتحقق من النتيجة:
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
