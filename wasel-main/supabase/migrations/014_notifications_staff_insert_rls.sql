-- =====================================================
-- Notifications RLS: allow supervisors/admins to send in-app notifications
-- during order assignment while preserving user privacy.
-- =====================================================

BEGIN;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Reset notifications policies to avoid legacy conflicts.
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', p.policyname);
  END LOOP;
END $$;

-- Users can read their own notifications.
CREATE POLICY notifications_select_own_2026
ON public.notifications
FOR SELECT
USING (user_id = auth.uid());

-- Users can mark their own notifications as read.
CREATE POLICY notifications_update_own_2026
ON public.notifications
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can insert notifications to themselves.
CREATE POLICY notifications_insert_self_2026
ON public.notifications
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Staff (admin/supervisor) can send notifications to any user.
CREATE POLICY notifications_insert_staff_2026
ON public.notifications
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

-- Staff can read all notifications for support and operations.
CREATE POLICY notifications_select_staff_2026
ON public.notifications
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

COMMIT;
