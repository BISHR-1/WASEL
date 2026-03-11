/**
 * 🗄️ Supabase SQL - نظام الموظفين الكامل
 * شغّل هذا الملف كاملاً في Supabase SQL Editor
 */

-- ============================================================
-- 🔧 PART 1: حذف الجداول القديمة (اختياري)
-- ============================================================
DROP TABLE IF EXISTS order_assignments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;


-- ============================================================
-- 📋 PART 2: إنشاء الجداول الأساسية
-- ============================================================

-- 1️⃣ جدول المستخدمين - الموظفين فقط
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ملف شخصي
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  avatar_url TEXT,
  
  -- الدور والحالة
  role VARCHAR(50) NOT NULL DEFAULT 'delivery_person',
  is_active BOOLEAN DEFAULT true,
  
  -- الموقع الجغرافي (للموصلين)
  location JSONB DEFAULT '{"latitude": null, "longitude": null}'::jsonb,
  
  -- الطوابع الزمنية
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,

  -- التحقق من الدور
  CONSTRAINT valid_role CHECK (
    role IN ('admin', 'supervisor', 'delivery_person', 'supplier')
  )
);

-- 2️⃣ جدول الطلبات
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- بيانات الطلب الأساسية
  user_email VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- بيانات المرسل
  sender_details JSONB DEFAULT '{
    "name": null,
    "phone": null,
    "address": null,
    "location": {"latitude": null, "longitude": null}
  }'::jsonb,
  
  -- بيانات المستقبل
  recipient_details JSONB DEFAULT '{
    "name": null,
    "phone": null,
    "address": null,
    "location": {"latitude": null, "longitude": null}
  }'::jsonb,
  
  -- تفاصيل الدفع
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  payment_status VARCHAR(50),
  
  -- تفاصيل الطلب
  notes TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  
  -- المواقيت
  delivery_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- التحقق من الحالة
  CONSTRAINT valid_order_status CHECK (
    status IN ('pending', 'paid', 'assigned', 'in_progress', 'delivering', 
               'completed', 'cancelled', 'failed')
  )
);

-- 3️⃣ جدول تعيينات الطلبات
CREATE TABLE order_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- الارتباطات
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  delivery_person_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES admin_users(id) ON DELETE SET NULL,
  
  -- الحالة
  status VARCHAR(50) NOT NULL DEFAULT 'assigned',
  
  -- التفاصيل
  notes TEXT,
  estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  
  -- الموقع الحالي (تحديث GPS)
  current_location JSONB DEFAULT '{"latitude": null, "longitude": null}'::jsonb,
  
  -- المواقيت
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- التحقق من الحالة
  CONSTRAINT valid_assignment_status CHECK (
    status IN ('assigned', 'accepted', 'in_progress', 'delivering', 
               'completed', 'failed', 'cancelled')
  )
);


-- ============================================================
-- 🔍 PART 3: إنشاء الفهارس (Indexes) - للأداء
-- ============================================================

-- فهارس admin_users
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX idx_admin_users_created_at ON admin_users(created_at);

-- فهارس orders
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_user_email ON orders(user_email);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- فهارس order_assignments
CREATE INDEX idx_assignments_delivery_person ON order_assignments(delivery_person_id);
CREATE INDEX idx_assignments_order ON order_assignments(order_id);
CREATE INDEX idx_assignments_assigned_by ON order_assignments(assigned_by);
CREATE INDEX idx_assignments_status ON order_assignments(status);
CREATE INDEX idx_assignments_created_at ON order_assignments(created_at DESC);


-- ============================================================
-- 🔐 PART 4: تفعيل الأمان (Row Level Security)
-- ============================================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_assignments ENABLE ROW LEVEL SECURITY;

-- ✅ السياسات لجدول admin_users
CREATE POLICY "Allow read all admin users" ON admin_users
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON admin_users
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update own profile" ON admin_users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow admin update all users" ON admin_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'admin'
    )
  );

