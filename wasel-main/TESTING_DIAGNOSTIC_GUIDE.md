# 🔧 دليل التشخيص والاختبار

## ✅ قائمة التحقق من التثبيت

### 1️⃣ التحقق من SQL (في Supabase)

```bash
# في Supabase SQL Editor:

# تحقق من الجداول
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

# يجب أن تراها:
✅ admin_users
✅ orders
✅ order_assignments

# تحقق من الدوال
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';

# يجب أن تراها:
✅ handle_new_user
✅ update_order_status_on_assignment
✅ calculate_distance
```

---

### 2️⃣ التحقق من الاتصال (في المتصفح)

افتح Console (F12 أو Cmd+Option+J) وشغل:

```javascript
// 1. تحقق من Supabase
console.log('Supabase:', window.supabase ? '✅' : '❌');

// 2. تحقق من المستخدم المسجل
const user = JSON.parse(localStorage.getItem('admin_user'));
console.log('User logged in:', user ? '✅' : '❌');
console.log('User role:', user?.role || '❌ no role');

// 3. تحقق من Supabase Auth
const { data: { user: authUser } } = await window.supabaseClient
  .auth.getUser();
console.log('Auth user:', authUser ? '✅' : '❌');
console.log('Auth email:', authUser?.email || '❌');

// 4. تحقق من قاعدة البيانات
const { data, error } = await window.supabaseClient
  .from('admin_users')
  .select('*')
  .limit(1);
console.log('Database connected:', error ? '❌' + error.message : '✅');
```

---

### 3️⃣ الأخطاء الشائعة والحل

```
┌─────────────────────────────────────┬──────────────────────────┐
│ الخطأ                               │ الحل                      │
├─────────────────────────────────────┼──────────────────────────┤
│ "No user found"                     │ تحقق من البريد وكلمة      │
│                                     │ المرور في Supabase       │
│                                     │ قد تحتاج تشغيل            │
│                                     │ COMPLETE_SETUP.sql       │
├─────────────────────────────────────┼──────────────────────────┤
│ "Permission denied for role..."     │ تحقق من RLS policies     │
│                                     │ في جدول admin_users      │
├─────────────────────────────────────┼──────────────────────────┤
│ "localStorage is not defined"       │ تأكد أنك في المتصفح      │
│                                     │ وليس في Node.js          │
├─────────────────────────────────────┼──────────────────────────┤
│ الدخول لكن الصفحة بيضاء             │ افتح Developer Tools      │
│                                     │ تحقق من الأخطاء في       │
│                                     │ Console و Network        │
├─────────────────────────────────────┼──────────────────────────┤
│ دول مفقود (جدول غير موجود)         │ شغل COMPLETE_SETUP.sql   │
│                                     │ في Supabase SQL Editor   │
└─────────────────────────────────────┴──────────────────────────┘
```

---

## 🧪 سيناريوهات الاختبار

### سيناريو 1: موصل جديد

```
المسار:
1. اذهب إلى /stafflogin
2. اختر "موصل (Driver)"
3. اكتب:
   - البريد: driver@test.com
   - كلمة المرور: Test@1234
4. انقر "الدخول"

النتيجة المتوقعة:
✅ توجيه إلى /DriverPanel
✅ عرض الطلبات المعينة فقط
✅ زر "تم التسليم" يعمل

الفحوصات:
□ localStorage يحتوي على admin_user
□ user.role = "delivery_person"
□ الطلبات ظاهرة في الصفحة
□ عند الضغط للتسليم، تتحدث الحالة
```

---

### سيناريو 2: مشرف جديد

```
المسار:
1. اذهب إلى /stafflogin
2. اختر "مشرف (Supervisor)"
3. اكتب:
   - البريد: supervisor@test.com
   - كلمة المرور: Test@1234
4. انقر "الدخول"

النتيجة المتوقعة:
✅ توجيه إلى /SupervisorPanel
✅ عرض جميع الطلبات (ليس مصفى)
✅ خيار تعيين طلب لموصل
✅ خيار تحديث حالة الطلب

الفحوصات:
□ localStorage يحتوي على admin_user
□ user.role = "supervisor"
□ طلبات متعددة ظاهرة (أكثر من الموصل)
□ زر "تعيين لموصل" يعمل
□ حقل تحديث الحالة يعمل
```

---

### سيناريو 3: مدير (Admin)

```
المسار:
1. اذهب إلى /stafflogin
2. اختر "مدير (Admin)"
3. اكتب:
   - البريد: admin@test.com
   - كلمة المرور: Test@1234
4. انقر "الدخول"

النتيجة المتوقعة:
✅ توجيه إلى /StaffDashboard
✅ لوحة تحكم كاملة
✅ إدارة جميع الموظفين
✅ إدارة جميع الطلبات
✅ إدارة جميع التعيينات

الفحوصات:
□ localStorage يحتوي على admin_user
□ user.role = "admin"
□ جميع الميزات متاحة
□ لا توجود رسائل خطأ
□ الملاح يعرض جميع الخيارات
```

