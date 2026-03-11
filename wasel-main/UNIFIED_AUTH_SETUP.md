# 🎯 نظام المصادقة الموحد - العملاء والموظفين

## 📋 الملفات التي تم إنشاؤها

### 1. `supabase/CREATE_ADMIN_USERS.sql` 
**مهمة:** إنشاء حسابات الموظفين في Supabase

**محتوى:**
- إنشاء جدول `admin_users` (إن لم يكن موجود)
- منح صلاحيات RLS (Row Level Security)
- إنشاء حسابات توضيحية للموصل والمشرف والمدير
- شرح مفصل كيفية إضافة موظفين

**كيف تستخدمه:**
1. افتح Supabase Console
2. اذهب إلى SQL Editor
3. انسخ محتوى `CREATE_ADMIN_USERS.sql` كاملاً
4. الصق في المحرر وشغّل
5. عدّل الإيميلات والأسماء حسب احتياجك

---

### 2. `src/utils/unifiedAuth.js` (جديد!)
**مهمة:** نظام المصادقة الموحد - العملاء والموظفين معاً

**الدوال الرئيسية:**
```javascript
// تسجيل دخول موحد - يعمل للعملاء والموظفين
unifiedLogin(email, password)
→ {success, user, type: 'employee'|'customer', role}

// تسجيل خروج موحد
unifiedLogout()

// جلب المستخدم الحالي
getCurrentUnifiedUser()

// نوع المستخدم
getCurrentUserType() // 'employee' | 'customer' | 'none'

// التحقق من نوع المستخدم
isEmployee() // true/false
isCustomer() // true/false

// الدور (للموظفين فقط)
getEmployeeRole() // 'admin' | 'supervisor' | 'delivery_person'
hasEmployeeRole('admin') // true/false
```

---

## 🔄 آلية العمل

### عندما يدخل شخص البريد والكلمة:

```
┌─────────────────────────────────────┐
│ المستخدم يدخل البريد وكلمة المرور  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ unifiedLogin() يفحص:               │
│                                     │
│ هل هو موظف؟                        │
│ (يبحث في Supabase Auth +          │
│  جدول admin_users)                │
└────────────┬────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
   نعم ✅         لا ❌
      │             │
      ▼             ▼
   موظف!      هل هو عميل؟
   (معرّف       (يبحث في
   الدور)       LocalStorage)
      │             │
      │          ┌──┴──┐
      │          │     │
      │       نعم  لا
      │          │     │
      │       عميل! خطأ❌
      │          │
      │          │
      └──────┬───┴────┐
             │        │
        موظف  أم   عميل
             │
      يُعاد توجيهه
      للصفحة المناسبة
```

---

## 🛠️ التعديلات المطلوبة على الصفحات

### 1. تعديل `EmailOtpLogin.jsx` (الصفحة الرئيسية)

**الخطوة 1: استيراد الدالة الجديدة**

في الأعلى، أضف:
```javascript
import { unifiedLogin } from '@/utils/unifiedAuth';
```

**الخطوة 2: استبدال دالة `handleLogin`**

بدلاً من:
```javascript
const response = await login(email.trim(), password);
```

اكتب:
```javascript
const response = await unifiedLogin(email.trim(), password);
```

**الخطوة 3: التعامل مع النتيجة**

بعد `unifiedLogin`:
```javascript
if (response.success) {
  setOtpSession({
    token: response.sessionToken || 'employee-' + response.user.id,
    email: email.trim(),
    exp: response.sessionExpiresAt || new Date(Date.now() + 24*60*60*1000),
    type: response.type, // 'employee' أو 'customer'
    role: response.role  // إذا كان موظف
  });

  // التوجيه تلقائياً
  if (response.type === 'employee') {
    // موظف - اذهب لصفحته حسب الدور
    if (response.role === 'delivery_person') {
      navigate('/DriverPanel');
    } else if (response.role === 'supervisor') {
      navigate('/SupervisorPanel');
    } else if (response.role === 'admin') {
      navigate('/StaffDashboard');
    }
  } else if (response.type === 'customer') {
    // عميل - ابقَ في الصفحات العادية
    onSuccess?.();
  }
} else {
  throw new Error(response.error);
}
```

---

### 2. تعديل `App.jsx` (التوجيه التلقائي)

**في `AuthenticatedApp` يمكنك إضافة منطق الكشف:**

```javascript
// بعد التحقق من الجلسة:

const { data: { user: authUser } } = await supabase.auth.getUser();
if (authUser) {
  // تحقق هل هو موظف
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (adminUser) {
    // موظف - وجهه لصفحته
    setSession({ 
      type: 'employee', 
      email: adminUser.email,
      role: adminUser.role 
    });
  } else {
    // عميل عادي
    setSession({ type: 'customer', email: authUser.email });
  }
}
```

---

## 🎯 الخطوات العملية