-- ✅ السياسات لجدول orders
CREATE POLICY "Allow read orders for authenticated" ON orders
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow insert orders" ON orders
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update orders by admin or supervisor" ON orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role IN ('admin', 'supervisor')
    )
  );

-- ✅ السياسات لجدول order_assignments
CREATE POLICY "Allow read own assignments" ON order_assignments
  FOR SELECT
  USING (
    delivery_person_id = auth.uid() OR
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Allow insert assignments by supervisors" ON order_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Allow update own assignments" ON order_assignments
  FOR UPDATE
  USING (
    delivery_person_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role IN ('admin', 'supervisor')
    )
  );


-- ============================================================
-- 🔄 PART 5: إنشاء الدوال (Functions)
-- ============================================================

-- دالة: لإنشاء حساب جديد مع إدراج في admin_users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_users (id, email, name, role, is_active)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'delivery_person'),
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: عند إنشاء مستخدم جديد في auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- دالة: تحديث حالة الطلب تلقائياً عند تحديث التعيين
CREATE OR REPLACE FUNCTION update_order_status_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- عند البدء بالتسليم
  IF new.status = 'in_progress' AND old.status != 'in_progress' THEN
    UPDATE orders SET status = 'in_progress' WHERE id = new.order_id;
  END IF;

  -- عند الإكمال
  IF new.status = 'completed' AND old.status != 'completed' THEN
    UPDATE orders SET status = 'completed' WHERE id = new.order_id;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Trigger: لتحديث حالة الطلب
CREATE OR REPLACE TRIGGER on_assignment_status_change
  AFTER UPDATE ON order_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status_on_assignment();


-- دالة: حساب المسافة بين موقعين (Haversine Distance)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 6371; -- نصف قطر الأرض بالكيلومتر
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);
  a := SIN(dlat/2) * SIN(dlat/2) + 
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlon/2) * SIN(dlon/2);
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  RETURN R * c;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 📥 PART 6: إضافة بيانات تجريبية (اختياري)
-- ============================================================

-- أضف هذه البيانات فقط إذا كنت تريد اختبار البيانات مباشرة
-- (عادة تتم إضافة المستخدمين عبر StaffLogin)

/*
-- 1. أضف مستخدمين تجريبيين
INSERT INTO admin_users (id, name, email, role, phone, is_active) VALUES
  (gen_random_uuid(), 'محمد الموصل', 'driver@test.com', 'delivery_person', '+966501234567', true),
  (gen_random_uuid(), 'فاطمة المشرفة', 'supervisor@test.com', 'supervisor', '+966509876543', true),
  (gen_random_uuid(), 'خالد المدير', 'admin@test.com', 'admin', '+966505555555', true);

-- 2. أضف طلبات تجريبية
INSERT INTO orders (user_email, status, total_amount, sender_details, recipient_details) OVERRIDES SYSTEM VALUES
  (
    'customer@test.com',
    'paid',
    150.00,
    '{"name":"محمد","phone":"+966501111111","address":"الرياض - شارع التخصصي"}'::jsonb,
    '{"name":"علي","phone":"+966502222222","address":"جدة - شارع الأمير محمد بن عبدالعزيز"}'::jsonb
  ),
  (
    'customer@test.com',
    'assigned',
    200.00,
    '{"name":"سارة","phone":"+966503333333","address":"الدمام - شارع الخليج"}'::jsonb,
    '{"name":"فاطمة","phone":"+966504444444","address":"الخبر - شارع الملك فهد"}'::jsonb
  );
*/


-- ============================================================
-- ✅ التحقق من الإنشاء
-- ============================================================

-- لتأكد أن الجداول موجودة:
-- SELECT * FROM information_schema.tables WHERE table_name IN ('admin_users', 'orders', 'order_assignments');

-- لعرض الأعمدة:
-- \d admin_users
-- \d orders
-- \d order_assignments
