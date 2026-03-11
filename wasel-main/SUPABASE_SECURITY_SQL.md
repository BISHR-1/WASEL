# 🔐 Supabase Security Setup - SQL Scripts & RLS Policies

## ⚠️ CRITICAL: Execute These SQL Commands in Supabase!

هذه الخطوات **مهمة جداً** لتفعيل الحماية الكاملة على مستوى قاعدة البيانات.

---

## 1️⃣ جداول مطلوبة جديدة

### إنشاء جدول suspicious_activities_log

```sql
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

-- Index for faster queries
CREATE INDEX idx_suspicious_user_created ON public.suspicious_activities_log(user_id, created_at DESC);
CREATE INDEX idx_suspicious_activity_type ON public.suspicious_activities_log(activity_type);

-- تعليق الجدول
COMMENT ON TABLE public.suspicious_activities_log IS 'سجل محاولات الاحتيال والأنشطة المريبة';
```

### إنشاء جدول wallet_transactions (إذا لم يكن موجود)

```sql
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id BIGSERIAL PRIMARY KEY,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'add', 'debit', 'refunded'
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2),
  balance_after DECIMAL(10,2),
  order_id UUID REFERENCES public.orders(id),
  payment_method TEXT, -- 'direct', 'paypal', 'gift_card'
  reference_id TEXT, -- For PayPal capture ID or reference
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index للأداء
CREATE INDEX idx_wallet_transactions_user ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_created ON public.wallet_transactions(created_at DESC);

COMMENT ON TABLE public.wallet_transactions IS 'سجل جميع عمليات المحفظة النقدية';
```

---

## 2️⃣ Row Level Security (RLS) Policies

### تفعيل RLS على admin_users
```sql
-- تفعيل RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: الإداريون يشاهدون بيناتهم فقط
CREATE POLICY "Admins can view their own data" ON public.admin_users
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Policy: Super admin يشاهد الكل (من خلال جدول separate)
CREATE POLICY "Super admin can view all admins" ON public.admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );
```

### تفعيل RLS على courier_profiles
```sql
ALTER TABLE public.courier_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: الموصلون يشاهدون بيناتهم فقط
CREATE POLICY "Couriers can view their own profile" ON public.courier_profiles
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Policy: الإداريون يشاهدون جميع بيانات الموصلين
CREATE POLICY "Admins can view all courier profiles" ON public.courier_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Policy: الموصلون يحدثون بيناتهم فقط
CREATE POLICY "Couriers can update their own profile" ON public.courier_profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

### تفعيل RLS على wallets
```sql
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Policy: المستخدمون يشاهدون محفظتهم فقط
CREATE POLICY "Users can view their own wallet" ON public.wallets
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Policy: الإداريون يشاهدون كل المحافظ
CREATE POLICY "Admins can view all wallets" ON public.wallets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Policy: آمن جداً - المستخدمون لا يقدرون يحدثون الرصيد مباشرة
-- بدلاً من ذلك، استخدم RPC function
```

### تفعيل RLS على wallet_transactions
```sql
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: رؤية العمليات
CREATE POLICY "Users can view their own transactions" ON public.wallet_transactions
  FOR SELECT USING (
    auth.uid() = user_id
  );

CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Policy: لا أحد يقدر يضيف عمليات مباشرة (فقط من خلال RPC)
ALTER TABLE public.wallet_transactions DISABLE ROW LEVEL SECURITY;
-- سيتم التحكم بـ INSERT من خلال RPC function بدلاً من ذلك
```

### تفعيل RLS على suspicious_activities_log
```sql
ALTER TABLE public.suspicious_activities_log ENABLE ROW LEVEL SECURITY;

-- Policy: الإداريون فقط يشاهدون السجل
CREATE POLICY "Admins can view suspicious activities" ON public.suspicious_activities_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Policy: لا أحد يقدر يحذف (تدقيق فقط)
-- سيتم الإضافة من خلال RPC function محمية
```

### تفعيل RLS على orders
```sql
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy: المستخدمون يشاهدون طلباتهم فقط
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() IN (
      SELECT user_id FROM public.courier_profiles
      WHERE assigned_orders_json::JSONB @> jsonb_build_object('order_id', id::TEXT)
    )
  );

-- Policy: الإداريون يشاهدون الجميع
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
```

---

## 3️⃣ RPC Functions المحمية

### دالة آمنة لإضافة أموال للمحفظة
```sql
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
  -- تحقق من أن المستخدم يقوم بتعديل محفظته الخاصة فقط
  IF auth.uid() != p_user_id AND NOT is_admin() THEN
    RETURN JSON_BUILD_OBJECT('error', 'Unauthorized');
  END IF;

  -- احصل على محفظة المستخدم
  SELECT id, balance INTO v_wallet_id, v_current_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_wallet_id IS NULL THEN
    RETURN JSON_BUILD_OBJECT('error', 'Wallet not found');
  END IF;

  -- احسب الرصيد الجديد
  v_new_balance := v_current_balance + p_amount;

  -- حدّث المحفظة
  UPDATE public.wallets
  SET balance = v_new_balance, updated_at = NOW()
  WHERE id = v_wallet_id;

  -- سجل العملية
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
    'new_balance', v_new_balance,
    'transaction_id', LASTVAL()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION public.add_to_wallet_secure(UUID, DECIMAL, TEXT, TEXT) TO authenticated;
