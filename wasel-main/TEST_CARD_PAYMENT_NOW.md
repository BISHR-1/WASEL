# 🧪 اختبار الدفع ببطاقة الائتمان الآن

## ✅ الـ Functions تم نشرها بنجاح!

### الآن ابدأ الاختبار:

```bash
# 1. شغّل التطبيق
npm run dev

# سيفتح على: http://localhost:5173
```

---

## 🧑‍💻 خطوات الاختبار

### 1️⃣ في المتصفح

```
أدخل: http://localhost:5173
```

### 2️⃣ أضف منتج للسلة

```
- اختر أي مطعم
- اختر أي منتج
- ادفع "Add to Cart"
```

### 3️⃣ افتح السلة

```
- اضغط على أيقونة السلة 🛒
- ستشوف الإجمالي
```

### 4️⃣ اختر طريقة الدفع

```
ستشوف زرين:
1. "Pay with PayPal" (الزر الأحمر)
2. "Pay with Card" (الزر الأزرق)

⭐ اختر: "Pay with Card"
```

### 5️⃣ ملأ النموذج

```
اسم حامل البطاقة:
→ أكتب: Test User

رقم البطاقة:
→ أكتب: 4111 1111 1111 1111

تاريخ الانتهاء:
→ أكتب: 12/26

CVV:
→ أكتب: 123

ثم: اضغط "ادفع"
```

### 6️⃣ افتح Console (F12)

```
لتشوف الـ logs:

🟣 Loading PayPal Hosted Fields...
✅ PayPal SDK loaded successfully
🟣 Creating PayPal order...
✅ Order created: <order-id>
🟣 Initializing Hosted Fields...
✅ Hosted Fields initialized
(هنا تملأ البيانات)
🟣 Submitting card data...
✅ Card submitted successfully
🟣 Capturing payment for order: <order-id>
✅ Payment captured successfully
✨ يعني نجح الدفع!
```

---

## ✅ إذا نجح

```
ستشوف:
1. ✅ رسالة نجاح "تم الدفع بنجاح"
2. ✅ في Console: "Payment captured successfully"
3. ✅ في Supabase Logs: تأكيد الـ order
4. ✅ في PayPal Dashboard: ظهور الـ transaction
```

---

## ❌ إذا فشل

### الخطأ: "فشل تحميل نموذج الدفع"
```
❌ في Console: Failed to load PayPal SDK

السبب المحتمل:
1. VITE_PAYPAL_CLIENT_ID غير صحيح أو فارغ
2. مشكلة الاتصال بـ PayPal
3. المتصفح يحظر الـ script

الحل:
- تحقق من .env
- حاول في متصفح جديد (Incognito)
- تحقق من الاتصال بالإنترنت
```

### الخطأ: "نموذج الدفع غير جاهز"
```
❌ في Console: Hosted Fields not eligible

السبب المحتمل:
1. المتصفح لا يدعم Hosted Fields
2. الـ SDK لم يحمّل بشكل صحيح
3. بطاقة اختبار غير معروفة

الحل:
- حاول في Chrome/Firefox الأحدث
- امسح cache (Ctrl+Shift+Delete)
- تأكد من البطاقة: 4111 1111 1111 1111
```

### الخطأ: "فشل الدفع: 400"
```
❌ في Console: Capture response error

السبب المحتمل:
1. PAYPAL_CLIENT_SECRET غير صحيح في Supabase
2. PAYPAL_ENV = live لكن المعرفات Sandbox
3. Order ID انتهت صلاحيتها

الحل:
- تحقق من Supabase Environment Variables:
  Supabase → Settings → Functions → Environment Variables
  
  تأكد من:
  ✅ PAYPAL_CLIENT_ID صحيح
  ✅ PAYPAL_CLIENT_SECRET صحيح
  ✅ PAYPAL_ENV = sandbox (للاختبار)
  
- إعادة نشر:
  npm run deploy:functions
```

### الخطأ: "No order ID returned from submit"
```
❌ في Console: No order ID returned from submit

السبب المحتمل:
1. بيانات البطاقة غير صحيحة
2. Cardholder Name فارغ
3. PayPal SDK في حالة خطأ

الحل:
- تأكد من ملء cardholder name
- استخدم البطاقة الصحيحة: 4111 1111 1111 1111
- جرب في متصفح جديد
```

---

## 📝 معلومات مهمة

### بطاقات الاختبار (Sandbox):

| نوع البطاقة | الرقم | صلاحية | CVV |
|-----------|------|--------|-----|
| Visa | 4111 1111 1111 1111 | 12/26 | 123 |
| Mastercard | 5105 1051 0510 5100 | 12/26 | 123 |

### الأخطاء المتوقعة:
```
❌ 4000 0027 6000 3010 ← بطاقة مرفوضة
❌ 4000 0000 0000 0002 ← خطأ عام
✅ 4111 1111 1111 1111 ← بطاقة صحيحة
```

---

## 🎯 الخطوات التالية

### إذا نجح الاختبار:

1. ✅ جرّب زر Cancel
   ```
   - ابدأ عملية دفع جديدة
   - اضغط الـ X أو Cancel
   - يجب أن تعود للسلة (ليس لموقع خارجي)
   ```

2. ✅ تحقق من Supabase Logs
   ```
   Supabase → Functions → create-paypal-payment → Logs
   يجب أن تشوف success logs
   ```

3. ✅ اختبر على Sandbox أولاً
   ```
   PAYPAL_ENV = sandbox (تأكد)
   استخدم بطاقات Sandbox
   ```

4. ✅ إذا كل شيء يعمل، يمكنك الذهاب للـ Live
   ```
   اجري المعايرات:
   1. غيّر PAYPAL_ENV = live
   2. أضف Live Client ID و Secret
   3. انشر الـ Functions
   4. اختبر برقم صغير جداً ($0.01)
   ```

---

## 🚀 النتيجة المتوقعة

```
بعد النقر على "ادفع":

✅ في Console: Payment captured successfully
✅ رسالة نجاح على الشاشة
✅ في PayPal: ظهور الـ transaction
✅ في Supabase: تسجيل الـ order

🎉 الدفع ببطاقة الائتمان يعمل!
```

---

**ابدأ الآن: npm run dev** 🚀
