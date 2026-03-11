-- =====================================================
-- EMERGENCY FIX v2: Fix RLS infinite recursion on admin_users
-- Problem: policies that do EXISTS(SELECT FROM admin_users) trigger
--   admin_users own RLS which self-references → 500 error
-- Solution: use SECURITY DEFINER functions instead of sub-queries
-- Run this ENTIRE file in Supabase SQL Editor
-- =====================================================

BEGIN;

-- =============================================================
-- STEP 1: Drop ALL existing policies on affected tables
-- =============================================================

DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('orders','order_items','admin_users','wallets',
                         'wallet_transactions','notifications','courier_profiles')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

-- =============================================================
-- STEP 2: SECURITY DEFINER helper functions (bypass RLS)
-- =============================================================

-- Maps auth.uid() → public.users.id
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user_id uuid;
BEGIN
  SELECT u.id INTO v_user_id
  FROM public.users u
  WHERE u.auth_id = auth.uid() OR u.id = auth.uid()
  LIMIT 1;
  RETURN v_user_id;
END;
$$;

-- Checks if current user is admin/staff (bypasses RLS on admin_users + users)
CREATE OR REPLACE FUNCTION public.is_staff_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid()
        AND COALESCE(au.is_active, true) = true
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE (u.auth_id = auth.uid() OR u.id = auth.uid())
        AND u.role IN ('admin', 'operator', 'courier', 'supervisor')
    )
  );
END;
$$;

-- Checks if current user is admin (bypasses RLS on admin_users)
CREATE OR REPLACE FUNCTION public.is_admin_like()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND COALESCE(au.is_active, true) = true
  );
END;
$$;

-- =============================================================
-- STEP 3: Orders
-- =============================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_select_own ON public.orders
FOR SELECT USING (
  user_id = auth.uid()
  OR user_id = public.current_app_user_id()
  OR recipient_user_id = auth.uid()
  OR payer_user_id = auth.uid()
  OR paid_by_user_id = auth.uid()
);

CREATE POLICY orders_select_staff ON public.orders
FOR SELECT USING ( public.is_staff_user() );

CREATE POLICY orders_insert_authenticated ON public.orders
FOR INSERT WITH CHECK (true);

CREATE POLICY orders_update_own ON public.orders
FOR UPDATE USING (
  user_id = auth.uid()
  OR user_id = public.current_app_user_id()
  OR recipient_user_id = auth.uid()
  OR payer_user_id = auth.uid()
  OR paid_by_user_id = auth.uid()
);

CREATE POLICY orders_update_staff ON public.orders
FOR UPDATE USING ( public.is_staff_user() )
WITH CHECK ( public.is_staff_user() );

CREATE POLICY orders_delete_staff ON public.orders
FOR DELETE USING ( public.is_staff_user() );

-- =============================================================
-- STEP 4: order_items
-- =============================================================

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY order_items_select ON public.order_items
FOR SELECT USING (true);

CREATE POLICY order_items_insert ON public.order_items
FOR INSERT WITH CHECK (true);

CREATE POLICY order_items_update_staff ON public.order_items
FOR UPDATE USING ( public.is_staff_user() );

-- =============================================================
-- STEP 5: admin_users (NO self-referencing sub-queries!)
-- =============================================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Self: can see own row
CREATE POLICY admin_users_select_self ON public.admin_users
FOR SELECT USING (id = auth.uid());

-- Admins see all: use SECURITY DEFINER function, NOT sub-query
CREATE POLICY admin_users_select_by_admin ON public.admin_users
FOR SELECT USING ( public.is_admin_like() );

-- =============================================================
-- STEP 6: wallets
-- =============================================================

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY wallets_select_own ON public.wallets
FOR SELECT USING (
  user_id = auth.uid()
  OR user_id = public.current_app_user_id()
);

CREATE POLICY wallets_staff ON public.wallets
FOR SELECT USING ( public.is_staff_user() );

CREATE POLICY wallets_update_own ON public.wallets
FOR UPDATE USING (
  user_id = auth.uid()
  OR user_id = public.current_app_user_id()
);

CREATE POLICY wallets_insert_own ON public.wallets
FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR user_id = public.current_app_user_id()
);

-- =============================================================
-- STEP 7: wallet_transactions
-- =============================================================

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY wt_select_own ON public.wallet_transactions
FOR SELECT USING (
  user_id = auth.uid()
  OR user_id = public.current_app_user_id()
);

CREATE POLICY wt_staff ON public.wallet_transactions
FOR SELECT USING ( public.is_staff_user() );

CREATE POLICY wt_insert ON public.wallet_transactions
FOR INSERT WITH CHECK (true);

-- =============================================================
-- STEP 8: notifications
-- =============================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notif_select_own ON public.notifications
FOR SELECT USING (
  user_id = auth.uid()
  OR user_id = public.current_app_user_id()
);

CREATE POLICY notif_update_own ON public.notifications
FOR UPDATE USING (
  user_id = auth.uid()
  OR user_id = public.current_app_user_id()
);

CREATE POLICY notif_insert ON public.notifications
FOR INSERT WITH CHECK (true);

-- =============================================================
-- STEP 9: courier_profiles
-- =============================================================

ALTER TABLE public.courier_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY courier_select_own ON public.courier_profiles
FOR SELECT USING (
  user_id = auth.uid()
  OR user_id = public.current_app_user_id()
);

CREATE POLICY courier_update_own ON public.courier_profiles
FOR UPDATE USING (
  user_id = auth.uid()
  OR user_id = public.current_app_user_id()
);

CREATE POLICY courier_staff ON public.courier_profiles
FOR SELECT USING ( public.is_staff_user() );

-- =============================================================
-- STEP 10: Grant permissions
-- =============================================================

GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.order_items TO authenticated;
GRANT SELECT ON public.admin_users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.wallets TO authenticated;
GRANT SELECT, INSERT ON public.wallet_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, UPDATE ON public.courier_profiles TO authenticated;

GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_like() TO authenticated;

COMMIT;
