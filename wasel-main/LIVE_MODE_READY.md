# ✅ الكود معدّل بالفعل للـ Live Mode

## 🔍 التحقق:

### 1️⃣ create-paypal-payment/index.ts

```typescript
// ✅ يختار API بناءً على PAYPAL_ENV
const PAYPAL_API_BASE = PAYPAL_ENV === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// ✅ يختار Domain بناءً على PAYPAL_ENV
function getBaseUrl(): string {
  if (PAYPAL_ENV === 'live') {
    return 'https://www.wasel.life';  // ← wasel.life الحقيقي
  }
  return 'https://localhost:5173';    // ← للتطوير
}

// النتيجة:
// return_url = https://www.wasel.life/payment-success  ✅
// cancel_url = https://www.wasel.life/cart            ✅
```

---

### 2️⃣ CardPaymentForm.jsx

```javascript
// ✅ يستخدم Supabase Functions المعدلة
const createResponse = await fetch(`${API_BASE}/create-paypal-payment`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
    },
    body: JSON.stringify({
        action: 'create',
        amount: amount.toString()  // ✅ يُرسل المبلغ
    })
});
```

---

## 📋 ما يحتاج تحقق من قبلك:

| العنصر | الحالة | التحقق |
|-------|--------|--------|
| PAYPAL_ENV = live | ⚠️ في Supabase | تأكد من وجوده |
| PAYPAL_CLIENT_ID | ⚠️ في Supabase | تأكد أنه Live (ليس Sandbox) |
| PAYPAL_CLIENT_SECRET | ⚠️ في Supabase | تأكد أنه Live (ليس Sandbox) |
| npm run deploy:functions | ⚠️ بعد إضافة vars | اعدم نشر الـ Functions |

---

## 🚀 خطوات التطبيق الفوري:

```bash
# 1. تأكد من Supabase Environment Variables:
#    PAYPAL_ENV = live
#    PAYPAL_CLIENT_ID = <Live من PayPal>
#    PAYPAL_CLIENT_SECRET = <Live من PayPal>

# 2. انشر الـ Functions مرة أخرى:
npm run deploy:functions

# 3. شغّل التطبيق:
npm run dev

# 4. اختبر!
```

---

## ⚠️ تحذير مهم:

```
PAYPAL_ENV = live
→ الدفعات ستكون حقيقية!
→ المال سيُخصم من البطاقة!

اختبر برقم صغير أولاً:
$0.01 أو $1.00
```

---

**كل شيء جاهز! ابدأ الاختبار! 🚀**
