# 📋 خطوات النشر - إصلاح Cancel URL

## 🎯 المهمة
نشر إصلاح Cancel URL في PayPal

---

## 📋 خطوات النشر

### 1️⃣ اختبر على Localhost أولاً

```bash
# تأكد من أن .env صحيح
echo "VITE_SUPABASE_URL=https://ofdqkracfqakbtjjmksa.supabase.co"
echo "VITE_SUPABASE_ANON_KEY=..."

# شغّل التطبيق
npm run dev

# الاختبار:
# - أضف منتج
# - اضغط Pay with PayPal
# - اضغط Cancel عند PayPal
# - ✅ يجب أن تعود للسلة

# تحقق من URL:
# - يجب أن يكون: http://localhost:5173/cart
# - ليس: https://www.wasel.life/cart
```

### 2️⃣ انشر Supabase Functions

```bash
# تسجيل الدخول
supabase login

# حدد المشروع
supabase projects list
supabase link --project-ref ofdqkracfqakbtjjmksa

# انشر الـ Functions
supabase functions deploy create-paypal-order
supabase functions deploy create-paypal-payment

# تحقق من النشر
supabase functions list
```

### 3️⃣ اختبر على الـ Sandbox (في الـ Production URL)

```bash
# إذا كنت قد نشرت الفعل بـ wasel.life:

# تأكد من:
# - PAYPAL_ENV = sandbox (في Supabase Env Vars)
# - PAYPAL_CLIENT_ID و PAYPAL_CLIENT_SECRET موجودة

# الاختبار:
# - اذهب إلى: https://www.wasel.life
# - أضف منتج
# - اضغط Pay with PayPal
# - استخدم بطاقة اختبار Sandbox
# - اضغط Cancel عند PayPal
# - ✅ يجب أن تعود للسلة على wasel.life
```

### 4️⃣ تحديث البيئة إلى Live (اختياري)

```bash
# فقط عندما تكون جاهز للدفع الحقيقي:

# تحديث Supabase Environment Variables:
# - PAYPAL_ENV = live
# - PAYPAL_CLIENT_ID = <live_id>
# - PAYPAL_CLIENT_SECRET = <live_secret>

# ثم انشر مرة ثانية (اختياري للتحديث):
supabase functions deploy create-paypal-order
supabase functions deploy create-paypal-payment

# اختبر بحذر!
```

---

## 🔍 التحقق من النشر

### تحقق من Supabase Functions

```bash
# شاهد الـ Function logs
supabase functions logs create-paypal-order --limit 50
supabase functions logs create-paypal-payment --limit 50

# يجب أن ترى:
# - الطلبات الواردة
# - القيم الصحيحة للـ cancel_url
# - بدون أخطاء
```

### تحقق من PayPal Dashboard

```
1. اذهب إلى: https://developer.paypal.com/dashboard
2. اختر: Apps & Credentials
3. اختر: Sandbox (أو Live)
4. انظر إلى: Return URLs و Cancel URLs

يجب أن تكون مسجلة:
- Return: https://www.wasel.life/payment-success
- Cancel: https://www.wasel.life/cart
```

---

## 🆘 استكشاف الأخطاء

### ❌ "Cancel لم يذهب للسلة"

**الحل:**
```bash
# 1. تحقق من الـ Functions في Supabase
supabase functions logs create-paypal-payment

# 2. ابحث عن cancel_url في الـ logs
# يجب أن ترى: cancel_url: https://www.wasel.life/cart

# 3. إذا كان خطأ:
#    - أعد نشر الـ Functions
#    - supabase functions deploy create-paypal-payment

# 4. امسح الـ Cache
#    - Ctrl+Shift+Delete
#    - اختر: Cookies and Cached Images
```

### ❌ "URL غريب أو null"

**الحل:**
```bash
# 1. تحقق من Origin header:
# في الـ Function logs، ابحث عن:
# req.headers.get('origin')

# 2. إذا كان null:
# يتم استخدام fallback: https://localhost:5173
# هذا ليس مشكلة على الـ Live (لن يكون null)

# 3. أضف logging:
console.log('Cancel URL:', {
  origin: req.headers.get('origin'),
  finalUrl: `${req.headers.get('origin') || 'https://localhost:5173'}/cart`
});
```

---

## 📊 ملخص الملفات

| الملف | التغيير | الحالة |
|------|--------|--------|
| `create-paypal-order/index.ts` | cancel_url جديد | ✅ نُشر |
| `create-paypal-payment/index.ts` | cancel_url جديد | ✅ نُشر |
| `api/create-paypal-order.js` | cancel_url جديد | ✅ محلي فقط |
| `src/api/paypal-direct.js` | cancel_url جديد | ✅ محلي فقط |

---

## ✅ قائمة التحقق

```
قبل النشر:
□ اختبرت على Localhost بنجاح
□ Cancel يذهب إلى السلة
□ URL صحيح وبدون أخطاء

النشر:
□ سجلت دخول Supabase
□ نشرت create-paypal-order
□ نشرت create-paypal-payment
□ لا توجد أخطاء في النشر

بعد النشر:
□ اختبرت على wasel.life
□ Cancel يعمل بشكل صحيح
□ Success يعمل بشكل صحيح
□ لا توجد مشاكل
```

---

## 🚀 النتيجة النهائية

بعد النشر بنجاح:
```
✅ المستخدم يضغط Cancel
✅ يعود مباشرة للسلة
✅ التجربة سلسة وطبيعية
✅ الموبايل والويب يعملان
✅ جاهز للإطلاق!
```

---

## 📞 الدعم

إذا واجهت مشاكل:

1. **اقرأ:** [PAYPAL_CANCEL_URL_FIX.md](PAYPAL_CANCEL_URL_FIX.md)
2. **تحقق من:** Supabase Functions Logs
3. **ابحث عن:** PayPal Sandbox/Live Dashboard
4. **اختبر:** على localhost أولاً

---

**✅ تم إصلاح وجاهز للنشر!**
