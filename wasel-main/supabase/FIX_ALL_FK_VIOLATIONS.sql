-- =====================================================
-- FIX ALL FK VIOLATIONS (orders.user_id, cart_share_links.created_by, cart_share_links.opened_by)
-- 
-- Run this ONCE in Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → Paste → Run
--
-- This script:
-- 1. Makes orders.user_id nullable (allows orders without a public.users row)
-- 2. Creates/updates helper functions (current_app_user_id, current_user_email)
-- 3. Creates/updates ensure_current_app_user_id (auto-creates public.users row)
-- 4. Creates/updates create_cart_share_link RPC
-- 5. Creates/updates claim_cart_share_link RPC
-- 6. Creates/updates create_compatible_order_v2 RPC
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Make orders.user_id nullable
-- =====================================================
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- =====================================================
-- STEP 2: Helper function — current_user_email
-- =====================================================
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
BEGIN
  claims := COALESCE(
    current_setting('request.jwt.claims', true)::jsonb,
    '{}'::jsonb
  );
  RETURN NULLIF(claims->>'email', '');
END;
$$;

-- =====================================================
-- STEP 3: Helper function — current_app_user_id
-- =====================================================
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user_id uuid;
BEGIN
  SELECT u.id INTO v_user_id
  FROM public.users u
  WHERE u.auth_id = auth.uid() OR u.id = auth.uid()
  LIMIT 1;
  RETURN COALESCE(v_user_id, auth.uid());
END;
$$;

-- =====================================================
-- STEP 4: ensure_current_app_user_id (SECURITY DEFINER)
--   Auto-creates public.users row if missing
-- =====================================================
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
    -- Verify the returned ID actually exists in public.users
    PERFORM 1 FROM public.users WHERE id = v_uid;
    IF FOUND THEN
      RETURN v_uid;
    END IF;
  END IF;

  v_email := public.current_user_email();
  v_claims := COALESCE(current_setting('request.jwt.claims', true)::jsonb, '{}'::jsonb);
  v_name := COALESCE(NULLIF(v_claims->>'full_name', ''), NULLIF(v_claims->>'name', ''), 'Wasel User');

  IF v_email IS NULL OR btrim(v_email) = '' THEN
    v_email := 'user-' || left(v_auth_id::text, 8) || '@placeholder.wasel';
  END IF;

  -- Introspect public.users columns
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='auth_id') INTO v_has_auth_id;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='full_name') INTO v_has_full_name;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='role') INTO v_has_role;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='created_at') INTO v_has_created_at;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='updated_at') INTO v_has_updated_at;

  -- Step 1: Try to UPDATE an existing user row that has matching email but no auth_id
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

  -- Step 2: UPSERT — insert new user or update on email conflict
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

  -- Step 3: Final fallback — just SELECT
  SELECT u.id INTO v_uid
  FROM public.users u
  WHERE u.auth_id = v_auth_id
     OR lower(u.email) = lower(v_email)
  LIMIT 1;

  RETURN v_uid;
END;
$$;

-- =====================================================
-- STEP 5: create_cart_share_link RPC
-- =====================================================
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

-- =====================================================
-- STEP 6: claim_cart_share_link RPC
-- =====================================================
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

