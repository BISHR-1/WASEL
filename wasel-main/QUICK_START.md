# 🚀 دليل البدء السريع - تطبيق وصل (Wasel)

## ⚡ البدء السريع

### 1. تثبيت المتطلبات
```bash
cd wasel-main
npm install
```

### 2. إعداد Supabase

#### أ) إنشاء مشروع Supabase
1. اذهب إلى https://supabase.com
2. أنشئ مشروع جديد
3. احصل على:
   - Project URL
   - Anon Public Key

#### ب) تنفيذ سكريبت قاعدة البيانات
1. افتح **Supabase Dashboard** → **SQL Editor**
2. نفذ الملفات بالترتيب:
   ```sql
   -- 1. إذا كان لديك جداول قديمة
   \i RESET_DATABASE.sql
   
   -- 2. إنشاء قاعدة البيانات الجديدة
   \i SUPABASE_MIGRATION.sql
   
   -- 3. (اختياري) بيانات تجريبية
   \i SAMPLE_DATA.sql
   ```

#### ج) إعداد Storage
1. **Supabase Dashboard** → **Storage**
2. أنشئ Buckets:
   - `restaurants` (public)
   - `products` (public)
   - `gifts` (public)
   - `packages` (public)
   - `avatars` (public)

### 3. إعداد متغيرات البيئة

أنشئ ملف `.env` في المجلد الرئيسي:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. تشغيل التطبيق

#### Development Mode
```bash
npm run dev
```

#### Build & Android
```bash
npm run build
npx cap sync android
npx cap open android
```

---

## 📱 الوظائف الرئيسية

### 🔐 المصادقة
- تسجيل دخول Google
- تسجيل دخول OTP
- إدارة الجلسات

### 🛍️ التسوق
- تصفح المطاعم والمنتجات
- إضافة للسلة
- إنشاء طلبات
- تتبع الطلبات

### 💳 الدفع
- PayPal
- Card Payment
- واتساب (تواصل مباشر)

### 👑 Admin Panel
- إدارة المطاعم
- إدارة المنتجات
- إدارة الطلبات
- التقارير

---

## 🔧 استكشاف الأخطاء

### خطأ: "Cannot connect to Supabase"
✅ **الحل:**
- تأكد من صحة `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY`
- تأكد من تنفيذ `SUPABASE_MIGRATION.sql`

### خطأ: "column X does not exist"
✅ **الحل:**
```sql
-- نفذ هذا في Supabase SQL Editor
\i RESET_DATABASE.sql
\i SUPABASE_MIGRATION.sql
```

### خطأ: "RLS policy violation"
✅ **الحل:**
- تأكد من تسجيل الدخول
- تحقق من صلاحيات المستخدم

### خطأ البناء: "Module not found @base44"
✅ **الحل:**
```bash
npm install
npm run build
```

---

## 📂 هيكل المشروع

```
wasel-main/
├── src/
│   ├── api/
│   │   ├── waselClient.js      # Supabase API Client
│   │   ├── otpClient.js        # OTP Authentication
│   │   └── paypalClient.js     # PayPal Integration
│   ├── lib/
│   │   ├── supabase.js         # Supabase Config
│   │   ├── AuthContext.jsx     # Auth State Management
│   │   └── countries.js        # Country Codes
│   ├── pages/
│   │   ├── Home.jsx            # الصفحة الرئيسية
│   │   ├── Restaurants.jsx     # المطاعم
│   │   ├── Cart.jsx            # السلة
│   │   ├── AdminPanel.jsx      # لوحة التحكم
│   │   └── ...
│   └── components/
│       ├── auth/               # مكونات المصادقة
│       ├── cart/               # مكونات السلة
│       └── ui/                 # مكونات UI
├── SUPABASE_MIGRATION.sql      # سكريبت قاعدة البيانات
├── SAMPLE_DATA.sql             # بيانات تجريبية
└── package.json
```

---

## 👥 إعداد نظام المصادقة الموحد (Unified Auth) - ✨ جديد!

### للموظفين والعملاء من صفحة دخول واحدة

**الملفات الجديدة:**
```
✅ supabase/CREATE_ADMIN_USERS.sql → SQL لإنشاء الموظفين
✅ src/utils/unifiedAuth.js → نظام المصادقة الموحد
✅ EmailOtpLogin.jsx → معدّل للتوجيه التلقائي
```

**الخطوة الوحيدة:**

1. افتح Supabase → SQL Editor
2. انسخ: `supabase/CREATE_ADMIN_USERS.sql`
3. شغّل ▶️

✅ **النتيجة:**
- ✓ جدول `admin_users` جاهز
- ✓ 3 حسابات تجريبية (موصل، مشرف، مدير)
- ✓ RLS والأمان مفعل

**اختبر:**
```
البريد: driver1@example.com
الكلمة: Driver@1234
↓
ستُنقل تلقائياً → /DriverPanel ✅
```

**المميزات:**
- ✅ صفحة دخول موحدة (عملاء + موظفين)
- ✅ فصل تلقائي حسب الدور
- ✅ توجيه ذكي لكل صفحة
- ✅ RLS آمن
- ✅ بدون تأثر العملاء

**اقرأ المزيد:** `UNIFIED_AUTH_SETUP.md`

---

## 🎯 الخطوات التالية

### 1. إضافة موظفين
```sql
-- من CREATE_ADMIN_USERS.sql، غيّر الإيميل والاسم والدور
select auth.admin.create_user(...);
insert into admin_users (...);
```

### 2. تخصيص التطبيق
- عدل الألوان في `tailwind.config.js`
- غير الشعار والصور
- أضف لغات إضافية

### 3. إعداد الإشعارات
- فعّل Push Notifications في Capacitor
- أضف Firebase Cloud Messaging

### 4. النشر
- Build للإنتاج: `npm run build`
- رفع على Google Play Store
- رفع على App Store

---

## 📞 الدعم

هل تحتاج مساعدة؟
- 📧 Email: support@wasel.app
- 💬 WhatsApp: +971 XX XXX XXXX

---

**تم إنشاؤه بواسطة:** GitHub Copilot  
**التاريخ:** 23 يناير 2026  
**الإصدار:** 1.0.0
