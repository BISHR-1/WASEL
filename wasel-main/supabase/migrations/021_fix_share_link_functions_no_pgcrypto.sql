-- =====================================================
-- SHARE LINK FUNCTIONS HOTFIX (NO PGCRYPTO)
-- Migration: 021_fix_share_link_functions_no_pgcrypto.sql
-- Purpose: Remove dependency on gen_random_bytes for projects where pgcrypto is unavailable
-- =====================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.generate_share_code(p_len integer DEFAULT 10)
RETURNS text
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  v_target_len integer := GREATEST(COALESCE(p_len, 10), 6);
  v_raw text := '';
BEGIN
  WHILE length(v_raw) < v_target_len LOOP
    v_raw := v_raw || upper(md5(random()::text || clock_timestamp()::text || txid_current()::text));
  END LOOP;

  v_raw := regexp_replace(v_raw, '[^A-Z0-9]', '', 'g');
  RETURN substring(v_raw from 1 for v_target_len);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_order_share_link(
  p_order_id uuid,
  p_expires_in_hours integer DEFAULT 72,
  p_recipient_name text DEFAULT NULL,
  p_recipient_contact text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS public.order_share_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid;
  v_link public.order_share_links;
  v_token text;
  v_code text;
BEGIN
  IF NOT public.user_can_access_order(p_order_id) THEN
    RAISE EXCEPTION 'Access denied for this order';
  END IF;

  v_caller := COALESCE(public.ensure_current_app_user_id(), public.current_app_user_id());

  v_token := md5(
    COALESCE(v_caller::text, '')
    || ':' || p_order_id::text
    || ':' || clock_timestamp()::text
    || ':' || random()::text
    || ':' || txid_current()::text
  ) || md5(random()::text || p_order_id::text || clock_timestamp()::text);

  v_code := public.generate_share_code(10);

  -- Only one active link per order
  UPDATE public.order_share_links
  SET status = 'cancelled', updated_at = now()
  WHERE order_id = p_order_id
    AND status IN ('active', 'claimed');

  INSERT INTO public.order_share_links (
    order_id,
    created_by,
    recipient_name,
    recipient_contact,
    token,
    short_code,
    status,
    expires_at,
    notes
  ) VALUES (
    p_order_id,
    v_caller,
    p_recipient_name,
    p_recipient_contact,
    v_token,
    v_code,
    'active',
    now() + make_interval(hours => GREATEST(p_expires_in_hours, 1)),
    p_notes
  )
  RETURNING * INTO v_link;

  UPDATE public.orders
  SET collaboration_mode = 'shared',
      payment_locked = true,
      payment_link_expires_at = v_link.expires_at,
      updated_at = now()
  WHERE id = p_order_id;

  RETURN v_link;
END;
$$;

COMMIT;
