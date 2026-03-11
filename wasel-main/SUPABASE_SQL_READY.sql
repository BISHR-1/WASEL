-- JUST COPY & PASTE ALL OF THIS AT ONCE
-- Fixed for actual Wasel schema (wallet_id removed, using actual columns)

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their own data" ON public.admin_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Super admin can view all admins" ON public.admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

ALTER TABLE public.courier_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couriers can view their own profile" ON public.courier_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all courier profiles" ON public.courier_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Couriers can update their own profile" ON public.courier_profiles
  FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON public.wallets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id AND payment_status != 'completed');

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_courier()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.courier_profiles
    WHERE user_id = auth.uid() AND onboarding_completed = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_courier() TO authenticated;

CREATE OR REPLACE FUNCTION public.add_to_wallet_secure(
  p_user_id UUID,
  p_amount NUMERIC,
  p_source TEXT,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  IF auth.uid() != p_user_id AND NOT public.is_admin() THEN
    RETURN JSON_BUILD_OBJECT('error', 'Unauthorized');
  END IF;

  SELECT id, balance_usd INTO v_wallet_id, v_current_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_wallet_id IS NULL THEN
    RETURN JSON_BUILD_OBJECT('error', 'Wallet not found');
  END IF;

  v_new_balance := v_current_balance + p_amount;

  UPDATE public.wallets
  SET balance_usd = v_new_balance, updated_at = NOW()
  WHERE id = v_wallet_id;

  INSERT INTO public.wallet_transactions (
    user_id, amount_usd, type,
    source, reference_id, balance_after, description
  ) VALUES (
    p_user_id, p_amount, 'topup',
    p_source, p_reference_id, v_new_balance,
    'Added to wallet via ' || p_source
  );

  RETURN JSON_BUILD_OBJECT(
    'success', TRUE,
    'wallet_id', v_wallet_id,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.add_to_wallet_secure(UUID, NUMERIC, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.debit_wallet_secure(
  p_user_id UUID,
  p_amount NUMERIC,
  p_order_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  IF auth.uid() != p_user_id THEN
    RETURN JSON_BUILD_OBJECT('error', 'Unauthorized');
  END IF;

  SELECT id, balance_usd INTO v_wallet_id, v_current_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_wallet_id IS NULL THEN
    RETURN JSON_BUILD_OBJECT('error', 'Wallet not found');
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN JSON_BUILD_OBJECT('error', 'Insufficient balance');
  END IF;

  v_new_balance := v_current_balance - p_amount;

  UPDATE public.wallets
  SET balance_usd = v_new_balance, updated_at = NOW()
  WHERE id = v_wallet_id;

  INSERT INTO public.wallet_transactions (
    user_id, amount_usd, type,
    reference_id, balance_after, description
  ) VALUES (
    p_user_id, p_amount, 'purchase',
    p_order_id::TEXT, v_new_balance,
    'Payment for order ' || COALESCE(p_order_id::TEXT, 'unknown')
  );

  RETURN JSON_BUILD_OBJECT(
    'success', TRUE,
    'wallet_id', v_wallet_id,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.debit_wallet_secure(UUID, NUMERIC, UUID) TO authenticated;
