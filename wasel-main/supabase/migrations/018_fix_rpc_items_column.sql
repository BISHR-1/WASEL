-- =====================================================
-- FIX: RPC should save items to the 'items' JSONB column
-- Migration: 018_fix_rpc_items_column.sql
-- Problem: The orders table has 'items' column but NOT 'cart_snapshot' or 'metadata'.
--          The RPC was trying to write to cart_snapshot/metadata which don't exist,
--          so items were never saved.
-- =====================================================

BEGIN;

-- Re-create the RPC to handle the 'items' column
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
  v_payment_status := CASE WHEN v_payment_method = 'paypal' THEN 'paid' ELSE 'pending' END;

  v_total_usd := COALESCE((p_order->>'totalUSD')::numeric, 0);
  v_total_syp := COALESCE((p_order->>'totalSYP')::numeric, 0);
  v_total_cents := GREATEST(0, round(v_total_usd * 100)::bigint);
  v_discount_cents := GREATEST(0, round((COALESCE((p_order->>'membershipDiscountSYP')::numeric, 0) / 150.0) * 100)::int);

  v_items := COALESCE(p_order->'items', '[]'::jsonb);
  v_sender := COALESCE(p_order->'sender', '{}'::jsonb);
  v_recipient := COALESCE(p_order->'recipient', '{}'::jsonb);

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

  -- order_number (required)
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

  -- *** CRITICAL FIX: Write items to the 'items' JSONB column ***
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
    v_vals := array_append(v_vals, quote_literal(COALESCE(v_recipient->>'address', v_recipient->>'city', ''))::text);
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

-- Also add INSERT policy on order_items for authenticated users
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
  CREATE POLICY "Users can insert order items"
    ON public.order_items FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'order_items table does not exist, skipping INSERT policy';
END $$;

COMMIT;
