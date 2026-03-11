# =====================================================
# WASEL - OWASP TOP 10 SECURITY CHECKLIST
# Date: 2025
# =====================================================

## ✅ A01:2021 - Broken Access Control (التحكم في الوصول المعطّل)

### المنفذ ✅
- [x] Row Level Security (RLS) مفعّل على جميع الجداول
- [x] سياسات RLS تتحقق من `auth.uid()` قبل أي عملية
- [x] فصل الأدوار: user, courier, operator, admin
- [x] منع الوصول المباشر لجداول المستخدمين الآخرين
- [x] التحقق من ملكية السجلات قبل التعديل/الحذف

### الكود المرجعي
```sql
-- supabase/migrations/002_rls_policies.sql
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "orders_user_access" ON orders
  FOR ALL USING (
    user_id = auth.uid() OR
    courier_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('operator', 'admin'))
  );
```

---

## ✅ A02:2021 - Cryptographic Failures (فشل التشفير)

### المنفذ ✅
- [x] تشفير AES-256-GCM لرسائل الدردشة
- [x] مفاتيح التشفير في Supabase Secrets (KMS)
- [x] IV عشوائي لكل رسالة (96-bit)
- [x] Authentication Tag للتحقق من سلامة البيانات
- [x] HTTPS فقط للاتصالات

### الكود المرجعي
```typescript
// supabase/functions/ai-chat/index.ts
const algorithm = 'aes-256-gcm';
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv(algorithm, key, iv);
// IV + AuthTag + Ciphertext stored together
```

---

## ✅ A03:2021 - Injection (الحقن)

### المنفذ ✅
- [x] Prepared Statements عبر Supabase Client
- [x] تعقيم المدخلات قبل الإدخال في قاعدة البيانات
- [x] منع XSS عبر `sanitizeInput()` و `escapeHtml()`
- [x] كشف Prompt Injection في AI Chat

### الكود المرجعي
```javascript
// src/lib/security.js
export const sanitizeInput = (input, maxLength = 1000) => {
  return String(input)
    .replace(/[<>'"]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength);
};

// Prompt Injection Detection
const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+instructions/i,
  /system\s*:\s*/i,
  /\[\[.*\]\]/,
];
```

---

## ✅ A04:2021 - Insecure Design (التصميم غير الآمن)

### المنفذ ✅
- [x] نمط الدفاع في العمق (Defense in Depth)
- [x] فصل طبقات التطبيق (Client / Edge Functions / Database)
- [x] Idempotency Keys لمنع الطلبات المكررة
- [x] Price Snapshot لمنع التلاعب بالأسعار
- [x] قفل الكمية أثناء عملية الدفع

### الكود المرجعي
```typescript
// supabase/functions/create-order/index.ts
// 1. Check idempotency
const existing = await supabase.from('idempotency_keys').select('*')...

// 2. Lock stock
const locked = await supabase.rpc('reserve_stock', { p_product_id, p_qty });

// 3. Validate price snapshot
if (item.current_price !== item.snapshot_price) throw new Error('Price changed');
```

---

## ✅ A05:2021 - Security Misconfiguration (سوء التكوين الأمني)

### المنفذ ✅
- [x] متغيرات البيئة في Supabase Secrets
- [x] CORS محدد للنطاقات المسموحة فقط
- [x] Content-Security-Policy header
- [x] لا يتم كشف stack traces للمستخدم
- [x] تعطيل الـ debug mode في الإنتاج

### التوصيات الإضافية
```env
# .env.production
VITE_DEBUG=false
VITE_SUPABASE_URL=https://xxx.supabase.co
# Never expose SUPABASE_SERVICE_ROLE_KEY to client
```

---

## ✅ A06:2021 - Vulnerable and Outdated Components (مكونات ضعيفة وقديمة)

### المنفذ ✅
- [x] `npm audit` في CI/CD pipeline
- [x] Dependabot enabled على GitHub
- [x] تحديثات أمنية تلقائية

### الإجراءات المطلوبة
```bash
# فحص الثغرات
npm audit

# تحديث التبعيات
npm update
npm audit fix
```

---

