-- =====================================================
-- WASEL WALLET SYSTEM - Database Migration
-- =====================================================

-- 1. Wallets table - one per user
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance_usd numeric(12,2) NOT NULL DEFAULT 0 CHECK (balance_usd >= 0),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid()::text = user_id::text OR EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND role IN ('admin','supervisor')
  ));

CREATE POLICY "Users can update own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role can manage wallets" ON public.wallets
  FOR ALL USING (true);

-- 2. Gift cards table
CREATE TABLE IF NOT EXISTS public.gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_code text NOT NULL UNIQUE,
  balance_usd numeric(12,2) NOT NULL CHECK (balance_usd > 0),
  is_redeemed boolean NOT NULL DEFAULT false,
  redeemed_by uuid,
  redeemed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage gift cards" ON public.gift_cards
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND role IN ('admin','supervisor')
  ));

CREATE POLICY "Anyone can read unredeemed cards by code" ON public.gift_cards
  FOR SELECT USING (true);

-- 3. Wallet transactions log
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount_usd numeric(12,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('topup','purchase','refund','gift_card')),
  source text,
  reference_id text,
  description text,
  balance_after numeric(12,2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid()::text = user_id::text OR EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND role IN ('admin','supervisor')
  ));

CREATE POLICY "Service role can insert transactions" ON public.wallet_transactions
  FOR INSERT WITH CHECK (true);

-- 4. RPC: Redeem gift card (atomic)
CREATE OR REPLACE FUNCTION public.redeem_gift_card(p_card_code text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_card public.gift_cards%ROWTYPE;
  v_new_balance numeric(12,2);
BEGIN
  -- Lock the card row
  SELECT * INTO v_card FROM public.gift_cards
    WHERE card_code = p_card_code FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'card_not_found');
  END IF;

  IF v_card.is_redeemed THEN
    RETURN jsonb_build_object('success', false, 'error', 'card_already_used');
  END IF;

  -- Mark card as redeemed
  UPDATE public.gift_cards
    SET is_redeemed = true, redeemed_by = p_user_id, redeemed_at = now()
    WHERE id = v_card.id;

  -- Upsert wallet
  INSERT INTO public.wallets (user_id, balance_usd, updated_at)
    VALUES (p_user_id, v_card.balance_usd, now())
    ON CONFLICT (user_id)
    DO UPDATE SET balance_usd = wallets.balance_usd + v_card.balance_usd, updated_at = now();

  SELECT balance_usd INTO v_new_balance FROM public.wallets WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO public.wallet_transactions (user_id, amount_usd, type, source, reference_id, description, balance_after)
    VALUES (p_user_id, v_card.balance_usd, 'gift_card', 'gift_card', v_card.card_code,
            'شحن رصيد ببطاقة هدية ' || v_card.balance_usd || '$', v_new_balance);

  RETURN jsonb_build_object('success', true, 'amount', v_card.balance_usd, 'new_balance', v_new_balance);
END;
$$;

-- 5. RPC: Pay with wallet (atomic debit)
CREATE OR REPLACE FUNCTION public.wallet_pay(p_user_id uuid, p_amount_usd numeric, p_order_ref text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance numeric(12,2);
  v_new_balance numeric(12,2);
BEGIN
  SELECT balance_usd INTO v_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND OR v_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_wallet');
  END IF;

  IF v_balance < p_amount_usd THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_balance', 'balance', v_balance, 'required', p_amount_usd);
  END IF;

  v_new_balance := v_balance - p_amount_usd;

  UPDATE public.wallets SET balance_usd = v_new_balance, updated_at = now() WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions (user_id, amount_usd, type, source, reference_id, description, balance_after)
    VALUES (p_user_id, -p_amount_usd, 'purchase', 'order', p_order_ref,
            'دفع طلب ' || COALESCE(p_order_ref, ''), v_new_balance);

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance, 'charged', p_amount_usd);
END;
$$;

-- 6. RPC: Top-up wallet (manual / PayPal)
CREATE OR REPLACE FUNCTION public.wallet_topup(p_user_id uuid, p_amount_usd numeric, p_source text DEFAULT 'manual')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance numeric(12,2);
BEGIN
  INSERT INTO public.wallets (user_id, balance_usd, updated_at)
    VALUES (p_user_id, p_amount_usd, now())
    ON CONFLICT (user_id)
    DO UPDATE SET balance_usd = wallets.balance_usd + p_amount_usd, updated_at = now();

  SELECT balance_usd INTO v_new_balance FROM public.wallets WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions (user_id, amount_usd, type, source, description, balance_after)
    VALUES (p_user_id, p_amount_usd, 'topup', p_source,
            'شحن رصيد ' || p_amount_usd || '$ عبر ' || p_source, v_new_balance);

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;
