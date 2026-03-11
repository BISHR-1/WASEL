-- =====================================================
-- UNIFIED ROLES + ADMIN OPS + DELIVERY PROFILE
-- Migration: 009_unified_roles_admin_ops_delivery_profile.sql
-- =====================================================

BEGIN;

-- 1) Ensure users.role supports core roles needed by app
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'courier', 'admin', 'super_admin', 'support', 'operator'));

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 2) Admin profiles (if not already available)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  role text DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'support')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  is_deleted boolean DEFAULT false
);

-- 3) Admin audit logs (all admin operations)
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.admin_profiles(id),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity ON public.admin_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);

-- 4) Delivery profile for courier capabilities/location
CREATE TABLE IF NOT EXISTS public.delivery_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  vehicle_type text NOT NULL DEFAULT 'motorbike' CHECK (vehicle_type IN ('motorbike', 'car', 'bicycle', 'other')),
  vehicle_note text,
  current_location text,
  latitude numeric,
  longitude numeric,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_profiles_user_id ON public.delivery_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_profiles_available ON public.delivery_profiles(is_available);

-- 5) Helper: check if current auth user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE (u.auth_id = auth.uid() OR u.id = auth.uid())
      AND u.role = 'super_admin'
  );
$$;

-- 6) Helper: role by email/auth for both google/email users
CREATE OR REPLACE FUNCTION public.get_user_role_for_email(p_email text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (
      SELECT u.role
      FROM public.users u
      WHERE lower(u.email) = lower(p_email)
      LIMIT 1
    ),
    'user'
  );
$$;

-- 7) Super admin RPC to change role by email
CREATE OR REPLACE FUNCTION public.set_user_role_by_email(
  p_email text,
  p_role text,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user public.users%ROWTYPE;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only super admin can change roles';
  END IF;

  IF p_role NOT IN ('user', 'courier', 'admin', 'super_admin', 'support', 'operator') THEN
    RAISE EXCEPTION 'Invalid role %', p_role;
  END IF;

  SELECT * INTO v_user
  FROM public.users
  WHERE lower(email) = lower(p_email)
  LIMIT 1;

  IF v_user.id IS NULL THEN
    RAISE EXCEPTION 'User not found for email %', p_email;
  END IF;

  UPDATE public.users
  SET role = p_role,
      updated_at = now()
  WHERE id = v_user.id;

  INSERT INTO public.admin_logs(admin_id, action, entity, entity_id, details)
  VALUES (
    auth.uid(),
    'set_user_role_by_email',
    'users',
    v_user.id,
    jsonb_build_object(
      'email', p_email,
      'new_role', p_role,
      'note', p_note
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user.id,
    'email', v_user.email,
    'role', p_role
  );
END;
$$;

-- 8) Upsert admin profile for admin-like roles
CREATE OR REPLACE FUNCTION public.sync_admin_profile_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user public.users%ROWTYPE;
BEGIN
  SELECT * INTO v_user FROM public.users WHERE id = p_user_id LIMIT 1;
  IF v_user.id IS NULL THEN
    RETURN;
  END IF;

  IF v_user.role IN ('super_admin', 'admin', 'support') THEN
    INSERT INTO public.admin_profiles(id, name, email, role, status)
    VALUES (
      COALESCE(v_user.auth_id, v_user.id),
      COALESCE(v_user.full_name, v_user.email, 'Admin User'),
      v_user.email,
      CASE
        WHEN v_user.role = 'super_admin' THEN 'super_admin'
        WHEN v_user.role = 'support' THEN 'support'
        ELSE 'admin'
      END,
      'active'
    )
    ON CONFLICT (id)
    DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      status = 'active';
  END IF;
END;
$$;

-- 9) Trigger to auto-sync admin profile when users.role changes
CREATE OR REPLACE FUNCTION public.trg_sync_admin_profile_after_user_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    PERFORM public.sync_admin_profile_for_user(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_admin_profile_after_user_update ON public.users;
CREATE TRIGGER sync_admin_profile_after_user_update
AFTER UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_admin_profile_after_user_update();

-- 10) Update mark_shared_order_paid behavior: keep order in paid state
CREATE OR REPLACE FUNCTION public.mark_shared_order_paid(
  p_token text,
  p_payment_provider text,
  p_payment_reference text DEFAULT NULL,
  p_payment_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_link public.order_share_links;
  v_order public.orders;
BEGIN
  v_uid := public.current_app_user_id();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authenticated user required';
  END IF;

  SELECT *
  INTO v_link
  FROM public.order_share_links
  WHERE token = p_token
    AND status IN ('active', 'claimed')
  LIMIT 1;

  IF v_link.id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive share token';
  END IF;

  IF v_link.expires_at < now() THEN
    UPDATE public.order_share_links
    SET status = 'expired', updated_at = now()
    WHERE id = v_link.id;
    RAISE EXCEPTION 'Share token expired';
  END IF;

  UPDATE public.order_share_links
  SET status = 'paid',
      paid_by = v_uid,
      paid_at = now(),
      claimed_by = COALESCE(claimed_by, v_uid),
      claimed_at = COALESCE(claimed_at, now()),
      updated_at = now()
  WHERE id = v_link.id;

  UPDATE public.orders
  SET payer_user_id = COALESCE(payer_user_id, v_uid),
      paid_by_user_id = v_uid,
      payment_locked = false,
      collaboration_mode = 'shared',
      updated_at = now()
  WHERE id = v_link.order_id;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'status'
  ) THEN
    EXECUTE 'UPDATE public.orders SET status = ''paid'' WHERE id = $1' USING v_link.order_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    EXECUTE 'UPDATE public.orders SET payment_status = ''succeeded'' WHERE id = $1' USING v_link.order_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_provider'
  ) THEN
    EXECUTE 'UPDATE public.orders SET payment_provider = $2 WHERE id = $1' USING v_link.order_id, p_payment_provider;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_provider_order_id'
  ) THEN
    EXECUTE 'UPDATE public.orders SET payment_provider_order_id = COALESCE($2, payment_provider_order_id) WHERE id = $1'
      USING v_link.order_id, p_payment_reference;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_provider_response'
  ) THEN
    EXECUTE 'UPDATE public.orders SET payment_provider_response = COALESCE(payment_provider_response, ''{}''::jsonb) || $2 WHERE id = $1'
      USING v_link.order_id, p_payment_payload;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'paid_at'
  ) THEN
    EXECUTE 'UPDATE public.orders SET paid_at = now() WHERE id = $1' USING v_link.order_id;
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = v_link.order_id;

  RETURN v_order;
