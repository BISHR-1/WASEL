# دليل النشر والتطبيق - إصلاح PayPal للموبايل

## 📋 قائمة التحقق قبل النشر

### 1. التحقق من البيئة الإنتاجية ✅

```bash
# تحقق من وجود متغيرات البيئة
PAYPAL_CLIENT_ID=<your-live-client-id>
PAYPAL_CLIENT_SECRET=<your-live-client-secret>
PAYPAL_ENV=live (أو sandbox للاختبار)
VITE_SUPABASE_FUNCTIONS_URL=https://ofdqkracfqakbtjjmksa.supabase.co/functions/v1
```

### 2. التحقق من الدومين ✅

```
https://www.wasel.life يجب أن يكون:
- ✅ مسجل في PayPal App Settings
- ✅ مضاف في Return URLs
- ✅ مضاف في Cancel URLs
```

### 3. التحقق من الملفات المُصححة ✅

```bash
# تأكد من وجود Fallback في جميع الملفات:
grep -r "https://www.wasel.life" src/ supabase/functions/

# يجب أن تجد:
- supabase/functions/create-paypal-order/index.ts
- supabase/functions/create-paypal-payment/index.ts  
- api/create-paypal-order.js
```

---

## 🚀 خطوات النشر

### خطوة 1: نشر Supabase Functions
```bash
# تأكد من تسجيل الدخول للـ Supabase CLI
supabase login

# نشر الـ functions
supabase functions deploy create-paypal-order
supabase functions deploy create-paypal-payment
supabase functions deploy capture-paypal-payment
```

### خطوة 2: تحديث متغيرات البيئة في Supabase
```bash
# في Supabase Dashboard:
Settings → Functions → Environment Variables

# أضف أو حدّث:
PAYPAL_CLIENT_ID = <your-live-id>
PAYPAL_CLIENT_SECRET = <your-live-secret>
PAYPAL_ENV = live
```

### خطوة 3: نشر الموقع
```bash
# بناء الـ production build
npm run build

# نشر (حسب نظام الاستضافة)
# Vercel: vercel deploy --prod
# Netlify: netlify deploy --prod
# Docker: docker build -t wasel . && docker push wasel:latest
```

### خطوة 4: تحديث تطبيق الموبايل
```bash
# ضع النسخة الجديدة من الكود في تطبيق الموبايل
# اختبر على الأجهزة الفعلية قبل النشر للمتجر
```

---

## 🧪 اختبار شامل

### اختبار 1: على الويب ✅
```
1. افتح https://www.wasel.life
2. أضف منتج للسلة
3. اذهب لصفحة السلة
4. اختر "الدفع عبر PayPal"
5. تحقق:
   ✅ إعادة توجيه إلى PayPal
   ✅ بدون أخطاء
   ✅ بعد الموافقة، عودة للموقع
```

### اختبار 2: على الموبايل (الويب) ✅
```
1. افتح الموقع من متصفح الموبايل
2. نفس خطوات الاختبار 1
3. تحقق أن الـ origin header = null
   (استخدم DevTools أو Supabase logs)
4. يجب أن يعمل بنفس الطريقة
```

### اختبار 3: على تطبيق الموبايل الفعلي ✅
```
1. نفس الخطوات مع التطبيق الأصلي
2. تحقق من الـ logs في Supabase:
   - supabase > Logs > Edge Functions
   - ابحث عن: "Payment successful" أو أي أخطاء
```

### اختبار 4: Sandbox Testing (قبل Live)
```bash
# تأكد من استخدام Sandbox أولاً
PAYPAL_ENV=sandbox

# استخدم بطاقة اختبار PayPal:
Email: sb-xxx@personal.example.com
Password: test_pass

# بعد النجاح، اذهب للـ Live
PAYPAL_ENV=live
```

---

## 📊 مراقبة بعد النشر

### ملاحظة الـ Logs
```bash
# الذهاب إلى Supabase Dashboard
Logs → Edge Functions → create-paypal-payment

# ابحث عن:
- ✅ "Payment successful"
- ❌ "INVALID_PARAMETER_SYNTAX" (يجب أن تختفي)
- ❌ "Origin header is null" (يجب أن تختفي)
```

### المقاييس المهمة
```
✅ معدل النجاح > 95%
❌ معدل الفشل < 5%
⏱️ متوسط الوقت < 3 ثواني
```

---

## 🔧 استكشاف الأخطاء

### المشكلة: "INVALID_PARAMETER_SYNTAX"
**السبب:** origin header لم يتم استبداله بـ fallback
**الحل:**
```bash
# تحقق من أن جميع الملفات محدثة
grep "wasel.life" supabase/functions/create-paypal-order/index.ts

# أعد نشر الـ function
supabase functions deploy create-paypal-order
```

### المشكلة: "Order creation failed"
**السبب:** مشاكل مع المفاتيح أو البيئة
**الحل:**
```bash
# تحقق من متغيرات البيئة
supabase functions env list create-paypal-order

# تحقق من المفاتيح في PayPal Dashboard
# تأكد من صحة المفاتيح المسجلة
```

### المشكلة: الأخطاء على الموبايل فقط
**السبب:** ربما لم يتم تحديث التطبيق
**الحل:**
```bash
# إذا كان تطبيق ويب:
- امسح كاش المتصفح (Ctrl+Shift+Delete)
- أعد تحميل الصفحة (Ctrl+F5)

# إذا كان تطبيق موبايل:
- أعد تثبيت التطبيق من المتجر
- تحقق من إصدار التطبيق
```

---

## ✨ ملخص الفوائد

```
✅ يعمل على الموبايل والويب
✅ لا توجد أخطاء INVALID_PARAMETER_SYNTAX
✅ تجربة دفع سلسة
✅ معدل تحويل أعلى
✅ عدد شكاوى أقل من المستخدمين
```

---

## 📞 للدعم الإضافي

إذا واجهت مشاكل:

1. **اطلع على الـ Logs** في Supabase Dashboard
2. **تحقق من PayPal Status** على PayPal Dashboard
3. **راجع ملف التفاصيل** `PAYPAL_MOBILE_FIX.md`
4. **اختبر مع Sandbox أولاً** قبل الـ Live

---

**تاريخ آخر تحديث:** 5 فبراير 2026
**الحالة:** جاهز للنشر ✅
