# 🔗 دليل الدخول الكامل والاتصال بـ Supabase

## 📊 تدفق العمل الكامل

```
┌─────────────────────────────────────────────────────────────┐
│                    STAFF LOGIN PAGE                          │
│              (صفحة تسجيل الدخول للموظفين)                    │
└────────────────┬────────────────────────────────────────────┘
                 │
         ┌───────┴────────┬──────────────┐
         │                │              │
         ▼                ▼              ▼
    اختر "موصل"    اختر "مشرف"   اختر "مدير"
       (driver)   (supervisor)    (admin)
         │                │              │
         ▼                ▼              ▼
   DriverPanel   SupervisorPanel   StaffDashboard
   (لوحة الموصل)  (لوحة المشرف)    (لوحة المدير)
         │                │              │
         └────────────────┴──────────────┘
                 │
              SUPABASE
    (جداول: admin_users, orders, order_assignments)
```

---

## 🔐 آلية الدخول خطوة بخطوة

### **المرحلة 1️⃣: تسجيل الدخول (StaffLogin)**

```javascript
// 📍 الملف: src/pages/StaffLogin.jsx
// الرابط: /stafflogin

// الخطوات:
1. المستخدم يختار دوره (موصل / مورد / مشرف / مدير)
2. يدخل بريده وكلمة مروره
3. يضغط "تسجيل دخول"

// الكود:
const result = await loginAdminUser(loginData.email, loginData.password);
// ← هذه الدالة من src/utils/adminAuth.js
```

### **المرحلة 2️⃣: التحقق في adminAuth.js**

```javascript
// 📍 الملف: src/utils/adminAuth.js

export async function loginAdminUser(email, password) {
  // الخطوة 1: تحقق من بيانات Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  // الخطوة 2: جلب بيانات المستخدم من جدول admin_users
  const { data: userData, error: userError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  // الخطوة 3: حفظ البيانات في localStorage
  localStorage.setItem('admin_session', JSON.stringify({
    userId: data.user.id,
    email: data.user.email,
    name: userData.name,
    role: userData.role,  // 👈 الدور المهم!
    createdAt: Date.now()
  }));

  return { success: true, user: userData };
}
```

### **المرحلة 3️⃣: التوجيه بناءً على الدور**

```javascript
// 📍 الملف: src/pages/StaffLogin.jsx

const handleLoginSubmit = async (e) => {
  const result = await loginAdminUser(loginData.email, loginData.password);
  const userRole = result.user.role;

  // 👇 التوجيه الذكي حسب الدور:
  if (userRole === ADMIN_ROLES.DELIVERY_PERSON) {
    navigate('/DriverPanel');      // موصل
  } else if (userRole === ADMIN_ROLES.SUPERVISOR) {
    navigate('/SupervisorPanel');  // مشرف
  } else if (userRole === ADMIN_ROLES.ADMIN) {
    navigate('/StaffDashboard');   // مدير
  }
};
```

---

## 📱 الصفحات الثلاث والاتصال بـ Supabase

### **1️⃣ DriverPanel - لوحة الموصل**

```javascript
// 📍 الملف: src/pages/DriverPanel.jsx
// الدور المسموح: delivery_person

// 1. التحقق من الدخول:
const user = getCurrentAdminUser();
if (user.role !== ADMIN_ROLES.DELIVERY_PERSON) {
  navigate('/StaffLogin');
}

// 2. جلب الطلبات المكلفة:
const { data: assigned } = await supabase
  .from('order_assignments')
  .select('*, orders(*)')
  .eq('delivery_person_id', user.id);
  // ← يجلب فقط الطلبات المعينة لهذا الموصل

// 3. تحديث الحالة عند التسليم:
await supabase
  .from('order_assignments')
  .update({ status: 'delivered' })
  .eq('id', order.assignment_id);

// الجداول المستخدمة:
// ✅ admin_users (للتحقق من الدور)
// ✅ order_assignments (جلب الطلبات)
// ✅ orders (تفاصيل الطلب)
```

### **2️⃣ SupervisorPanel - لوحة المشرف**

```javascript
// 📍 الملف: src/pages/SupervisorPanel.jsx
// الدور المسموح: supervisor

// 1. التحقق من الدخول:
const user = getCurrentAdminUser();
if (user.role !== ADMIN_ROLES.SUPERVISOR) {
  navigate('/StaffLogin');
}

// 2. جلب جميع الطلبات:
const { data: orders } = await supabase
  .from('orders')
  .select('*')
  .order('created_at', { ascending: false });
  // ← يجلب جميع الطلبات (بدون تصفية)

// 3. البحث والفرز:
const filtered = orders.filter(o => {
  if (filterStatus !== 'all') return o.status === filterStatus;
  if (search) return o.recipient_details.name.includes(search);
  return true;
});

// الجداول المستخدمة:
// ✅ admin_users (للتحقق من الدور)
// ✅ orders (جميع الطلبات)
// ✅ order_assignments (تفاصيل التعيين - إذا أضفنا)
```

### **3️⃣ StaffDashboard - لوحة المدير (مخفية)**

```javascript
// 📍 الملف: src/pages/AdminDashboard.jsx
// الدور المسموح: admin (معاد تسميتها في pages.config.js)

// 1. التحقق من الدخول (أقسى):
const user = getCurrentAdminUser();
if (user.role !== ADMIN_ROLES.ADMIN) {
  navigate('/StaffLogin');
}

// 2. جلب المشرفين والموصلين:
const { data: users } = await supabase
  .from('admin_users')
  .select('*')
  .eq('is_active', true);

// 3. جلب جميع الطلبات:
const { data: orders } = await supabase
  .from('orders')
  .select('*');

// 4. تعيين طلب لموصل:
await supabase
  .from('order_assignments')
  .insert({
    order_id: order.id,
    delivery_person_id: selectedDelivery.id,
    assigned_by: user.id,
    status: 'assigned'
  });

// الجداول المستخدمة:
// ✅ admin_users (قائمة الموظفين)
// ✅ orders (جميع الطلبات)
// ✅ order_assignments (إنشاء التعيينات)
```