END;
$$;

-- 11) RLS for admin profiles and logs
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_profiles_self_read ON public.admin_profiles;
CREATE POLICY admin_profiles_self_read ON public.admin_profiles
FOR SELECT
USING (id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS admin_profiles_super_admin_manage ON public.admin_profiles;
CREATE POLICY admin_profiles_super_admin_manage ON public.admin_profiles
FOR ALL
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS admin_logs_admin_read ON public.admin_logs;
CREATE POLICY admin_logs_admin_read ON public.admin_logs
FOR SELECT
USING (public.is_super_admin() OR admin_id = auth.uid());

DROP POLICY IF EXISTS admin_logs_system_insert ON public.admin_logs;
CREATE POLICY admin_logs_system_insert ON public.admin_logs
FOR INSERT
WITH CHECK (public.is_super_admin() OR admin_id = auth.uid());

DROP POLICY IF EXISTS delivery_profiles_owner_or_admin_read ON public.delivery_profiles;
CREATE POLICY delivery_profiles_owner_or_admin_read ON public.delivery_profiles
FOR SELECT
USING (
  user_id = public.current_app_user_id()
  OR public.is_staff_user()
);

DROP POLICY IF EXISTS delivery_profiles_owner_or_admin_upsert ON public.delivery_profiles;
CREATE POLICY delivery_profiles_owner_or_admin_upsert ON public.delivery_profiles
FOR ALL
USING (
  user_id = public.current_app_user_id()
  OR public.is_staff_user()
)
WITH CHECK (
  user_id = public.current_app_user_id()
  OR public.is_staff_user()
);

GRANT SELECT, INSERT, UPDATE ON public.delivery_profiles TO authenticated;
GRANT SELECT ON public.admin_logs TO authenticated;
GRANT SELECT ON public.admin_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role_by_email(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role_for_email(text) TO authenticated;

COMMIT;
