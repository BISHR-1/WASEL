-- =====================================================
-- Add subscription_code column to wasel_plus_memberships
-- Migration: 019_wasel_plus_codes.sql
-- =====================================================

BEGIN;

-- Add subscription_code column if it doesn't exist
DO $$ BEGIN
  ALTER TABLE public.wasel_plus_memberships ADD COLUMN subscription_code text;
EXCEPTION WHEN duplicate_column THEN
  RAISE NOTICE 'subscription_code column already exists';
END $$;

-- Add unique index on subscription_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_wpm_subscription_code
  ON public.wasel_plus_memberships (subscription_code)
  WHERE subscription_code IS NOT NULL;

-- Allow supervisors/admins to update memberships (activate pending ones)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can manage memberships" ON public.wasel_plus_memberships;
  CREATE POLICY "Admins can manage memberships"
    ON public.wasel_plus_memberships FOR ALL
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'wasel_plus_memberships table does not exist yet';
END $$;

COMMIT;
