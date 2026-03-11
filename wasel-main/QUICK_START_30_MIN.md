# ⚡ خطوات فورية - PayPal Live في 30 دقيقة

## 🚀 الآن! (الخطوات الثلاث فقط)

### ✅ 1. حصّل على PayPal Credentials (5 دقائق)
```
1. اذهب: https://developer.paypal.com/dashboard/
2. Login
3. Live → App Credentials
4. Copy:
   - Client ID: AQxxx...
   - Secret: EJxxx...
```

### ✅ 2. ضعها في Supabase (5 دقائق)
```
1. اذهب: https://app.supabase.com/
2. Project → Settings → Functions
3. Environment Variables
4. أضف:
   PAYPAL_CLIENT_ID = AQxxx...
   PAYPAL_CLIENT_SECRET = EJxxx...
   PAYPAL_ENV = live
```

### ✅ 3. نشّر Functions (5 دقائق)
```bash
cd wasel-main
npm run deploy:functions
# أو:
supabase functions deploy create-paypal-order
supabase functions deploy create-paypal-payment
```

---

## ✅ بعدها مباشرة (اختبار)

```bash
# شغّل المشروع
npm run dev

# اذهب: http://localhost:5173
# جرّب الدفع
# يجب أن تذهب لـ PayPal مباشرة
```

---

## ✅ ثم Android (20 دقيقة)

```bash
# بناء APK
npm run build:apk

# افتح Android Studio
# File → Open → wasel-main/android/
# اضغط Run

# جرّب الدفع من الموبايل
```

---

## 🎉 انتهى! 30 دقيقة كاملة

```
✅ PayPal Live يعمل
✅ الموبايل يعمل
✅ جميع الأخطاء حُلّت

🚀 الآن بدّء البيع!
```

---

## 📚 للتفاصيل الكاملة

- **PayPal Live:** اقرأ PAYPAL_LIVE_SETUP.md
- **Android:** اقرأ ANDROID_SETUP_GUIDE.md
- **كل الخطوات:** اقرأ START_HERE_IMPLEMENTATION.md

---

**ابدأ الآن! ⚡**