-- =====================================================
-- STEP 7: create_compatible_order_v2 RPC (latest)
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_compatible_order_v2(p_order jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row jsonb;
  v_cols text[] := ARRAY[]::text[];
  v_vals text[] := ARRAY[]::text[];
  v_sql text;
  v_schema_cols text[];

  v_uid uuid;
  v_auth_uid uuid;
  v_email text;
  v_claims jsonb;

  v_order_number text;
  v_payment_method text;
  v_payment_status text;
  v_total_usd numeric;
  v_total_syp numeric;
  v_total_cents bigint;
  v_discount_cents integer;

  v_items jsonb;
  v_sender jsonb;
  v_recipient jsonb;
  v_snapshot jsonb;
  v_meta jsonb;

  v_delivery_address_type text;
  v_delivery_address_text text;
BEGIN
  v_auth_uid := auth.uid();

  BEGIN
    v_uid := public.ensure_current_app_user_id();
  EXCEPTION WHEN undefined_function THEN
    BEGIN
      v_uid := public.current_app_user_id();
    EXCEPTION WHEN OTHERS THEN
      v_uid := NULL;
    END;
  END;

  v_claims := COALESCE(current_setting('request.jwt.claims', true)::jsonb, '{}'::jsonb);
  v_email := NULLIF(COALESCE(p_order->'sender'->>'email', v_claims->>'email'), '');

  IF v_uid IS NULL AND v_auth_uid IS NOT NULL THEN
    BEGIN
      SELECT u.id INTO v_uid
      FROM public.users u
      WHERE u.auth_id = v_auth_uid
         OR u.id = v_auth_uid
         OR (v_email IS NOT NULL AND lower(u.email) = lower(v_email))
      LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      v_uid := NULL;
    END;
  END IF;

  v_payment_method := lower(COALESCE(p_order->>'paymentMethod', 'whatsapp'));
  v_payment_status := CASE
    WHEN v_payment_method IN ('paypal', 'wallet') THEN 'paid'
    ELSE 'pending'
  END;

  v_total_usd := COALESCE((p_order->>'totalUSD')::numeric, 0);
  v_total_syp := COALESCE((p_order->>'totalSYP')::numeric, 0);
  v_total_cents := GREATEST(0, round(v_total_usd * 100)::bigint);
  v_discount_cents := GREATEST(0, round((COALESCE((p_order->>'membershipDiscountSYP')::numeric, 0) / 150.0) * 100)::int);

  v_items := COALESCE(p_order->'items', '[]'::jsonb);
  v_sender := COALESCE(p_order->'sender', '{}'::jsonb);
  v_recipient := COALESCE(p_order->'recipient', '{}'::jsonb);
  v_delivery_address_text := COALESCE(v_recipient->>'address', v_recipient->>'city', '');

  BEGIN
    SELECT public.generate_order_number() INTO v_order_number;
  EXCEPTION WHEN OTHERS THEN
    v_order_number := 'WSL-' || RIGHT((extract(epoch FROM now()) * 1000)::bigint::text, 8);
  END;

  v_meta := jsonb_build_object(
    'payment_method', v_payment_method,
    'payment_status', v_payment_status,
    'paypal_capture_id', p_order->>'paypalCaptureId',
    'membership_discount_syp', COALESCE((p_order->>'membershipDiscountSYP')::numeric, 0),
    'tip_syp', COALESCE((p_order->>'tip')::numeric, 0),
    'coupon_code', p_order->>'coupon',
    'notes', COALESCE(p_order->>'notes', ''),
    'delivery_time', p_order->>'deliveryTime',
    'totals', jsonb_build_object('total_syp', v_total_syp, 'total_usd', v_total_usd)
  );

  -- إضافة بيانات السلة المشتركة إلى meta حتى يتعرف عليها detectOrderFlowType
  IF NULLIF(p_order->>'collaborationMode', '') IS NOT NULL THEN
    v_meta := v_meta || jsonb_build_object(
      'created_via', 'shared_cart_link',
      'shared_cart_token', p_order->'metadata'->>'shared_cart_token',
      'shared_cart_creator_id', p_order->'metadata'->>'shared_cart_creator_id'
    );
  END IF;

  v_snapshot := jsonb_build_object(
    'sender', v_sender,
    'recipient', v_recipient,
    'items', v_items,
    'meta', v_meta
  );

  SELECT array_agg(column_name::text)
  INTO v_schema_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'orders';

  IF v_schema_cols IS NULL OR array_length(v_schema_cols, 1) IS NULL THEN
    RAISE EXCEPTION 'orders table columns are not accessible';
  END IF;

  SELECT data_type INTO v_delivery_address_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'orders'
    AND column_name = 'delivery_address'
  LIMIT 1;

  IF 'order_number' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'order_number');
    v_vals := array_append(v_vals, quote_literal(v_order_number));
  ELSE
    RAISE EXCEPTION 'orders.order_number column is required';
  END IF;

  IF 'user_email' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'user_email');
    v_vals := array_append(v_vals, quote_literal(COALESCE(v_email, 'guest@example.com')));
  END IF;

  IF 'user_id' = ANY(v_schema_cols) AND v_uid IS NOT NULL THEN
    v_cols := array_append(v_cols, 'user_id');
    v_vals := array_append(v_vals, quote_literal(v_uid::text) || '::uuid');
  END IF;

  IF 'status' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'status');
    v_vals := array_append(v_vals, quote_literal(v_payment_status));
  END IF;

  IF 'payment_status' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'payment_status');
    v_vals := array_append(v_vals, quote_literal(CASE WHEN v_payment_status = 'paid' THEN 'succeeded' ELSE 'pending' END));
  END IF;

  IF 'payment_provider' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'payment_provider');
    v_vals := array_append(v_vals, quote_literal(v_payment_method));
  END IF;

  IF 'payment_method' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'payment_method');
    v_vals := array_append(v_vals, quote_literal(v_payment_method));
  END IF;

  IF 'payment_provider_response' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'payment_provider_response');
    v_vals := array_append(v_vals, quote_literal(COALESCE(p_order->'paypalDetails', '{}'::jsonb)::text) || '::jsonb');
  END IF;

  IF 'total_amount' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'total_amount');
    v_vals := array_append(v_vals, quote_literal(v_total_usd::text) || '::numeric');
  END IF;

  IF 'total_usd' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'total_usd');
    v_vals := array_append(v_vals, quote_literal(v_total_usd::text) || '::numeric');
  END IF;

  IF 'total_syp' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'total_syp');
    v_vals := array_append(v_vals, quote_literal(v_total_syp::text) || '::numeric');
  END IF;

  IF 'total_cents' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'total_cents');
    v_vals := array_append(v_vals, quote_literal(v_total_cents::text) || '::bigint');
  END IF;

  IF 'subtotal_cents' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'subtotal_cents');
    v_vals := array_append(v_vals, quote_literal(v_total_cents::text) || '::bigint');
  END IF;

  IF 'discount_cents' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'discount_cents');
    v_vals := array_append(v_vals, quote_literal(v_discount_cents::text) || '::integer');
  END IF;

  IF 'shipping_cents' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'shipping_cents');
    v_vals := array_append(v_vals, '0');
  END IF;

  IF 'tax_cents' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'tax_cents');
    v_vals := array_append(v_vals, '0');
  END IF;

  IF 'currency' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'currency');
    v_vals := array_append(v_vals, quote_literal('USD'));
  END IF;

  IF 'exchange_rate' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'exchange_rate');
    v_vals := array_append(v_vals, '150');
  END IF;

  IF 'sender_details' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'sender_details');
    v_vals := array_append(v_vals, quote_literal((v_sender || jsonb_build_object('meta', v_meta))::text) || '::jsonb');
  END IF;

  IF 'recipient_details' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'recipient_details');
    v_vals := array_append(v_vals, quote_literal(v_recipient::text) || '::jsonb');
  END IF;

  IF 'items' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'items');
    v_vals := array_append(v_vals, quote_literal(v_items::text) || '::jsonb');
  END IF;

  IF 'cart_snapshot' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'cart_snapshot');
    v_vals := array_append(v_vals, quote_literal(v_snapshot::text) || '::jsonb');
  END IF;

  IF 'shipping_address_snapshot' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'shipping_address_snapshot');
    v_vals := array_append(v_vals, quote_literal(v_recipient::text) || '::jsonb');
  END IF;

  IF 'billing_address_snapshot' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'billing_address_snapshot');
    v_vals := array_append(v_vals, quote_literal(v_sender::text) || '::jsonb');
  END IF;

  IF 'shipping_address' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'shipping_address');
    v_vals := array_append(v_vals, quote_literal(v_recipient::text) || '::jsonb');
  END IF;

  IF 'delivery_address' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'delivery_address');
    IF v_delivery_address_type = 'jsonb' THEN
      v_vals := array_append(v_vals, quote_literal(to_jsonb(v_delivery_address_text)::text) || '::jsonb');
    ELSIF v_delivery_address_type = 'json' THEN
      v_vals := array_append(v_vals, quote_literal(to_json(v_delivery_address_text)::text) || '::json');
    ELSE
      v_vals := array_append(v_vals, quote_literal(v_delivery_address_text));
    END IF;
  END IF;

  IF 'items_count' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'items_count');
    v_vals := array_append(v_vals, quote_literal(jsonb_array_length(v_items)::text) || '::integer');
  END IF;

  IF 'coupon_code' = ANY(v_schema_cols) AND NULLIF(p_order->>'coupon', '') IS NOT NULL THEN
    v_cols := array_append(v_cols, 'coupon_code');
    v_vals := array_append(v_vals, quote_literal(p_order->>'coupon'));
  END IF;

  IF 'notes' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'notes');
    v_vals := array_append(v_vals, quote_literal(COALESCE(p_order->>'notes', '')));
  END IF;

  IF 'customer_notes' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'customer_notes');
    v_vals := array_append(v_vals, quote_literal(COALESCE(p_order->>'notes', '')));
  END IF;

  -- ===== collaboration_mode + recipient_user_id for shared cart =====
  IF 'collaboration_mode' = ANY(v_schema_cols) AND NULLIF(p_order->>'collaborationMode', '') IS NOT NULL THEN
    v_cols := array_append(v_cols, 'collaboration_mode');
    v_vals := array_append(v_vals, quote_literal(p_order->>'collaborationMode'));
  END IF;

  IF 'recipient_user_id' = ANY(v_schema_cols) AND NULLIF(p_order->>'recipientUserId', '') IS NOT NULL THEN
    v_cols := array_append(v_cols, 'recipient_user_id');
    v_vals := array_append(v_vals, quote_literal(p_order->>'recipientUserId') || '::uuid');
  END IF;

  IF 'metadata' = ANY(v_schema_cols) THEN
    v_cols := array_append(v_cols, 'metadata');
    v_vals := array_append(v_vals, quote_literal(jsonb_build_object(
      'sender', v_sender,
      'recipient', v_recipient,
      'items', v_items,
      'coupon_code', p_order->>'coupon',
      'delivery_time', p_order->>'deliveryTime',
      'totals', jsonb_build_object('total_syp', v_total_syp, 'total_usd', v_total_usd)
    )::text) || '::jsonb');
  END IF;

  v_sql := 'INSERT INTO public.orders (' || array_to_string(v_cols, ', ') || ') VALUES (' || array_to_string(v_vals, ', ') || ') RETURNING to_jsonb(orders.*)';

  EXECUTE v_sql INTO v_row;

  RETURN v_row;
END;
$$;

-- =====================================================
-- STEP 8: Grant permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_current_app_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_cart_share_link(jsonb, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_cart_share_link(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_compatible_order_v2(jsonb) TO authenticated;

COMMIT;
