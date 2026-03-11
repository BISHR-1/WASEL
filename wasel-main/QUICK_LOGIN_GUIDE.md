# 🎯 دليل سريع: كيفية الدخول للنظام

## ⚡ الخطوات السريعة

### **الخطوة 1: تشغيل Supabase SQL**

```
1. اذهب إلى: https://app.supabase.com
2. اختر مشروعك
3. اذهب إلى: SQL Editor → New Query
4. انسخ محتوى الملف: supabase/COMPLETE_SETUP.sql
5. اضغط: Run
```

### **الخطوة 2: تشغيل التطبيق**

```bash
cd c:\Users\HP ENVY 15\Downloads\wasel-main\wasel-main
npm run dev
```

### **الخطوة 3: الدخول إلى النظام**

```
الرابط: http://localhost:5173/stafflogin
```

---

## 📖 تدفق الدخول الكامل

### **للموصل (Driver) 🚗**

```
1. اذهب إلى: /stafflogin
2. اختر الدور: "موصل"
3. بيانات التجربة:
   📧 البريد: driver@test.com
   🔐 كلمة المرور: test123
4. اضغط: "تسجيل الدخول"
   ↓
5. يُنقل تلقائياً إلى: /DriverPanel
   ↓
6. يرى:
   ✅ الطلبات المعينة له فقط
   ✅ تفاصيل الطلب (الاسم، الهاتف، العنوان)
   ✅ وصف الشحنة
   ❌ السعر مخفي
   ❌ بيانات المتجر مخفية
   ↓
7. يضغط "تم التسليم" لتحديث الحالة
```

### **للمشرف (Supervisor) 👤**

```
1. اذهب إلى: /stafflogin
2. اختر الدور: "مشرف"
3. بيانات التجربة:
   📧 البريد: supervisor@test.com
   🔐 كلمة المرور: test123
4. اضغط: "تسجيل الدخول"
   ↓
5. يُنقل تلقائياً إلى: /SupervisorPanel
   ↓
6. يرى:
   ✅ جميع الطلبات
   ✅ خيارات البحث والفرز حسب الحالة
   ✅ تفاصيل الطلب الكاملة
   ✅ خريطة موقع الموصلين (في المستقبل)
   ↓
7. يمكنه تنظيم الطلبات وتعيينها
```

### **للمدير (Admin) 🛡️**

```
1. اذهب إلى: /stafflogin
2. اختر الدور: "مدير"
3. بيانات التجربة:
   📧 البريد: admin@test.com
   🔐 كلمة المرور: test123
4. اضغط: "تسجيل الدخول"
   ↓
5. يُنقل تلقائياً إلى: /StaffDashboard (مخفية من الملاح)
   ↓
6. يرى:
   ✅ جميع المشرفين والموصلين
   ✅ جميع الطلبات بجميع الحالات
   ✅ خيار تعيين الموصل
   ✅ خيار تغيير حالة الطلب إلى "مدفوع"
   ✅ إدارة كاملة من صفحة واحدة فقط
```

---

## 🔐 كيفية الوصول إلى البيانات (لكل دور)

### **1️⃣ DriverPanel - الموصل**

```javascript
// متصل بـ:
// - جدول: admin_users (للتحقق من الدور)
// - جدول: order_assignments (جلب الطلبات المعينة)
// - جدول: orders (تفاصيل الطلب)

// استدعاء الدالة:
const { data: assigned } = await supabase
  .from('order_assignments')
  .select('*, orders(*)')
  .eq('delivery_person_id', user.id);  // ← فقط طلباته

// النتيجة:
[
  {
    id: "assign-123",
    order_id: "order-456",
    delivery_person_id: "driver-789",
    status: "assigned",
    orders: {
      id: "order-456",
      recipient_details: { name: "علي", phone: "...", address: "..." },
      notes: "وصف الشحنة",
      total_amount: 150  // لا يراه الموصل في الواجهة
    }
  }
]
```

### **2️⃣ SupervisorPanel - المشرف**

```javascript
// متصل بـ:
// - جدول: admin_users (للتحقق من الدور)
// - جدول: orders (جلب جميع الطلبات)

// استدعاء الدالة:
const { data: orders } = await supabase
  .from('orders')
  .select('*')
  .order('created_at', { ascending: false });

// ثم البحث والفرز على الجانب الفرنتإند:
orders.filter(o => {
  if (filterStatus !== 'all') return o.status === filterStatus;
  if (search) return o.recipient_details.name.includes(search);
  return true;
});

// النتيجة:
[
  {
    id: "order-456",
    status: "paid",
    total_amount: 150,
    sender_details: { ... },
    recipient_details: { ... },
    created_at: "2026-02-27T10:00:00Z"
  }
]
```

