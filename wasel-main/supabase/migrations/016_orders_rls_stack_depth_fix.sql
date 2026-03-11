-- =====================================================
-- Fix stack depth recursion in orders RLS policies
-- =====================================================

BEGIN;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Remove all existing policies on orders to eliminate recursive chains.
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', p.policyname);
  END LOOP;
END $$;

-- -----------------------------------------------------
-- SELECT policies (non-recursive)
-- -----------------------------------------------------

-- End users can read orders they own or participate in.
CREATE POLICY orders_select_participants_2026
ON public.orders
FOR SELECT
USING (
  user_id = auth.uid()
  OR recipient_user_id = auth.uid()
  OR payer_user_id = auth.uid()
  OR paid_by_user_id = auth.uid()
);

-- Staff in admin_users can read all orders.
CREATE POLICY orders_select_staff_2026
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND COALESCE(au.is_active, true) = true
      AND au.role IN ('admin', 'supervisor')
  )
);

-- Couriers can read orders assigned to them.
CREATE POLICY orders_select_courier_assigned_2026
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.order_assignments oa
    WHERE oa.order_id = orders.id
      AND oa.delivery_person_id = auth.uid()
      AND COALESCE(oa.status, 'assigned') IN ('assigned', 'accepted', 'in_progress', 'delivering', 'completed')
  )
);

-- -----------------------------------------------------
-- INSERT / UPDATE policies (non-recursive)
-- -----------------------------------------------------

-- Customer inserts own order.
CREATE POLICY orders_insert_owner_2026
ON public.orders
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR recipient_user_id = auth.uid()
  OR payer_user_id = auth.uid()
);

-- Staff can insert orders.
CREATE POLICY orders_insert_staff_2026
ON public.orders
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND COALESCE(au.is_active, true) = true
      AND au.role IN ('admin', 'supervisor')
  )
);

-- Customer updates participant-related orders.
CREATE POLICY orders_update_participants_2026
ON public.orders
FOR UPDATE
USING (
  user_id = auth.uid()
  OR recipient_user_id = auth.uid()
  OR payer_user_id = auth.uid()
  OR paid_by_user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
  OR recipient_user_id = auth.uid()
  OR payer_user_id = auth.uid()
  OR paid_by_user_id = auth.uid()
);

-- Staff can update all orders.
CREATE POLICY orders_update_staff_2026
ON public.orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND COALESCE(au.is_active, true) = true
      AND au.role IN ('admin', 'supervisor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND COALESCE(au.is_active, true) = true
      AND au.role IN ('admin', 'supervisor')
  )
);

-- Couriers can update only assigned orders.
CREATE POLICY orders_update_courier_assigned_2026
ON public.orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.order_assignments oa
    WHERE oa.order_id = orders.id
      AND oa.delivery_person_id = auth.uid()
      AND COALESCE(oa.status, 'assigned') IN ('assigned', 'accepted', 'in_progress', 'delivering')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.order_assignments oa
    WHERE oa.order_id = orders.id
      AND oa.delivery_person_id = auth.uid()
      AND COALESCE(oa.status, 'assigned') IN ('assigned', 'accepted', 'in_progress', 'delivering')
  )
);

COMMIT;
