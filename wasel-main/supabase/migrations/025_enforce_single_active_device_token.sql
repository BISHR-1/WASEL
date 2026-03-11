-- Keep each FCM token active for only one user to prevent cross-account push leakage.

BEGIN;

WITH ranked AS (
  SELECT
    id,
    fcm_token,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY fcm_token
      ORDER BY COALESCE(updated_at, created_at, now()) DESC, id DESC
    ) AS rn
  FROM public.user_devices
  WHERE fcm_token IS NOT NULL
    AND is_active = true
)
UPDATE public.user_devices ud
SET is_active = false,
    updated_at = now()
FROM ranked r
WHERE ud.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_devices_active_fcm_token_unique
  ON public.user_devices (fcm_token)
  WHERE fcm_token IS NOT NULL AND is_active = true;

COMMIT;