### الخطوة 1️⃣: تشغيل SQL (مرة واحدة)

```sql
-- انسخ محتوى CREATE_ADMIN_USERS.sql كلياً
-- الصقه في Supabase SQL Editor
-- شغّل
```

**النتيجة:**
- جدول `admin_users` جاهز
- حسابات توضيحية:
  - `driver1@example.com` / `Driver@1234` (موصل)
  - `supervisor1@example.com` / `Supervisor@1234` (مشرف)
  - `admin1@example.com` / `Admin@1234` (مدير)

---

### الخطوة 2️⃣: إضافة `unifiedAuth.js` للمشروع

الملف موجود بالفعل في: `src/utils/unifiedAuth.js`

---

### الخطوة 3️⃣: تعديل `EmailOtpLogin.jsx`

```javascript
// أضف الاستيراد
import { unifiedLogin } from '@/utils/unifiedAuth';

// استبدل handleLogin الموجود بـ:
const handleLogin = async (e) => {
  e?.preventDefault?.();
  setError("");
  setLoading(true);
  try {
    if (!email || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      setLoading(false);
      return;
    }
    
    // استخدم unifiedLogin بدلاً من login
    const response = await unifiedLogin(email.trim(), password);
    
    if (response.success) {
      setOtpSession({
        token: response.sessionToken || 'employee-' + response.user.id,
        email: email.trim(),
        type: response.type,
        role: response.role
      });
      
      // توجه موظف لصفحته
      if (response.type === 'employee') {
        if (response.role === 'delivery_person') {
          navigate('/DriverPanel');
        } else if (response.role === 'supervisor') {
          navigate('/SupervisorPanel');
        } else if (response.role === 'admin') {
          navigate('/StaffDashboard');
        }
      } else {
        // عميل - استمر الطريق العادي
        onSuccess?.();
      }
    } else {
      throw new Error(response.error);
    }
  } catch (err) {
    setError(err?.message || "البريد الإلكتروني أو كلمة المرور غير صحيح");
  } finally {
    setLoading(false);
  }
};
```

---

### الخطوة 4️⃣: الاختبار

**اختبر كموصل:**
```
البريد: driver1@example.com
الكلمة: Driver@1234

النتيجة المتوقعة:
✅ توجيه لـ /DriverPanel
```

**اختبر كمشرف:**
```
البريد: supervisor1@example.com
الكلمة: Supervisor@1234

النتيجة المتوقعة:
✅ توجيه لـ /SupervisorPanel
```

**اختبر كعميل:**
```
البريد: customer@example.com
الكلمة: Customer@1234

النتيجة المتوقعة:
✅ البقاء في صفحات المتجر العادية
```

---

## 🔒 الأمان

### ما الذي تم حماية؟

✅ **كلمات المرور:**
- تُحفظ محفوظة في Supabase (لا تُخزّن محلياً)

✅ **RLS Policies:**
- الموظفون لا يرون بيانات بعضهم (إلا المشرفين)
- العملاء معزولون تماماً

✅ **Triggers تلقائية:**
- عند إنشاء مستخدم في Auth، يُضاف لـ admin_users تلقائياً

✅ **Session Timeout:**
- الجلسات تنتهي بعد 24 ساعة

---

## 📊 الملخص النهائي

```
صفحة الدخول الموحدة:
│
├─→ EmailOtpLogin.jsx (تحتاج تعديل صغير)
│   └─→ unifiedLogin() ← الدالة الجديدة
│
├─→ إذا موظف: موجه لصفحته
│   ├─→ delivery_person → /DriverPanel
│   ├─→ supervisor → /SupervisorPanel
│   └─→ admin → /StaffDashboard
│
└─→ إذا عميل: يبقى في المتجر العادي
```

---

## ❓ أسئلة شائعة

**س: بدي إضيف موظف جديد؟**
ج: شغّل نفس SQL من `CREATE_ADMIN_USERS.sql` بـ إيميل جديد.

**س: حسابي معطل، كيف أفعّله؟**
ج: قم بـ:
```sql
update public.admin_users 
set is_active = true 
where email = 'mail@example.com';
```

**س: العميل ينسى كلمة المرور؟**
ج: استخدم نفس نظام إعادة التعيين الموجود في `auth.js` بدون تغيير.

**س: هل يتأثر الموظفون بإضافة عملاء جدد؟**
ج: لا! جدول `admin_users` منفصل تماماً.

---

## 🚀 الخطوات التالية

1. ✅ انسخ `CREATE_ADMIN_USERS.sql` وشغّله
2. ✅ أضف `unifiedAuth.js` (موجود)
3. ✅ عدّل `EmailOtpLogin.jsx` (تعديل صغير)
4. ✅ اختبر بـ الإيميلات والكلمات أعلاه
5. ✅ أضف موظفين حقيقيين

جاهز! 🎉