---

### سيناريو 4: حظر غير المصرح

```
المسار:
1. حاول الوصول مباشرة إلى /DriverPanel بدون دخول
2. أو ادخل كموصل ثم حاول الوصول إلى /StaffDashboard

النتيجة المتوقعة:
✅ توجيه تلقائي إلى /stafflogin
✅ ظهور رسالة "أنت غير مصرح"
✅ لا يمكن الوصول للصفحات المقيدة

الفحوصات:
□ لا يمكن الوصول للصفحة
□ يتم التوجيه تلقائياً
□ localStorage فارغ
```

---

## 📊 جدول البيانات التجريبية

### جدول admin_users

```sql
-- لقد تم إدراجها في COMPLETE_SETUP.sql
-- لكن إذا احتجت إضافتها يدوياً:

INSERT INTO admin_users (id, email, name, role, is_active, created_at, updated_at)
VALUES 
  (
    'driver-uuid-123',
    'driver@test.com',
    'أحمد الموصل',
    'delivery_person',
    true,
    now(),
    now()
  ),
  (
    'supervisor-uuid-456',
    'supervisor@test.com',
    'علي المشرف',
    'supervisor',
    true,
    now(),
    now()
  ),
  (
    'admin-uuid-789',
    'admin@test.com',
    'محمد المدير',
    'admin',
    true,
    now(),
    now()
  );
```

---

### جدول orders

```sql
-- إدراج طلبات تجريبية

INSERT INTO orders 
(user_email, order_status, recipient_details, payment_method, payment_status, 
 delivery_fee, total_amount, notes, created_at, updated_at)
VALUES 
  (
    'customer1@example.com',
    'pending',
    '{"name": "خالد", "phone": "0501234567", "address": "الرياض، شارع النخيل"}'::jsonb,
    'card',
    'pending',
    50,
    250,
    'توصيل سريع',
    now(),
    now()
  ),
  (
    'customer2@example.com',
    'assigned',
    '{"name": "فاطمة", "phone": "0567654321", "address": "جدة، حي الروضة"}'::jsonb,
    'cash',
    'pending',
    30,
    180,
    'بدون نعناع',
    now() - interval '2 hours',
    now() - interval '1 hour'
  ),
  (
    'customer3@example.com',
    'in_progress',
    '{"name": "سارة", "phone": "0599999999", "address": "الدمام، حي الخليج"}'::jsonb,
    'card',
    'completed',
    45,
    300,
    'توصيل آمن',
    now() - interval '4 hours',
    now() - interval '30 minutes'
  );
```

---

### جدول order_assignments

```sql
-- تعيين الطلبات للموصلين

INSERT INTO order_assignments 
(order_id, delivery_person_id, assigned_by, assignment_status, created_at, updated_at)
VALUES 
  (
    1,  -- order_id (الطلب الأول)
    'driver-uuid-123',  -- أحمد الموصل
    'admin-uuid-789',  -- عين من قبل المدير
    'assigned',
    now(),
    now()
  ),
  (
    2,
    'driver-uuid-123',
    'supervisor-uuid-456',  -- عين من قبل المشرف
    'in_progress',
    now() - interval '2 hours',
    now() - interval '30 minutes'
  ),
  (
    3,
    'driver-uuid-123',
    'supervisor-uuid-456',
    'delivered',
    now() - interval '4 hours',
    now() - interval '30 minutes'
  );
```

---

## 🔍 استعلامات الاختبار

### اختبر كل دور

```javascript
// 1. اختبر دخول الموصل
const { data: driver } = await window.supabaseClient
  .from('admin_users')
  .select('*')
  .eq('role', 'delivery_person')
  .single();
console.log('Driver:', driver);

// 2. اختبر دخول المشرف
const { data: supervisor } = await window.supabaseClient
  .from('admin_users')
  .select('*')
  .eq('role', 'supervisor')
  .single();
console.log('Supervisor:', supervisor);

// 3. اختبر دخول المدير
const { data: admin } = await window.supabaseClient
  .from('admin_users')
  .select('*')
  .eq('role', 'admin')
  .single();
console.log('Admin:', admin);
```

---

### اختبر الطلبات المعينة للموصل

```javascript
// جلب الطلبات المعينة للموصل
const { data: assignments } = await window.supabaseClient
  .from('order_assignments')
  .select(`
    *,
    orders(*)
  `)
  .eq('delivery_person_id', 'driver-uuid-123');
  
console.log('Assignments:', assignments);
```

