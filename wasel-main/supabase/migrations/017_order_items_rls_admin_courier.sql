-- =====================================================
-- FIX: order_items RLS for admin/supervisor/courier roles
-- Migration: 017_order_items_rls_admin_courier.sql
-- Problem: Drivers and supervisors can't read order items due to RLS
-- =====================================================

BEGIN;

-- Drop existing broken policies if they exist
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Couriers can view assigned order items" ON public.order_items;

-- Allow admin/supervisor/operator/support users to read ALL order items
CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  USING (
    -- Check users table for admin roles
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE (u.id = auth.uid() OR u.auth_id = auth.uid())
        AND u.role IN ('admin', 'super_admin', 'supervisor', 'operator', 'support')
    )
    OR
    -- Check admin_users table for staff roles
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid()
        AND au.role IN ('admin', 'supervisor', 'operator', 'support')
        AND au.is_active = true
    )
  );

-- Allow couriers/delivery_person to read items for orders assigned to them
CREATE POLICY "Couriers can view assigned order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.order_assignments oa
      WHERE oa.order_id = order_items.order_id
        AND oa.delivery_person_id = auth.uid()
    )
  );

-- Allow order creators to read their own items
CREATE POLICY "Order creator can view own items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

COMMIT;
