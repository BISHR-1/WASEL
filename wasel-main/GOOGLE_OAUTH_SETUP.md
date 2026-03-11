# إعداد تسجيل الدخول عبر Google OAuth

## ✅ ما تم إنجازه:

### 1. الملفات الجديدة:
- ✅ `src/lib/googleAuth.js` - وظائف Google OAuth
- ✅ `src/lib/unifiedAuth.js` - نظام موحد للجلسات (OTP + Google)
- ✅ `src/components/auth/GoogleSignInButton.jsx` - زر تسجيل الدخول بـ Google

### 2. التحديثات:
- ✅ `src/pages/MyOrders.jsx` - دعم كلا النظامين
- ✅ `src/pages/Profile.jsx` - تسجيل خروج موحد
- ✅ `src/components/auth/EmailOtpLogin.jsx` - إضافة زر Google
- ✅ `.env` - إضافة VITE_GOOGLE_WEB_CLIENT_ID

---

## 🔧 الخطوات المتبقية:

### الخطوة 1: إعداد Supabase Dashboard

1. افتح: https://supabase.com/dashboard/project/ofdqkracfqakbtjjmksa
2. اذهب إلى: **Authentication** > **Providers**
3. ابحث عن **Google** واضغط عليه
4. فعّل المزود وأدخل:

```
✅ Enable Sign in with Google: ON

Client ID (for OAuth):
YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com

Client Secret (for OAuth):
YOUR_GOOGLE_OAUTH_CLIENT_SECRET
```

5. اضغط **Save**

---

### الخطوة 2: إعداد Google Cloud Console

تأكد من إضافة هذه الروابط:

#### Authorized JavaScript origins:
```
http://localhost:5173
https://ofdqkracfqakbtjjmksa.supabase.co
```

#### Authorized redirect URIs:
```
http://localhost:5173
https://ofdqkracfqakbtjjmksa.supabase.co/auth/v1/callback
```

⚠️ **مهم جداً:** الرابط الثاني يجب أن ينتهي بـ `/auth/v1/callback`

---

## 🎯 كيف يعمل النظام:

### 1. تسجيل الدخول:
- المستخدم يختار: **تسجيل الدخول بالبريد** أو **Google**
- OTP: نظام الكود القديم (عبر Base44)
- Google: يفتح نافذة Google OAuth ثم يعود للتطبيق

### 2. الجلسات:
- `getUnifiedSession()` تفحص OTP أولاً، ثم Google
- كلا النظامين يعملان جنباً إلى جنب
- `clearAllSessions()` تنظف كل شيء عند تسجيل الخروج

### 3. الأمان:
- Google OAuth يُدار بالكامل من Supabase
- لا Client Secret في الكود (آمن)
- Session tokens مشفرة

---

## 🧪 الاختبار:

### 1. تسجيل دخول OTP (القديم):
```
✅ أدخل بريد إلكتروني
✅ استلم الكود
✅ ادخل الكود وسجل الدخول
```

### 2. تسجيل دخول Google (الجديد):
```
✅ اضغط "تسجيل الدخول عبر Google"
✅ اختر حساب Google
✅ يتم تسجيل الدخول تلقائياً
```

### 3. التنقل:
```
✅ صفحة طلباتي تعمل مع كلا النظامين
✅ صفحة الملف الشخصي تعمل
✅ تسجيل الخروج ينظف كل شيء
```

---

## 🚀 البناء والنشر:

```bash
# 1. تأكد من إعداد Supabase (الخطوة 1 أعلاه)
# 2. قم ببناء التطبيق
npm run build

# 3. مزامنة مع Android
npx cap sync android

# 4. افتح Android Studio
npx cap open android
```

---

## ⚠️ ملاحظات مهمة:

1. **OAuth Consent Screen:**
   - Google تحد الدخول لـ 100 مستخدم فقط حتى يتم التحقق
   - لإزالة الحد، اذهب إلى Google Console > OAuth Consent Screen > Submit for Verification
   - قد تستغرق العملية 3-7 أيام

2. **للإنتاج:**
   - غيّر `redirectTo` في `googleAuth.js` لرابط الإنتاج
   - أضف domain الإنتاج في Google Console

3. **Android:**
   - ستحتاج Android OAuth Client ID منفصل
   - يجب إضافة SHA-1 fingerprint من keystore

---

## 📞 إذا واجهتك مشاكل:

### مشكلة: "redirect_uri_mismatch"
**الحل:** تأكد من الرابط في Google Console يطابق تماماً:
```
https://ofdqkracfqakbtjjmksa.supabase.co/auth/v1/callback
```

### مشكلة: "Access blocked: This app's request is invalid"
**الحل:** تأكد من إضافة JavaScript origins في Google Console

### مشكلة: "Invalid client"
**الحل:** تأكد من نسخ Client ID و Secret بشكل صحيح في Supabase

---

## ✅ Checklist:

- [ ] أضفت Client ID & Secret في Supabase
- [ ] أضفت redirect URIs في Google Console
- [ ] اختبرت تسجيل الدخول بـ OTP (يعمل)
- [ ] اختبرت تسجيل الدخول بـ Google (يعمل)
- [ ] اختبرت تسجيل الخروج (ينظف الجلسة)
- [ ] بنيت التطبيق بنجاح
- [ ] زامنت مع Android

**بعد إكمال جميع الخطوات، التطبيق جاهز! 🎉**