---

### اختبر التحديث عند التسليم

```javascript
// محاكاة تسليم من الموصل
const { data: updated } = await window.supabaseClient
  .from('order_assignments')
  .update({ assignment_status: 'delivered', updated_at: new Date() })
  .eq('order_id', 1)
  .select();

console.log('Updated:', updated);

// تحقق أن الطلب انحدث تلقائياً
const { data: order } = await window.supabaseClient
  .from('orders')
  .select('order_status')
  .eq('id', 1)
  .single();

console.log('Order status:', order?.order_status); // يجب أن يُظهر "delivered"
```

---

## 🚨 فحوصات أمان

### تحقق من RLS

```javascript
// 1. حاول الدخول كموصل واقرأ جميع المستخدمين
const { data: allUsers, error } = await window.supabaseClient
  .from('admin_users')
  .select('*');

// يجب أن يعيد الخطأ (موصل لا يمكنه رؤية المستخدمين الآخرين):
if (error) {
  console.log('✅ RLS يعمل: موصل لا يرى المستخدمين');
} else {
  console.log('❌ RLS غير آمن: موصل يرى المستخدمين');
}

// 2. حاول الدخول كمشرف وعدّل طلب موصل آخر
const { data: updated, error: updateError } = await window.supabaseClient
  .from('order_assignments')
  .update({ assignment_status: 'cancelled' })
  .eq('delivery_person_id', 'other-driver-id')
  .select();

// يجب أن يعيد الخطأ (مشرف عادي لا يمكنه حذف):
if (updateError) {
  console.log('✅ RLS يعمل: مشرف عادي محدود');
} else {
  console.log('❌ RLS غير آمن: مشرف لديه صلاحيات عالية جداً');
}
```

---

## 📱 فحوصات الأداء

### قياس سرعة الاستعلام

```javascript
// 1. قياس جلب الطلبات
console.time('Fetch orders');
const { data: orders } = await window.supabaseClient
  .from('orders')
  .select('*')
  .limit(100);
console.timeEnd('Fetch orders');
// المتوقع: < 500ms

// 2. قياس جلب التعيينات
console.time('Fetch assignments');
const { data: assignments } = await window.supabaseClient
  .from('order_assignments')
  .select('*, orders(*)')
  .eq('delivery_person_id', 'driver-uuid-123');
console.timeEnd('Fetch assignments');
// المتوقع: < 300ms

// 3. قياس التحديث
console.time('Update order');
const { data: updated } = await window.supabaseClient
  .from('orders')
  .update({ order_status: 'delivered' })
  .eq('id', 1);
console.timeEnd('Update order');
// المتوقع: < 200ms
```

**إذا كانت الاستعلامات بطيئة:**
- تحقق من الفهارس (Indexes) في Supabase
- تأكد من عدم وجود RLS policies معقدة
- استخدم `.limit()` للحد من البيانات

---

## 🎯 خطوات التشخيص الرئيسية

```
مشكلة؟ اتبع هذه الخطوات:

1. افتح Supabase Console
   └─> Database > SQL Editor
   └─> تحقق من وجود الجداول الثلاث
   └─> تحقق من وجود البيانات

2. افتح المتصفح Console (F12)
   └─> شغل الاستعلام: console.log(localStorage.getItem('admin_user'))
   └─> يجب أن يُظهر بيانات المستخدم

3. تحقق من Network Tab
   └─> اذهب إلى صفحة الدخول
   └─> افتح Network
   └─> انقر "دخول"
   └─> لا يجب أن تكون هناك أخطاء 403 أو 401

4. تحقق من Supabase Logs
   └─> في Supabase Console
   └─> Database > Query Performance
   └─> ابحث عن أخطاء

5. إذا استمرت المشكلة:
   └─> أعد تشغيل COMPLETE_SETUP.sql
   └─> تأكد من عدم وجود أخطاء في التنفيذ
   └─> تحقق من أن RLS مفعل
```

---

## ✅ قائمة التحقق النهائية

```
قبل الإطلاق:

□ جميع الجداول موجودة
□ جميع الدوال مشغلة
□ يمكن للموصل الدخول والاطلاع على طلباته فقط
□ يمكن للمشرف الدخول والاطلاع على جميع الطلبات
□ يمكن للمدير الدخول والاطلاع على كل شيء
□ التحديث الدخول يعمل (الموصل يعين الحالة إلى "تم التسليم")
□ RLS آمن (الموصل لا يرى طلبات الآخرين)
□ الاستعلامات سريعة (< 500ms)
□ لا توجد أخطاء في Developer Tools
□ localStorage يحفظ البيانات صحيحة
□ الملاح يعرض الخيارات الصحيحة لكل دور
```