## ✅ A07:2021 - Identification and Authentication Failures (فشل التعريف والمصادقة)

### المنفذ ✅
- [x] المصادقة عبر Supabase Auth (Google OAuth + OTP)
- [x] قفل الحساب بعد 5 محاولات فاشلة
- [x] Session timeout (15 دقيقة خمول)
- [x] كلمات مرور قوية (12+ حرف، أرقام، رموز)
- [x] 2FA جاهز للتفعيل (TOTP)

### الكود المرجعي
```javascript
// src/lib/security.js
export const validatePassword = (password) => {
  return (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^a-zA-Z0-9]/.test(password)
  );
};

// Account lockout
if (failed_attempts >= 5) {
  locked_until = NOW() + INTERVAL '15 minutes';
}
```

---

## ✅ A08:2021 - Software and Data Integrity Failures (فشل سلامة البرمجيات والبيانات)

### المنفذ ✅
- [x] التحقق من توقيع PayPal Webhooks (CRC32)
- [x] Webhook logs للتدقيق
- [x] تسجيل جميع العمليات الحساسة في `audit_logs`

### الكود المرجعي
```typescript
// supabase/functions/paypal-webhook/index.ts
// Verify webhook signature
const crc = crc32.str(JSON.stringify(body));
const expectedSignature = computeExpectedSignature(crc, transmissionId, timestamp);
if (actualSignature !== expectedSignature) {
  throw new Error('Invalid webhook signature');
}
```

---

## ✅ A09:2021 - Security Logging and Monitoring Failures (فشل التسجيل والمراقبة الأمنية)

### المنفذ ✅
- [x] جدول `audit_logs` لجميع العمليات الحساسة
- [x] Rate limiting logs
- [x] Webhook transaction logs
- [x] IP tracking للأنشطة المشبوهة

### الجداول المنشأة
```sql
-- audit_logs: سجل جميع العمليات
-- webhook_logs: سجل الـ webhooks
-- rate_limits: سجل معدل الطلبات
```

---

## ✅ A10:2021 - Server-Side Request Forgery (SSRF)

### المنفذ ✅
- [x] التحقق من URLs قبل الطلبات الخارجية
- [x] قائمة بيضاء للنطاقات المسموحة
- [x] حظر الطلبات إلى localhost/internal IPs

### الكود المرجعي
```typescript
// PayPal webhook - validate cert_url
const certUrl = new URL(headers['paypal-cert-url']);
if (!certUrl.hostname.endsWith('.paypal.com')) {
  throw new Error('Invalid certificate URL');
}
```

---

## 📊 ملخص الحالة

| الفئة | الحالة | الأولوية |
|-------|--------|----------|
| A01 - Broken Access Control | ✅ منفذ | عالية |
| A02 - Cryptographic Failures | ✅ منفذ | عالية |
| A03 - Injection | ✅ منفذ | عالية |
| A04 - Insecure Design | ✅ منفذ | متوسطة |
| A05 - Security Misconfiguration | ✅ منفذ | متوسطة |
| A06 - Outdated Components | ✅ إجراءات | متوسطة |
| A07 - Auth Failures | ✅ منفذ | عالية |
| A08 - Integrity Failures | ✅ منفذ | عالية |
| A09 - Logging Failures | ✅ منفذ | متوسطة |
| A10 - SSRF | ✅ منفذ | متوسطة |

---

## 🔑 Environment Variables المطلوبة

```env
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # Server-side only

# PayPal
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=

# AI Chat
OPENAI_API_KEY=
CHAT_ENCRYPTION_KEY=  # 32-byte hex string

# Optional
RATE_LIMIT_MAX=100
SESSION_TIMEOUT_MINUTES=15
```

---

## 🚀 Deployment Checklist

- [ ] تأكد من تشغيل `npm audit` قبل النشر
- [ ] تحقق من إعدادات CORS في Supabase
- [ ] فعّل RLS على جميع الجداول الجديدة
- [ ] أضف Secrets للـ Edge Functions
- [ ] راجع سجلات `audit_logs` أسبوعياً
- [ ] اختبر سيناريوهات الاختراق (Penetration Testing)

---

*آخر تحديث: 2025*