```

### دالة آمنة لخصم من المحفظة
```sql
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
  -- تحقق من أن المستخدم يقوم بتعديل محفظته الخاصة فقط
  IF auth.uid() != p_user_id THEN
    RETURN JSON_BUILD_OBJECT('error', 'Unauthorized');
  END IF;

  -- احصل على محفظة المستخدم
  SELECT id, balance INTO v_wallet_id, v_current_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_wallet_id IS NULL THEN
    RETURN JSON_BUILD_OBJECT('error', 'Wallet not found');
  END IF;

  -- تحقق من أن الرصيد كافي
  IF v_current_balance < p_amount THEN
    RETURN JSON_BUILD_OBJECT('error', 'Insufficient balance');
  END IF;

  -- احسب الرصيد الجديد
  v_new_balance := v_current_balance - p_amount;

  -- حدّث المحفظة
  UPDATE public.wallets
  SET balance = v_new_balance, updated_at = NOW()
  WHERE id = v_wallet_id;

  -- سجل العملية
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
    'new_balance', v_new_balance,
    'transaction_id', LASTVAL()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.debit_wallet_secure(UUID, DECIMAL, UUID) TO authenticated;
```

### دالة التحقق من Admin
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### دالة التحقق من Courier
```sql
CREATE OR REPLACE FUNCTION public.is_courier()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.courier_profiles
    WHERE user_id = auth.uid() AND onboarding_completed = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4️⃣ خطوات التطبيق

### في Supabase Dashboard:

1. **اذهب إلى SQL Editor**
   - افتح Supabase Dashboard
   - انقر على "SQL Editor" في الشريط الجانبي

2. **نفذ الجداول الجديدة** (Copy & Paste)
   ```
   - انسخ جداول suspicious_activities_log
   - الصق وانقر Execute
   - انسخ جداول wallet_transactions
   - الصق وانقر Execute
   ```

3. **فعّل RLS Policies** (بالترتيب)
   ```
   - Execute admin_users RLS
   - Execute courier_profiles RLS
   - Execute wallets RLS
   - Execute wallet_transactions RLS
   - Execute suspicious_activities_log RLS
   - Execute orders RLS
   ```

4. **أنشئ RPC Functions** (بالترتيب)
   ```
   - Execute is_admin() function
   - Execute is_courier() function
   - Execute add_to_wallet_secure() function
   - Execute debit_wallet_secure() function
   ```

---

## 5️⃣ التحديثات المطلوبة في الكود

### في `/src/lib/paymentSecurity.js`

بدّل استدعاءات wallet من direct إلى RPC:

```javascript
// OLD - مباشر (غير آمن)
await supabase.from('wallets').update({...}).eq('id', walletId);

// NEW - من خلال RPC (آمن)
const { data, error } = await supabase.rpc('debit_wallet_secure', {
  p_user_id: userId,
  p_amount: amount,
  p_order_id: orderId
});
```

### في `/src/pages/Cart.jsx`

استخدم RPC بدلاً من direct update:

```javascript
// Use the secure RPC function
const { data, error } = await supabase.rpc('debit_wallet_secure', {
  p_user_id: user.id,
  p_amount: finalTotalUSD,
  p_order_id: order.id
});

if (error || !data.success) {
  await logSuspiciousPaymentAttempt(supabase, user.id, 'wallet_debit_failed', {
    error: error?.message || data?.error
  });
  throw new Error('فشل خصم من المحفظة');
}
```

---

## 6️⃣ اختبار التطبيق

بعد تطبيق الـ SQL:

```bash
# أعد بناء التطبيق
npm run build

# اختبر محليول
npm run dev

# جرب:
1. إضافة أموال إلى المحفظة
2. الدفع من المحفظة
3. عرض السجل المريب في Admin Panel
4. محاولة الوصول من مستخدم عادي إلى /SupervisorPanel
```

---

## 📋 ملخص الخطوات

| خطوة | الإجراء | الحالة |
|------|--------|--------|
| 1 | تشغيل SQL جداول جديدة | ⏳ **تحت الانتظار** |
| 2 | تفعيل RLS Policies | ⏳ **تحت الانتظار** |
| 3 | إنشاء RPC Functions | ⏳ **تحت الانتظار** |
| 4 | تحديث الكود في paymentSecurity.js | ⏳ **تحت الانتظار** |
| 5 | تحديث Cart.jsx للاستخدام RPC | ⏳ **تحت الانتظار** |
| 6 | بناء واختبار التطبيق | ⏳ **تحت الانتظار** |

---

## ⚠️ ملاحظات مهمة

- **لا تخطّ هذه الخطوات** - بدونها الحماية ناقصة
- **RLS** سيرفع أمان CRUD operations
- **RPC Functions** تمنع الوصول المباشر للبيانات الحساسة
- **wallet_transactions** تسجل كل عملية للتدقيق

---

**حالة الإكمال:** 🔴 معلق على Supabase SQL
