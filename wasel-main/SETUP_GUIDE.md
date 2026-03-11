# 🚀 دليل تشغيل سكريبت إنشاء الموظفين

## خطوة بخطوة:

### الخطوة 1️⃣: احصل على المفاتيح من Supabase

**أ) Project URL:**
1. افتح https://app.supabase.com
2. اختر مشروعك
3. اذهب إلى: **Settings → API**
4. انسخ **Project URL** (مثال: `https://ofdqkracfqakbtjjmksa.supabase.co`)

**ب) Service Role Key:**
1. في نفس الصفحة (Settings → API)
2. ابحث عن **Service Role** (انتبه: ليس Anon Key!)
3. انسخ **Key** تحته

✅ الآن عندك:
```
Project URL: https://ofdqkracfqakbtjjmksa.supabase.co
Service Role Key: eyJhbGciOiJIUzI1NiIsInR... (طويل جداً)
```

---

### الخطوة 2️⃣: عدّل السكريبت

افتح ملف: `setup-admin-users.js`

ابحث عن هذه السطور (الأسطر 15-16):
```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY';
```

استبدل:
```javascript
const SUPABASE_URL = 'https://ofdqkracfqakbtjjmksa.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR...'; // المفتاح الطويل
```

✅ احفظ الملف (Ctrl+S)

---

### الخطوة 3️⃣: شغّل السكريبت

فتح Terminal في المشروع:
```bash
# تأكد أنك في المجلد الصحيح
cd c:\Users\HP ENVY 15\Downloads\wasel-main\wasel-main

# شغّل السكريبت
node setup-admin-users.js
```

**النتيجة المتوقعة:**
```
🚀 جاري إنشاء حسابات الموظفين...

📝 جاري معالجة: driver1@example.com
   → إنشاء حساب Auth...
   ✅ تم إنشاء Auth user (ID: a1b2c3d4...)
   → إدراج في جدول admin_users...
   ✅ تم الإدراج بنجاح

[نفس الشيء للمشرف والمدير...]

✅ تم إنشاء جميع الموظفين بنجاح!

📋 بيانات الدخول:
┌─────────────────────────────────────────────┐
│ البريد: driver1@example.com                 │
│ الكلمة: Driver@1234                         │
│ الدور: delivery_person                      │
├─────────────────────────────────────────────┤
│ البريد: supervisor1@example.com             │
│ الكلمة: Supervisor@1234                     │
│ الدور: supervisor                           │
├─────────────────────────────────────────────┤
│ البريد: admin1@example.com                  │
│ الكلمة: Admin@1234                          │
│ الدور: admin                                │
└─────────────────────────────────────────────┘

🎉 الآن يمكنك الدخول إلى التطبيق باستخدام هذه البيانات!
```

---

## ✅ الآن اختبر!

في التطبيق:
1. اضغط "تسجيل دخول"
2. ادخل: `driver1@example.com`
3. ادخل: `Driver@1234`
4. اضغط "دخول"

✅ يجب أن تُنقل إلى `/DriverPanel` تلقائياً!

---

## ⚠️ الأخطاء الشائعة

### ❌ "cannot find module @supabase/supabase-js"

**الحل:**
```bash
npm install @supabase/supabase-js node-fetch
```

---

### ❌ "Module not found: 'node-fetch'"

**الحل:**
```bash
npm install node-fetch
```

---

### ❌ "Invalid project reference"

**السبب:** SUPABASE_URL غير صحيح
**الحل:** 
- اذهب Supabase → Settings → API
- انسخ Project URL بدقة (يجب يكون فيه `.supabase.co`)

---

### ❌ "Invalid API key"

**السبب:** SERVICE_ROLE_KEY غير صحيح
**الحل:**
- تأكد أنك نسخت **Service Role** وليس **Anon Key**
- تأكد أنك ما قطعت من أول أو آخر الـ key

---

## 🎯 بعد التشغيل بنجاح

```
✅ جميع الموظفين تم إنشاؤهم
✅ البيانات تم إدراجها في admin_users
✅ الدخول جاهز
✅ التوجيه التلقائي يعمل
```

**الآن:**
1. اختبر الدخول
2. أضف موظفين إضافيين (بنفس الطريقة)
3. ابدأ الاستخدام!

---

## 📝 ملاحظات مهمة

⚠️ **لا تشارك Service Role Key مع أحد!**
- هذا المفتاح له صلاحيات كاملة
- احفظه سري!

⚠️ **إذا أضفت موظفين جدد:**
1. عدّل قائمة `staff` في السكريبت
2. أضف بريد وكلمة مرور جديدة
3. شغّل السكريبت مرة أخرى

---

**تم! 🎉**

شغّل السكريبت وابدأ الاختبار!