### **3️⃣ StaffDashboard - المدير**

```javascript
// متصل بـ:
// - جدول: admin_users (جميع الموظفين)
// - جدول: orders (جميع الطلبات)
// - جدول: order_assignments (التعيينات)

// 1. جلب الموظفين:
const { data: users } = await supabase
  .from('admin_users')
  .select('*')
  .eq('is_active', true);

// 2. جلب الطلبات:
const { data: orders } = await supabase
  .from('orders')
  .select('*');

// 3. تعيين طلب لموصل:
await supabase
  .from('order_assignments')
  .insert({
    order_id: "order-456",
    delivery_person_id: "driver-789",
    assigned_by: "admin-id",
    status: "assigned"
  });

// 4. تحديث حالة الطلب:
await supabase
  .from('orders')
  .update({ status: 'in_progress' })
  .eq('id', "order-456");
```

---

## 🧪 اختبار سريع في المتصفح

```javascript
// افتح: F12 → Console

// 1. تحقق من بيانات تسجيل الدخول
JSON.parse(localStorage.getItem('admin_user_data'))
// سيظهر: {id: "...", name: "...", email: "...", role: "delivery_person"}

// 2. تحقق من نوع الدور
const user = JSON.parse(localStorage.getItem('admin_user_data'));
user.role
// سيظهر: "delivery_person" أو "supervisor" أو "admin"

// 3. تحقق من الجلسة
JSON.parse(localStorage.getItem('admin_session'))
// سيظهر: {userId: "...", email: "...", name: "...", role: "..."}

// 4. حاول الدخول لصفحة غير مسموحة
window.location.href = '/SupervisorPanel'  // إذا كنت موصل
// سيرد إليك برسالة: "هذه الصفحة متاحة فقط للمشرفين"
```

---

## 📊 خريطة الاتصالات

```
STAFF LOGIN (متصل بـ Supabase Auth + admin_users)
    │
    ├─ DRIVER ──→ DriverPanel ──→ order_assignments + orders
    │
    ├─ SUPERVISOR ──→ SupervisorPanel ──→ orders
    │
    └─ ADMIN ──→ StaffDashboard ──→ admin_users + orders + order_assignments
```

---

## ✅ قائمة التحقق

```
☐ شغلت COMPLETE_SETUP.sql في Supabase SQL Editor
☐ انتظرت حتى انتهى التنفيذ بدون أخطاء
☐ فتحت http://localhost:5173/stafflogin
☐ اختبرت دخول موصل
  ☐ وصل إلى /DriverPanel
  ☐ ظهرت الطلبات المعينة له
☐ اختبرت دخول مشرف
  ☐ وصل إلى /SupervisorPanel
  ☐ ظهرت جميع الطلبات
☐ اختبرت دخول مدير
  ☐ وصل إلى /StaffDashboard
  ☐ ظهرت جميع البيانات
☐ تحققت من localStorage في Console
☐ حاولت الوصول لصفحة غير مسموحة ← ظهرت رسالة خطأ
```

---

## 🆘 إذا واجهت مشكلة

### **المشكلة: "Invalid login credentials"**
```
الحل: أضفت بيانات تجريبية في COMPLETE_SETUP.sql؟
- عدّل بيانات المستخدم في الجدول
- أو استخدم Supabase Auth لإنشاء مستخدمين جدد
```

### **المشكلة: "Cannot read orders"**
```
الحل: 
1. تحقق من تفعيل الجداول في Supabase
2. فعّل RLS السياسات (في COMPLETE_SETUP.sql)
3. أضف مستخدمين وطلبات تجريبية
```

### **المشكلة: "لا ينقلني للصفحة الصحيحة"**
```
الحل:
1. تحقق من قيمة role في localStorage
2. تأكد من أن navigate() يعمل
3. افحص console لأخطاء React Router
```

---

## 📞 الدعم

إذا احتجت مساعدة:
1. افحص ملف: `SUPABASE_LOGIN_FLOW.md`
2. راجع: `COMPLETE_SETUP.sql`
3. تحقق من: `src/pages/StaffLogin.jsx`
4. ابحث في: `src/utils/adminAuth.js`
