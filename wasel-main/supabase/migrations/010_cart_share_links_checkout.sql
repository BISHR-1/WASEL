-- =====================================================
-- CART SHARE LINKS + CHECKOUT
-- Migration: 010_cart_share_links_checkout.sql
-- =====================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.cart_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  token text NOT NULL UNIQUE,
  short_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'opened', 'completed', 'expired', 'cancelled')),
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  opened_by uuid REFERENCES public.users(id),
  opened_at timestamptz,
  completed_by uuid REFERENCES public.users(id),
  completed_at timestamptz,
  created_order_id uuid REFERENCES public.orders(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cart_share_links_created_by ON public.cart_share_links(created_by);
CREATE INDEX IF NOT EXISTS idx_cart_share_links_status ON public.cart_share_links(status);
CREATE INDEX IF NOT EXISTS idx_cart_share_links_expires_at ON public.cart_share_links(expires_at);

DROP TRIGGER IF EXISTS trg_cart_share_links_touch_updated_at ON public.cart_share_links;
CREATE TRIGGER trg_cart_share_links_touch_updated_at
BEFORE UPDATE ON public.cart_share_links
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

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
BEGIN
  v_uid := public.current_app_user_id();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authenticated user required';
  END IF;

  INSERT INTO public.cart_share_links (
    created_by,
    token,
    short_code,
    status,
    payload,
    expires_at
  ) VALUES (
    v_uid,
    encode(gen_random_bytes(24), 'hex'),
    public.generate_share_code(10),
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
  v_uid := public.current_app_user_id();
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
BEGIN
  v_uid := public.current_app_user_id();
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

ALTER TABLE public.cart_share_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cart_share_links_access_2026 ON public.cart_share_links;
CREATE POLICY cart_share_links_access_2026 ON public.cart_share_links
FOR SELECT
USING (
  public.is_staff_user()
  OR created_by = public.current_app_user_id()
  OR opened_by = public.current_app_user_id()
  OR completed_by = public.current_app_user_id()
);

DROP POLICY IF EXISTS cart_share_links_insert_2026 ON public.cart_share_links;
CREATE POLICY cart_share_links_insert_2026 ON public.cart_share_links
FOR INSERT
WITH CHECK (created_by = public.current_app_user_id());

DROP POLICY IF EXISTS cart_share_links_update_2026 ON public.cart_share_links;
CREATE POLICY cart_share_links_update_2026 ON public.cart_share_links
FOR UPDATE
USING (
  public.is_staff_user()
  OR created_by = public.current_app_user_id()
  OR opened_by = public.current_app_user_id()
  OR completed_by = public.current_app_user_id()
)
WITH CHECK (
  public.is_staff_user()
  OR created_by = public.current_app_user_id()
  OR opened_by = public.current_app_user_id()
  OR completed_by = public.current_app_user_id()
);

GRANT SELECT, INSERT, UPDATE ON public.cart_share_links TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_cart_share_link(jsonb, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_cart_share_link(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_cart_share_checkout(text, text, text, jsonb) TO authenticated;

COMMIT;
