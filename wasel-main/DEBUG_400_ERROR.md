# 🔴 خطأ 400 - Bad Request في PayPal Payment

## المشكلة

```
POST https://ofdqkracfqakbtjjmksa.supabase.co/functions/v1/create-paypal-payment 400 (Bad Request)
Error: HTTP error! status: 400
Hosted Fields initialization error
```

---

## الأسباب المحتملة و الحلول

### 1️⃣ Missing PayPal Credentials

**الاختبار:**
```
Supabase Dashboard → Settings → Functions → Environment Variables

تحقق من وجود:
✅ PAYPAL_CLIENT_ID
✅ PAYPAL_CLIENT_SECRET
✅ PAYPAL_ENV = sandbox (أو live)
```

**إذا كانت غير موجودة:**
```
1. الذهاب لـ Supabase Dashboard
2. Project → Settings → Functions
3. اضغط "Edit Environment Variables"
4. أضف:
   - PAYPAL_CLIENT_ID = <your_sandbox_id>
   - PAYPAL_CLIENT_SECRET = <your_sandbox_secret>
   - PAYPAL_ENV = sandbox
5. Save
6. إعادة نشر: npm run deploy:functions
```

---

### 2️⃣ Invalid Amount Format

**الخطأ:**
```javascript
// يُرسل كـ string
amount: "228.00"

// الـ Function تتوقع رقم
if (!amount || isNaN(parseFloat(amount))) {
    throw new Error("Amount is required and must be a valid number");
}
```

**الحل:**
- تم إصلاحه في الـ Function
- الآن يقبل string و number
- إعادة نشر: ✅ تم بالفعل

---

### 3️⃣ Missing Required Fields

**المتوقع في الـ request:**
```javascript
{
    action: "create",      // ✅ مطلوب
    amount: 228.00,        // ✅ مطلوب
    currency: "USD",       // اختياري (default: USD)
    orderDescription: "",  // اختياري
    return_url: "",        // اختياري (يستخدم fallback)
    cancel_url: ""         // اختياري (يستخدم fallback)
}
```

**الحل:**
- تأكد أن `action` و `amount` موجودين
- الباقي اختياري

---

### 4️⃣ CORS Issues

**الخطأ:**
```
POST request blocked by CORS
Origin not allowed
```

**الحل:**
- تم إصلاح CORS في الـ Function
- Headers سليمة: `'Access-Control-Allow-Origin': '*'`
- إعادة نشر: ✅ تم بالفعل

---

### 5️⃣ Content-Type Header

**الخطأ:**
```
Content-Type is not application/json
```

**الحل:**
```javascript
// في CardPaymentForm.jsx
headers: {
    'Content-Type': 'application/json',  // ✅ صحيح
    'Authorization': `Bearer ${ANON_KEY}`,
    'apikey': ANON_KEY
}
```

---

## ✅ التحديثات المطبقة

### 1. create-paypal-payment/index.ts

**إضافة Logging:**
```typescript
// تسجيل configuration
console.log('🔧 PayPal Configuration:', {
  PAYPAL_ENV,
  PAYPAL_API_BASE,
  HAS_CLIENT_ID: !!PAYPAL_CLIENT_ID,
  HAS_CLIENT_SECRET: !!PAYPAL_CLIENT_SECRET,
});

// تسجيل amount validation
console.error('❌ Invalid amount:', amount, 'type:', typeof amount);
```

**تحسين Validation:**
```typescript
if (!amount || isNaN(parseFloat(amount.toString()))) {
    throw new Error("Amount is required and must be a valid number");
}
```

### 2. Functions Deployed

✅ create-paypal-order
✅ create-paypal-payment (محدث الآن)
✅ capture-paypal-payment

---

## 🧪 التشخيص

### خطوات تشخيص الخطأ:

1. **افتح Supabase Logs:**
   ```
   Supabase Dashboard → Functions → create-paypal-payment → Logs
   ```

2. **ابحث عن الخطأ:**
   ```
   - Missing PayPal Credentials?
   - Invalid amount?
   - Missing action?
   - CORS error?
   ```

3. **افحص Browser Console:**
   ```
   F12 → Console
   ابحث عن الـ error message
   ```

4. **تحقق من الـ request payload:**
   ```
   F12 → Network
   اختر POST request لـ create-paypal-payment
   اعرض Request Body
   ```

---

## 🚀 الحل الكامل

### الخطوة 1: تحقق من Supabase Environment Variables

```
Supabase Dashboard:
→ Project: ofdqkracfqakbtjjmksa
→ Settings → Functions
→ Environment Variables

تأكد من:
✅ PAYPAL_CLIENT_ID = AQyh8RxcB162UBup5qnzvCCoHfQQShlukM5VW4j-gpDGofEsP4iQkwEN9ZU-gTlLPHerV90Qm15tBPve
✅ PAYPAL_CLIENT_SECRET = EFQvHdo0zhNXzU_DYSoFFe5PLTuOT-6GZj0bSNrtbTUOmmOVcRv6KxNpZ0JbD1JAfSbSHy9xxTGMMd5R
✅ PAYPAL_ENV = sandbox
```

### الخطوة 2: الـ Functions تم تحديثها

✅ تم deployment الـ Functions الجديدة

### الخطوة 3: اختبر الآن

```bash
# Refresh التطبيق
Ctrl+R (أو Cmd+R على Mac)

# ثم:
1. أضف منتج للسلة
2. افتح السلة
3. اختر "الدفع ببطاقة الائتمان"
4. افتح Console (F12)
5. تفحص الـ logs
```

---

## 📝 Expected Logs

### عند النجاح:

```
🔧 PayPal Configuration: {
  PAYPAL_ENV: "sandbox",
  PAYPAL_API_BASE: "https://api-m.sandbox.paypal.com",
  HAS_CLIENT_ID: true,
  HAS_CLIENT_SECRET: true
}
🟣 Creating PayPal order...
✅ Order created: { id: "...", status: "CREATED", ... }
🟣 Initializing Hosted Fields...
✅ Hosted Fields initialized
```

### عند الفشل:

```
🔧 PayPal Configuration: {
  HAS_CLIENT_ID: false,  // ❌ أو false
  HAS_CLIENT_SECRET: false  // ❌ أو false
}
❌ Invalid amount: ...
❌ Missing PayPal Credentials
```

---

## ✨ النتيجة المتوقعة

بعد التحقق من الخطوات أعلاه:

```
✅ الـ Function تستجيب بـ 200 (OK)
✅ Order تُنشأ بنجاح
✅ Hosted Fields تهيّأ بشكل صحيح
✅ النموذج يفتح للمستخدم
✅ الدفع يعمل!
```

---

**اتبع الخطوات أعلاه وأخبرني بالنتائج! 🚀**
