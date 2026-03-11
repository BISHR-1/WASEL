-- =====================================================
-- FIX: 500 errors on wallets/wallet_transactions/notifications
--       400 error on create_compatible_order_v2
-- Run this ENTIRE file in Supabase SQL Editor
-- =====================================================

BEGIN;

-- ===== PART 1: Fix wallets RLS =====
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallets' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.wallets', p.policyname);
  END LOOP;
END $$;

CREATE POLICY wallets_select_own ON public.wallets
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY wallets_update_own ON public.wallets
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY wallets_insert_own ON public.wallets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- ===== PART 2: Fix wallet_transactions RLS =====
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallet_transactions' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.wallet_transactions', p.policyname);
  END LOOP;
END $$;

CREATE POLICY wt_select_own ON public.wallet_transactions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY wt_insert_any ON public.wallet_transactions
  FOR INSERT WITH CHECK (true);

-- ===== PART 3: Fix notifications RLS =====
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', p.policyname);
  END LOOP;
END $$;

-- Flexible SELECT: match user_id directly or via users.auth_id
CREATE POLICY notif_select_own ON public.notifications
  FOR SELECT USING (
    user_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = notifications.user_id
        AND (u.auth_id = auth.uid() OR u.id = auth.uid())
    )
  );

CREATE POLICY notif_update_own ON public.notifications
  FOR UPDATE USING (
    user_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = notifications.user_id
        AND (u.auth_id = auth.uid() OR u.id = auth.uid())
    )
  );

-- Allow any authenticated user to insert notifications (needed for admin notify flow)
CREATE POLICY notif_insert_any ON public.notifications
  FOR INSERT WITH CHECK (true);

COMMIT;

-- ===== PART 4: Recreate create_compatible_order_v2 =====
-- (Run separately if Part 1-3 fails, since this is outside the transaction)

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
  v_payment_status := CASE WHEN v_payment_method IN ('paypal','wallet') THEN 'paid' ELSE 'pending' END;

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

GRANT EXECUTE ON FUNCTION public.create_compatible_order_v2(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_compatible_order_v2(jsonb) TO anon;
