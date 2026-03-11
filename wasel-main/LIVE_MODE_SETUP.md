# 🚀 تعديل الكود للعمل مع PAYPAL_ENV = live

## ✅ الحالة الحالية

أنت وضعت: `PAYPAL_ENV = live` في Supabase Environment Variables

هذا يعني: **الدفعات ستكون حقيقية!**

---

## 📋 التحديثات اللازمة

### 1. ✅ الكود بالفعل معدّل للـ Live

الـ `create-paypal-payment` Function بالفعل يدعم Live:

```typescript
const PAYPAL_ENV = (Deno.env.get('PAYPAL_ENV') || 'sandbox').toLowerCase();
const PAYPAL_API_BASE = PAYPAL_ENV === 'live' 
  ? 'https://api-m.paypal.com'              // ✅ Live API
  : 'https://api-m.sandbox.paypal.com';     // Sandbox API

function getBaseUrl(): string {
  if (PAYPAL_ENV === 'live') {
    return 'https://www.wasel.life';        // ✅ Live Domain
  }
  return 'https://localhost:5173';          // Dev Domain
}
```

**النتيجة:**
- ✅ API requests تذهب لـ PayPal Live
- ✅ Return URL = https://www.wasel.life/payment-success
- ✅ Cancel URL = https://www.wasel.life/cart

---

### 2. ⚠️ التحقق من الـ Credentials

**المهم جداً:**

```
في .env الحالي:
VITE_PAYPAL_CLIENT_ID=AQyh8RxcB162...
VITE_PAYPAL_CLIENT_SECRET=EFQvHdo0zh...

❓ هذه Sandbox أم Live credentials؟

إذا كانت Sandbox:
❌ لن تعمل مع PAYPAL_ENV=live

يجب أن تكون:
✅ Live Client ID (من PayPal Live)
✅ Live Client Secret (من PayPal Live)
```

**كيفية التحقق:**

```
1. الذهاب إلى: https://developer.paypal.com/dashboard
2. Log in بـ PayPal account
3. الذهاب لـ: Apps & Credentials
4. اختر: Live tab
5. اختر: Your App
6. انسخ:
   - Live Client ID
   - Live Secret
7. تحقق أنها تختلف عن Sandbox
```

---

### 3. ⚠️ التحقق من Supabase Credentials

```
Supabase Dashboard:
→ Project: ofdqkracfqakbtjjmksa
→ Settings → Functions → Environment Variables

تأكد من:
✅ PAYPAL_CLIENT_ID = <Live ID>
✅ PAYPAL_CLIENT_SECRET = <Live Secret>
✅ PAYPAL_ENV = live
```

---

### 4. ⚠️ التحقق من الـ Webhooks (اختياري)

إذا كنت تستخدم Webhooks:

```
PayPal Dashboard → Webhooks

تأكد من:
✅ Webhook URL = https://www.wasel.life/api/paypal-webhook
✅ Event types مختارة (payment.capture.completed, etc)
```

---

## 🧪 الاختبار بـ Live Mode

### ⚠️ تحذير مهم:

```
PAYPAL_ENV = live
→ كل دفعة ستكون حقيقية!
→ ستُخصم من البطاقة الحقيقية!

قبل الاختبار:
☑ تأكد من الـ credentials
☑ اختبر برقم صغير جداً ($0.01)
☑ تأكد من URLs
☑ استعد لاسترجاع المبلغ إذا حدثت مشكلة
```

### خطوات الاختبار:

```bash
# 1. تأكد من الـ Environment Variables في Supabase
#    PAYPAL_ENV = live
#    PAYPAL_CLIENT_ID = <Live>
#    PAYPAL_CLIENT_SECRET = <Live>

# 2. Deploy الـ Functions
npm run deploy:functions

# 3. شغّل التطبيق
npm run dev

# 4. اختبر برقم صغير جداً
#    $0.01 أو $1.00

# 5. افتح Console و Supabase Logs
#    تأكد من النجاح

# 6. تحقق من PayPal Dashboard
#    → Activity → Transactions
```

---

## ✅ الحالة الحالية

| العنصر | الحالة | الملاحظات |
|-------|--------|----------|
| Code | ✅ جاهز | يدعم Live Mode تلقائياً |
| Credentials في .env | ⚠️ تحقق | هل Live أم Sandbox؟ |
| Supabase Environment | ⚠️ تحقق | هل موجودة بشكل صحيح؟ |
| getBaseUrl() | ✅ جاهز | يشير لـ wasel.life في Live |
| PAYPAL_API_BASE | ✅ جاهز | يشير لـ api-m.paypal.com |
| Return URL | ✅ جاهز | https://www.wasel.life/payment-success |
| Cancel URL | ✅ جاهز | https://www.wasel.life/cart |

---

## 📝 الأسئلة الشائعة

### Q: هل الكود بحاجة تعديلات للـ Live؟
**A:** ❌ لا! الكود بالفعل يدعم Live تلقائياً

### Q: ماذا يحتاج للعمل مع Live؟
**A:**
1. ✅ Live Credentials من PayPal
2. ✅ PAYPAL_ENV = live في Supabase
3. ✅ Deploy الـ Functions
4. ✅ أن يكون الـ domain عام (wasel.life)

### Q: هل بإمكاني الرجوع للـ Sandbox؟
**A:** نعم! غيّر:
```
PAYPAL_ENV = sandbox
PAYPAL_CLIENT_ID = <Sandbox ID>
PAYPAL_CLIENT_SECRET = <Sandbox Secret>
ثم: npm run deploy:functions
```

### Q: كم الحد الأدنى للدفعة في Live؟
**A:** $0.01 دولار (1 فلس!)

### Q: ماذا لو أردت استرجاع المبلغ؟
**A:**
1. الذهاب لـ PayPal Dashboard
2. Activity → Transactions
3. اختر الـ transaction
4. Refund

---

## 🔍 التحقق من الحالة

### في Console أثناء الدفع:

```
🔧 PayPal Configuration: {
  PAYPAL_ENV: "live",                           // ✅
  PAYPAL_API_BASE: "https://api-m.paypal.com", // ✅
  HAS_CLIENT_ID: true,                          // ✅
  HAS_CLIENT_SECRET: true                       // ✅
}
```

### في Supabase Logs:

```
🟣 Creating PayPal order...
(يجب أن يشتغل مع Live API)
✅ Order created: { id: "...", status: "CREATED" }
(يجب أن يرجع Order من PayPal Live)
```

### في PayPal Dashboard:

```
Dashboard → Activity → Transactions
(يجب أن تظهر الدفعة الحقيقية)
```

---

## ✨ النتيجة المتوقعة

بعد التعديلات:

```
✅ PAYPAL_ENV = live
✅ الكود يستخدم PayPal Live API
✅ URLs صحيحة (wasel.life)
✅ الدفعات حقيقية
✅ جاهز للإنتاج
```

---

## 🚨 قائمة تحقق قبل الدفع الأول:

```
☐ تحققت من Live Credentials (ليس Sandbox)
☐ أضفت Credentials في Supabase
☐ PAYPAL_ENV = live في Supabase
☐ نشرت الـ Functions
☐ اختبرت برقم صغير ($0.01)
☐ تأكدت من wasel.life domain
☐ فهمت أن الدفعات حقيقية
☐ جاهز للإطلاق
```

---

**الآن أنت جاهز للـ Live Mode! 🚀**

**إذا احتجت أي شيء: قل لي! 💪**