---

## 🗄️ جداول Supabase المطلوبة

الجداول التي **يجب إنشاؤها** في Supabase:

```sql
-- 1️⃣ جدول المستخدمين الموظفين
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL,
    CHECK (role IN ('admin', 'supervisor', 'delivery_person', 'supplier')),
  is_active BOOLEAN DEFAULT true,
  phone VARCHAR(20),
  location JSONB,  -- {latitude, longitude} للموصلين
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2️⃣ جدول الطلبات
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
    CHECK (status IN ('pending', 'paid', 'assigned', 'in_progress', 'completed', 'cancelled')),
  total_amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  sender_details JSONB,     -- {name, phone, address, location}
  recipient_details JSONB,  -- {name, phone, address, location}
  payment_method VARCHAR(50),
  notes TEXT,
  delivery_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3️⃣ جدول تعيينات الطلبات
CREATE TABLE order_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  delivery_person_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES admin_users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'assigned',
    CHECK (status IN ('assigned', 'in_progress', 'completed', 'failed')),
  assigned_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 🔍 الفهارس (للأداء)
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_assignments_delivery_person ON order_assignments(delivery_person_id);
CREATE INDEX idx_order_assignments_order ON order_assignments(order_id);
```

---

## 🔐 سياسات Supabase RLS (Row Level Security)

```sql
-- تفعيل الحماية
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_assignments ENABLE ROW LEVEL SECURITY;

-- 📋 سياسات admin_users
-- السماح لأي شخص بقراءة المستخدمين
CREATE POLICY "Allow read all admin users" ON admin_users
  FOR SELECT USING (true);

-- السماح بالإدراج للمسجلين
CREATE POLICY "Allow insert for authenticated" ON admin_users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- - السماح بتعديل الملف الشخصي
CREATE POLICY "Allow update own profile" ON admin_users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 📋 سياسات orders
-- المدير يرى الكل، الموثقين يرون خاصتهم
CREATE POLICY "Allow read orders" ON orders
  FOR SELECT
  USING (
    user_email = current_user ||
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role IN ('admin', 'supervisor')
    )
  );

-- 📋 سياسات order_assignments
-- الموصل يرى طلباته، المشرف يرى الكل
CREATE POLICY "Allow read own assignments" ON order_assignments
  FOR SELECT
  USING (
    delivery_person_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role IN ('admin', 'supervisor')
    )
  );

-- السماح بالإدراج والتحديث
CREATE POLICY "Allow manage assignments" ON order_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role IN ('admin', 'supervisor')
    )
  );
```

---

## 📝 خطوات الإعداد في Supabase

### **الخطوة 1: نسخ SQL**
انسخ الـ SQL أعلاه وشغله في:
```
Supabase Dashboard → SQL Editor → New Query
```

### **الخطوة 2: إنشاء مستخدمين تجريبيين**
```sql
-- أولاً: تسجيل عبر Supabase Auth في الواجهة
-- أو استخدم:

-- INSERT INTO auth.users (email, password, ...)
-- (يجب تسجيل user عبر StaffLogin أولاً)

-- ثم أضف سجل في admin_users:
INSERT INTO admin_users (id, name, email, role, is_active) VALUES
  ('user-id-here', 'أحمد محمد', 'ahmed@example.com', 'delivery_person', true),
  ('user-id-here', 'فاطمة علي', 'fatima@example.com', 'supervisor', true),
  ('user-id-here', 'محمد خالد', 'admin@example.com', 'admin', true);
```

### **الخطوة 3: إنشاء طلب تجريبي**
```sql
INSERT INTO orders (user_email, status, total_amount, sender_details, recipient_details) VALUES
  ('customer@example.com', 'paid', 150.00, 
    '{"name":"محمد","phone":"+966501234567","address":"الرياض"}'::jsonb,
    '{"name":"علي","phone":"+966509876543","address":"جدة"}'::jsonb
  );

-- ثم عيّن الطلب لموصل:
INSERT INTO order_assignments (order_id, delivery_person_id, assigned_by, status) 
VALUES (
  'order-id-here',
  'delivery-person-id-here',
  'admin-id-here',
  'assigned'
);
```

---

## ✅ قائمة التحقق

- [ ] أنشأت جداول `admin_users`, `orders`, `order_assignments` في Supabase
- [ ] أضفت سياسات RLS للحماية
- [ ] أضفت مستخدمين تجريبيين
- [ ] فتحت `/stafflogin` واختبرت الدخول
- [ ] تحققت من التوجيه الصحيح لكل دور
- [ ] جربت جلب البيانات من كل صفحة

---

## 🚀 أوامر سريعة للاختبار

```bash
# 1. اذهب إلى StaffLogin
http://localhost:5173/stafflogin

# 2. اختبر دخول موصل
- اختر "موصل"
- أدخل: email: driver@test.com, password: test123
- يجب أن ينقلك إلى /DriverPanel

# 3. اختبر دخول مشرف
- اختر "مشرف"
- أدخل: email: supervisor@test.com, password: test123
- يجب أن ينقلك إلى /SupervisorPanel

# 4. اختبر في Console
localStorage.getItem('admin_user_data')
// يجب أن يظهر: {"id":"...", "name":"...", "role":"..."}
```
