-- =====================================================
-- CART SHARE AUTH LINK HOTFIX
-- Migration: 011_cart_share_auth_link_hotfix.sql
-- Purpose: Fix "Authenticated user required" when auth session exists
-- =====================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.ensure_current_app_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_auth_id uuid;
  v_email text;
  v_name text;
  v_claims jsonb;
  v_has_auth_id boolean;
  v_has_full_name boolean;
  v_has_role boolean;
  v_has_created_at boolean;
  v_has_updated_at boolean;
  v_update_set text;
  v_insert_cols text;
  v_insert_vals text;
  v_upsert_set text;
BEGIN
  v_auth_id := auth.uid();
  IF v_auth_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_uid := public.current_app_user_id();
  IF v_uid IS NOT NULL THEN
    RETURN v_uid;
  END IF;

  v_email := public.current_user_email();
  v_claims := COALESCE(current_setting('request.jwt.claims', true)::jsonb, '{}'::jsonb);
  v_name := COALESCE(NULLIF(v_claims->>'full_name', ''), NULLIF(v_claims->>'name', ''), 'Wasel User');

  IF v_email IS NULL OR btrim(v_email) = '' THEN
    v_email := 'user-' || left(v_auth_id::text, 8) || '@placeholder.wasel';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'auth_id'
  ) INTO v_has_auth_id;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'full_name'
  ) INTO v_has_full_name;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'role'
  ) INTO v_has_role;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'created_at'
  ) INTO v_has_created_at;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'updated_at'
  ) INTO v_has_updated_at;

  IF v_has_auth_id THEN
    v_update_set := 'auth_id = $1';
    IF v_has_updated_at THEN
      v_update_set := v_update_set || ', updated_at = now()';
    END IF;

    EXECUTE 'UPDATE public.users u '
      || 'SET ' || v_update_set || ' '
      || 'WHERE u.auth_id IS NULL AND lower(u.email) = lower($2) '
      || 'RETURNING u.id'
      INTO v_uid
      USING v_auth_id, v_email;
  END IF;

  IF v_uid IS NOT NULL THEN
    RETURN v_uid;
  END IF;

  v_insert_cols := 'id, email';
  v_insert_vals := '$1, $2';

  IF v_has_auth_id THEN
    v_insert_cols := v_insert_cols || ', auth_id';
    v_insert_vals := v_insert_vals || ', $1';
  END IF;

  IF v_has_full_name THEN
    v_insert_cols := v_insert_cols || ', full_name';
    v_insert_vals := v_insert_vals || ', $3';
  END IF;

  IF v_has_role THEN
    v_insert_cols := v_insert_cols || ', role';
    v_insert_vals := v_insert_vals || ', ''user''';
  END IF;

  IF v_has_created_at THEN
    v_insert_cols := v_insert_cols || ', created_at';
    v_insert_vals := v_insert_vals || ', now()';
  END IF;

  IF v_has_updated_at THEN
    v_insert_cols := v_insert_cols || ', updated_at';
    v_insert_vals := v_insert_vals || ', now()';
  END IF;

  v_upsert_set := 'email = EXCLUDED.email';
  IF v_has_auth_id THEN
    v_upsert_set := v_upsert_set || ', auth_id = COALESCE(public.users.auth_id, EXCLUDED.auth_id)';
  END IF;
  IF v_has_updated_at THEN
    v_upsert_set := v_upsert_set || ', updated_at = now()';
  END IF;

  EXECUTE 'INSERT INTO public.users (' || v_insert_cols || ') '
    || 'VALUES (' || v_insert_vals || ') '
    || 'ON CONFLICT (email) DO UPDATE SET ' || v_upsert_set || ' '
    || 'RETURNING id'
    INTO v_uid
    USING v_auth_id, v_email, v_name;

  IF v_uid IS NOT NULL THEN
    RETURN v_uid;
  END IF;

  SELECT u.id INTO v_uid
  FROM public.users u
  WHERE u.auth_id = v_auth_id
     OR lower(u.email) = lower(v_email)
  LIMIT 1;

  RETURN v_uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_cart_share_link(
  p_payload jsonb,
  p_expires_in_hours integer DEFAULT 72
)
RETURNS public.cart_share_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_link public.cart_share_links;
  v_token text;
  v_short_code text;
BEGIN
  v_uid := public.ensure_current_app_user_id();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authenticated user required';
  END IF;

  v_token := md5(
    COALESCE(v_uid::text, '')
    || ':' || clock_timestamp()::text
    || ':' || random()::text
    || ':' || txid_current()::text
  ) || md5(random()::text || clock_timestamp()::text);

  v_short_code := upper(substr(md5(v_token || random()::text), 1, 10));

  INSERT INTO public.cart_share_links (
    created_by,
    token,
    short_code,
    status,
    payload,
    expires_at
  ) VALUES (
    v_uid,
    v_token,
    v_short_code,
    'active',
    COALESCE(p_payload, '{}'::jsonb),
    now() + make_interval(hours => GREATEST(p_expires_in_hours, 1))
  )
  RETURNING * INTO v_link;

  RETURN v_link;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_cart_share_link(p_token text)
