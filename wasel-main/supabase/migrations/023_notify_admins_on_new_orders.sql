-- =====================================================
-- Notify Admins on Every New Order (DB-level guarantee)
-- Migration: 023_notify_admins_on_new_orders.sql
-- Purpose: ensure admin/supervisor notifications are always created,
-- regardless of frontend flow/RPC path.
-- =====================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.notify_admins_on_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_message text;
  v_link text;
BEGIN
  v_title := 'طلب جديد في النظام';
  v_message := format('تم إنشاء الطلب %s', COALESCE(NEW.order_number, NEW.id::text));
  v_link := '/TrackOrder?order=' || COALESCE(NEW.order_number, NEW.id::text);

  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    link,
    created_at
  )
  SELECT
    u.id,
    v_title,
    v_message,
    'new_order',
    false,
    v_link,
    now()
  FROM public.users u
  WHERE lower(COALESCE(u.role, '')) IN ('admin', 'super_admin', 'support', 'operator', 'supervisor');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_on_new_order ON public.orders;
CREATE TRIGGER trg_notify_admins_on_new_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_new_order();

COMMIT;
