-- Add login_role column to user_devices so we can distinguish
-- devices registered during admin vs regular-user sessions.
-- This prevents supervisors who re-login as regular users from
-- receiving admin push notifications on their user session device.

ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS login_role TEXT DEFAULT NULL;

COMMENT ON COLUMN user_devices.login_role IS
  'Role active when the device token was registered (admin, supervisor, operator, user, etc.). NULL for legacy rows.';
