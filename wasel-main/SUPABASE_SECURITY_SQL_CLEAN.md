-- ============================================
-- SUPABASE SECURITY SQL - COPY & PASTE READY
-- ============================================
-- Instructions: Copy each section below and paste into Supabase SQL Editor
-- Press Execute for each section
-- ============================================

-- SECTION 1: Create suspicious_activities_log table
-- Copy this entire section and execute once
CREATE TABLE IF NOT EXISTS public.suspicious_activities_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  details JSONB,
  attempted_amount DECIMAL(10,2),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE INDEX idx_suspicious_user_created ON public.suspicious_activities_log(user_id, created_at DESC);
CREATE INDEX idx_suspicious_activity_type ON public.suspicious_activities_log(activity_type);

COMMENT ON TABLE public.suspicious_activities_log IS 'سجل محاولات الاحتيال والأنشطة المريبة';

-- ============================================
-- SECTION 2: Create wallet_transactions table
-- Copy this entire section and execute once
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id BIGSERIAL PRIMARY KEY,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2),
  balance_after DECIMAL(10,2),
  order_id UUID REFERENCES public.orders(id),
  payment_method TEXT,
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallet_transactions_user ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_created ON public.wallet_transactions(created_at DESC);

COMMENT ON TABLE public.wallet_transactions IS 'سجل جميع عمليات المحفظة النقدية';

-- ============================================
-- SECTION 3: Enable RLS on admin_users
-- Copy this entire section and execute once
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their own data" ON public.admin_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admin can view all admins" ON public.admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- ============================================
-- SECTION 4: Enable RLS on courier_profiles
-- Copy this entire section and execute once
ALTER TABLE public.courier_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couriers can view their own profile" ON public.courier_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all courier profiles" ON public.courier_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Couriers can update their own profile" ON public.courier_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- SECTION 5: Enable RLS on wallets
-- Copy this entire section and execute once
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON public.wallets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================
-- SECTION 6: Enable RLS on wallet_transactions
-- Copy this entire section and execute once
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================
-- SECTION 7: Enable RLS on suspicious_activities_log
-- Copy this entire section and execute once
ALTER TABLE public.suspicious_activities_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view suspicious activities" ON public.suspicious_activities_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================
-- SECTION 8: Enable RLS on orders
-- Copy this entire section and execute once
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================
-- SECTION 9: Create is_admin() function
-- Copy this entire section and execute once
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================
-- SECTION 10: Create is_courier() function
-- Copy this entire section and execute once
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

-- ============================================
-- SECTION 11: Create add_to_wallet_secure() function
-- Copy this entire section and execute once
CREATE OR REPLACE FUNCTION public.add_to_wallet_secure(
  p_user_id UUID,
  p_amount DECIMAL,
  p_source TEXT,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
BEGIN
  IF auth.uid() != p_user_id AND NOT public.is_admin() THEN
    RETURN JSON_BUILD_OBJECT('error', 'Unauthorized');
  END IF;

  SELECT id, balance INTO v_wallet_id, v_current_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_wallet_id IS NULL THEN
    RETURN JSON_BUILD_OBJECT('error', 'Wallet not found');
  END IF;

  v_new_balance := v_current_balance + p_amount;

  UPDATE public.wallets
  SET balance = v_new_balance, updated_at = NOW()
  WHERE id = v_wallet_id;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, transaction_type, amount,
    balance_before, balance_after, payment_method, reference_id, description
  ) VALUES (
    v_wallet_id, p_user_id, 'add', p_amount,
    v_current_balance, v_new_balance, p_source, p_reference_id,
    'Added to wallet via ' || p_source
  );

  RETURN JSON_BUILD_OBJECT(
    'success', TRUE,
    'wallet_id', v_wallet_id,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.add_to_wallet_secure(UUID, DECIMAL, TEXT, TEXT) TO authenticated;

-- ============================================
-- SECTION 12: Create debit_wallet_secure() function
-- Copy this entire section and execute once
CREATE OR REPLACE FUNCTION public.debit_wallet_secure(
  p_user_id UUID,
  p_amount DECIMAL,
  p_order_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
BEGIN
  IF auth.uid() != p_user_id THEN
    RETURN JSON_BUILD_OBJECT('error', 'Unauthorized');
  END IF;

  SELECT id, balance INTO v_wallet_id, v_current_balance
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
  SET balance = v_new_balance, updated_at = NOW()
  WHERE id = v_wallet_id;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, transaction_type, amount,
    balance_before, balance_after, order_id, description
  ) VALUES (
    v_wallet_id, p_user_id, 'debit', p_amount,
    v_current_balance, v_new_balance, p_order_id,
    'Payment for order'
  );

  RETURN JSON_BUILD_OBJECT(
    'success', TRUE,
    'wallet_id', v_wallet_id,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.debit_wallet_secure(UUID, DECIMAL, UUID) TO authenticated;

-- ============================================
-- DONE! All security setup complete
-- ============================================