RETURNS public.cart_share_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_link public.cart_share_links;
BEGIN
  v_uid := public.ensure_current_app_user_id();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authenticated user required';
  END IF;

  SELECT * INTO v_link
  FROM public.cart_share_links
  WHERE token = p_token
  LIMIT 1;

  IF v_link.id IS NULL THEN
    RAISE EXCEPTION 'Invalid cart share token';
  END IF;

  IF v_link.expires_at < now() THEN
    UPDATE public.cart_share_links
    SET status = 'expired', updated_at = now()
    WHERE id = v_link.id;
    RAISE EXCEPTION 'Cart share token expired';
  END IF;

  IF v_link.status NOT IN ('active', 'opened') THEN
    RAISE EXCEPTION 'Cart share token is not active';
  END IF;

  UPDATE public.cart_share_links
  SET status = 'opened',
      opened_by = COALESCE(opened_by, v_uid),
      opened_at = COALESCE(opened_at, now()),
      updated_at = now()
  WHERE id = v_link.id
  RETURNING * INTO v_link;

  RETURN v_link;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_cart_share_checkout(
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
  v_link public.cart_share_links;
  v_order public.orders;
  v_order_number text;
  v_sender jsonb;
  v_recipient jsonb;
  v_items jsonb;
  v_total_usd numeric;
  v_total_syp numeric;
  v_payment_status text;
  v_payer_name text;
  v_payer_phone text;
BEGIN
  v_uid := public.ensure_current_app_user_id();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authenticated user required';
  END IF;

  v_payer_name := NULLIF(btrim(COALESCE(p_payment_payload->>'payer_name', '')), '');
  v_payer_phone := NULLIF(btrim(COALESCE(p_payment_payload->>'payer_phone', '')), '');
  IF v_payer_name IS NULL OR v_payer_phone IS NULL THEN
    RAISE EXCEPTION 'Payer name and phone are required';
  END IF;

  SELECT * INTO v_link
  FROM public.cart_share_links
  WHERE token = p_token
  LIMIT 1;

  IF v_link.id IS NULL THEN
    RAISE EXCEPTION 'Invalid cart share token';
  END IF;

  IF v_link.expires_at < now() THEN
    UPDATE public.cart_share_links
    SET status = 'expired', updated_at = now()
    WHERE id = v_link.id;
    RAISE EXCEPTION 'Cart share token expired';
  END IF;

  IF v_link.status = 'completed' AND v_link.created_order_id IS NOT NULL THEN
    SELECT * INTO v_order FROM public.orders WHERE id = v_link.created_order_id;
    RETURN v_order;
  END IF;

  v_sender := COALESCE(v_link.payload->'sender', '{}'::jsonb);
  v_recipient := COALESCE(v_link.payload->'recipient', '{}'::jsonb);
  v_items := COALESCE(v_link.payload->'items', '[]'::jsonb);
  v_total_usd := COALESCE((v_link.payload->>'totalUSD')::numeric, 0);
  v_total_syp := COALESCE((v_link.payload->>'totalSYP')::numeric, 0);

  BEGIN
    SELECT public.generate_order_number() INTO v_order_number;
  EXCEPTION WHEN OTHERS THEN
    v_order_number := 'WSL-' || RIGHT((extract(epoch FROM now()) * 1000)::bigint::text, 8);
  END;

  v_payment_status := CASE WHEN lower(COALESCE(p_payment_provider, '')) = 'paypal' THEN 'paid' ELSE 'pending' END;

  INSERT INTO public.orders (
    user_email,
    order_number,
    status,
    total_amount,
    currency,
    sender_details,
    recipient_details,
    user_id,
    recipient_user_id,
    payer_user_id,
    paid_by_user_id,
    collaboration_mode,
    payment_locked
  ) VALUES (
    COALESCE(v_sender->>'email', 'guest@example.com'),
    v_order_number,
    v_payment_status,
    v_total_usd,
    'USD',
    v_sender || jsonb_build_object(
      'meta', jsonb_build_object(
        'payment_method', p_payment_provider,
        'payment_reference', p_payment_reference,
        'payment_payload', COALESCE(p_payment_payload, '{}'::jsonb),
        'payer_name', v_payer_name,
        'payer_phone', v_payer_phone,
        'shared_cart_token', p_token,
        'total_syp', v_total_syp,
        'created_via', 'shared_cart_link'
      )
    ),
    v_recipient,
    v_link.created_by,
    v_link.created_by,
    v_uid,
    CASE WHEN v_payment_status = 'paid' THEN v_uid ELSE NULL END,
    'shared',
    false
  )
  RETURNING * INTO v_order;

  INSERT INTO public.order_items (
    order_id,
    product_name,
    product_id,
    quantity,
    price,
    image_url
  )
  SELECT
    v_order.id,
    COALESCE(item->>'name_ar', item->>'name', 'Item'),
    item->>'id',
    COALESCE((item->>'quantity')::int, 1),
    COALESCE((item->>'priceUSD')::numeric, 0),
    item->>'image_url'
  FROM jsonb_array_elements(v_items) item;

  UPDATE public.cart_share_links
  SET status = 'completed',
      completed_by = v_uid,
      completed_at = now(),
      created_order_id = v_order.id,
      updated_at = now()
  WHERE id = v_link.id;

  RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_current_app_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_cart_share_link(jsonb, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_cart_share_link(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_cart_share_checkout(text, text, text, jsonb) TO authenticated;

COMMIT;
