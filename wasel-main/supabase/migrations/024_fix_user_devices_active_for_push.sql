-- Ensure push tokens are considered active by default and recover legacy rows.

BEGIN;

ALTER TABLE public.user_devices
  ALTER COLUMN is_active SET DEFAULT true;

UPDATE public.user_devices
SET is_active = true,
    updated_at = now()
WHERE fcm_token IS NOT NULL
  AND (is_active IS NULL OR is_active = false);

COMMIT;
