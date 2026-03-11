-- =====================================================
-- COMPATIBLE ORDER CREATE RPC
-- Migration: 012_create_compatible_order_rpc.sql
-- Purpose: Insert orders across mixed schema versions without PGRST204 column-cache failures
-- =====================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.create_compatible_order(p_order jsonb)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders;
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
  err_a text;
  err_b text;
  err_c text;
BEGIN
  v_auth_uid := auth.uid();

  -- Resolve app user id safely across deployme nts.
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

  -- Attempt A: newer simplified schema (user_email/status/total_amount/sender_details/...)
  BEGIN
    INSERT INTO public.orders (
      user_email,
      order_number,
      status,
      total_amount,
      currency,
      sender_details,
      recipient_details,
      user_id
    ) VALUES (
      COALESCE(v_email, 'guest@example.com'),
      v_order_number,
      v_payment_status,
      v_total_usd,
      'USD',
      v_sender || jsonb_build_object('meta', v_meta),
      v_recipient,
      v_uid
    )
    RETURNING * INTO v_order;

    RETURN v_order;
  EXCEPTION WHEN OTHERS THEN
    err_a := SQLERRM;
  END;

  -- Attempt B: security schema variant with shipping_address_snapshot
  BEGIN
    INSERT INTO public.orders (
      order_number,
      user_id,
      cart_snapshot,
      shipping_address_snapshot,
      billing_address_snapshot,
      total_cents,
      discount_cents,
      shipping_cents,
      tax_cents,
      currency,
      payment_status,
      payment_provider,
      payment_provider_response,
      coupon_code,
      notes
    ) VALUES (
      v_order_number,
      v_uid,
      v_snapshot,
      v_recipient,
      v_sender,
      v_total_cents,
      v_discount_cents,
      0,
      0,
      'USD',
      CASE WHEN v_payment_status = 'paid' THEN 'succeeded' ELSE 'pending' END,
      v_payment_method,
      COALESCE(p_order->'paypalDetails', '{}'::jsonb),
      p_order->>'coupon',
      p_order->>'notes'
    )
    RETURNING * INTO v_order;

    RETURN v_order;
  EXCEPTION WHEN OTHERS THEN
    err_b := SQLERRM;
  END;

  -- Attempt C: security schema variant with shipping_address/items_count/subtotal_cents
  BEGIN
    INSERT INTO public.orders (
      order_number,
      user_id,
      cart_snapshot,
      items_count,
      subtotal_cents,
      discount_cents,
      shipping_cents,
      tax_cents,
      total_cents,
      currency,
      exchange_rate,
      payment_status,
      payment_provider,
      payment_provider_response,
      shipping_address,
      customer_notes,
      metadata
    ) VALUES (
      v_order_number,
      v_uid,
      v_snapshot,
      jsonb_array_length(v_items),
      v_total_cents,
      v_discount_cents,
      0,
      0,
      v_total_cents,
      'USD',
      150,
      CASE WHEN v_payment_status = 'paid' THEN 'succeeded' ELSE 'pending' END,
      v_payment_method,
      COALESCE(p_order->'paypalDetails', '{}'::jsonb),
      v_recipient,
      p_order->>'notes',
      jsonb_build_object('sender', v_sender, 'coupon_code', p_order->>'coupon', 'delivery_time', p_order->>'deliveryTime')
    )
    RETURNING * INTO v_order;

    RETURN v_order;
  EXCEPTION WHEN OTHERS THEN
    err_c := SQLERRM;
  END;

  RAISE EXCEPTION 'Unable to create order with compatible RPC. AttemptA=% | AttemptB=% | AttemptC=%',
    COALESCE(err_a, 'n/a'), COALESCE(err_b, 'n/a'), COALESCE(err_c, 'n/a');
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_compatible_order(jsonb) TO authenticated;

COMMIT;
