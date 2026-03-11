-- =====================================================
-- Fix user_devices for push registration reliability
-- =====================================================

BEGIN;

-- Ensure optional column exists for OneSignal integrations used in app code.
ALTER TABLE public.user_devices
  ADD COLUMN IF NOT EXISTS onesignal_player_id text;

-- Remove duplicated rows by keeping the most recently updated per user.
WITH ranked AS (
  SELECT
    id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY COALESCE(updated_at, created_at, now()) DESC, id DESC
    ) AS rn
  FROM public.user_devices
  WHERE user_id IS NOT NULL
)
DELETE FROM public.user_devices ud
USING ranked r
WHERE ud.id = r.id
  AND r.rn > 1;

-- Make upsert on user_id valid.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_devices_user_id_unique
  ON public.user_devices(user_id)
  WHERE user_id IS NOT NULL;

-- Helpful index for push dispatch by token freshness.
CREATE INDEX IF NOT EXISTS idx_user_devices_updated_at
  ON public.user_devices(updated_at DESC);

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Reset policies to avoid conflicts from previous setups.
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_devices'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_devices', p.policyname);
  END LOOP;
END $$;

-- Device owner can read own rows.
CREATE POLICY user_devices_select_own_2026
ON public.user_devices
FOR SELECT
USING (user_id = auth.uid());

-- Device owner can insert own rows.
CREATE POLICY user_devices_insert_own_2026
ON public.user_devices
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Device owner can update own rows.
CREATE POLICY user_devices_update_own_2026
ON public.user_devices
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Staff can read rows for troubleshooting push delivery.
CREATE POLICY user_devices_select_staff_2026
ON public.user_devices
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
