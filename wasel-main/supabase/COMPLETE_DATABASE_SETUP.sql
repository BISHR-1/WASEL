-- =====================================================
-- WASEL - COMPLETE DATABASE SETUP (SAFE MODE)
-- انسخ هذا الكود بالكامل والصقه في SQL Editor في Supabase
-- هذا الإصدار يتعامل مع الجداول الموجودة مسبقاً بشكل آمن
-- =====================================================

-- تفعيل الإضافات المطلوبة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 1. جدول المستخدمين (USERS) - تعديل آمن
-- =====================================================
-- إذا كان الجدول موجوداً، نضيف الأعمدة المفقودة فقط
DO $$
BEGIN
  -- إنشاء الجدول إذا لم يكن موجوداً
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    CREATE TABLE public.users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      full_name TEXT,
      avatar_url TEXT,
      role TEXT DEFAULT 'user',
      is_active BOOLEAN DEFAULT true,
      email_verified BOOLEAN DEFAULT false,
      phone_verified BOOLEAN DEFAULT false,
      two_factor_enabled BOOLEAN DEFAULT false,
      two_factor_secret TEXT,
      failed_login_attempts INTEGER DEFAULT 0,
      locked_until TIMESTAMPTZ,
      last_login TIMESTAMPTZ,
      preferred_language TEXT DEFAULT 'ar',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  ELSE
    -- إضافة الأعمدة المفقودة للجدول الموجود
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role') THEN
      ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_active') THEN
      ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email_verified') THEN
      ALTER TABLE public.users ADD COLUMN email_verified BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone_verified') THEN
      ALTER TABLE public.users ADD COLUMN phone_verified BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'two_factor_enabled') THEN
      ALTER TABLE public.users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'two_factor_secret') THEN
      ALTER TABLE public.users ADD COLUMN two_factor_secret TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'failed_login_attempts') THEN
      ALTER TABLE public.users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'locked_until') THEN
      ALTER TABLE public.users ADD COLUMN locked_until TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_login') THEN
      ALTER TABLE public.users ADD COLUMN last_login TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'preferred_language') THEN
      ALTER TABLE public.users ADD COLUMN preferred_language TEXT DEFAULT 'ar';
    END IF;
  END IF;
END $$;

-- =====================================================
-- 2. جدول العناوين (ADDRESSES)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'المنزل',
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  area TEXT,
  building TEXT,
  floor TEXT,
  apartment TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. جدول المنتجات (PRODUCTS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  category TEXT,
  subcategory TEXT,
  price_usd DECIMAL(10, 2) NOT NULL,
  original_price_usd DECIMAL(10, 2),
  cost_usd DECIMAL(10, 2),
  stock_qty INTEGER DEFAULT 0,
  reserved_qty INTEGER DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 10,
  image_url TEXT,
  images TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  avg_rating DECIMAL(2, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- إضافة أعمدة مفقودة للمنتجات إذا كان الجدول موجوداً
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'reserved_qty') THEN
    ALTER TABLE public.products ADD COLUMN reserved_qty INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'min_stock_alert') THEN
    ALTER TABLE public.products ADD COLUMN min_stock_alert INTEGER DEFAULT 10;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'avg_rating') THEN
    ALTER TABLE public.products ADD COLUMN avg_rating DECIMAL(2, 1) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'review_count') THEN
    ALTER TABLE public.products ADD COLUMN review_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- =====================================================
-- 4. جدول سلات العائلة (FAMILY_CARTS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.family_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'سلة العائلة',
  is_locked BOOLEAN DEFAULT false,
  locked_by UUID REFERENCES public.users(id),
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 5. جدول عناصر السلة (CART_ITEMS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID REFERENCES public.family_carts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_snapshot_usd DECIMAL(10, 2) NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cart_id, product_id),
  UNIQUE(user_id, product_id) -- إذا لم يكن هناك cart_id
);

-- =====================================================
-- 6. جدول الطلبات (ORDERS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  address_id UUID REFERENCES public.addresses(id),
  courier_id UUID REFERENCES public.users(id),
  
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'preparing', 'ready', 
    'out_for_delivery', 'delivered', 'cancelled', 'refunded'
  )),
  
  payment_method TEXT CHECK (payment_method IN ('paypal', 'card', 'cod', 'wallet')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid', 'failed', 'refunded', 'partially_refunded'
  )),
  
  paypal_order_id TEXT,
  paypal_capture_id TEXT,
  
  subtotal_usd DECIMAL(10, 2) NOT NULL,
  delivery_fee_usd DECIMAL(10, 2) DEFAULT 0,
  discount_usd DECIMAL(10, 2) DEFAULT 0,
  total_usd DECIMAL(10, 2) NOT NULL,
  
  coupon_code TEXT,
  coupon_discount_usd DECIMAL(10, 2) DEFAULT 0,
  
  items JSONB NOT NULL,
  
  notes TEXT,
  delivery_notes TEXT,
  
  estimated_delivery TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  idempotency_key TEXT UNIQUE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 7. جدول المفضلات (FAVORITES)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- =====================================================
-- 8. جدول التفاعلات (INTERACTIONS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'view', 'click', 'add_to_cart', 'remove_from_cart',
    'favorite', 'unfavorite', 'purchase', 'share', 'search'
  )),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 9. جدول رسائل الدردشة (CHAT_MESSAGES) - مشفرة
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  
  -- الرسالة المشفرة
  encrypted_content BYTEA,
  iv BYTEA,
  auth_tag BYTEA,
  
  -- البيانات الوصفية (غير مشفرة)
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 10. جدول مفاتيح عدم التكرار (IDEMPOTENCY_KEYS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  response JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours')
);

-- =====================================================
-- 11. جدول سجلات التدقيق (AUDIT_LOGS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 12. جدول حدود المعدل (RATE_LIMITS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  identifier TEXT NOT NULL, -- IP أو user_id
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 13. جدول سجلات Webhook (WEBHOOK_LOGS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL, -- 'paypal', 'stripe', etc.
  event_type TEXT NOT NULL,
  event_id TEXT,
  payload JSONB,
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed')),
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 14. جدول التقييمات (REVIEWS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- =====================================================
-- 15. جدول الكوبونات (COUPONS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_percent DECIMAL(5, 2),
  discount_usd DECIMAL(10, 2),
  min_order_usd DECIMAL(10, 2) DEFAULT 0,
  max_discount_usd DECIMAL(10, 2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 16. جدول استخدام الكوبونات (COUPON_USAGE)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(coupon_id, user_id)
);

-- =====================================================
-- الفهارس (INDEXES) لتحسين الأداء
-- =====================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_name_ar_trgm ON public.products USING gin(name_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin(name gin_trgm_ops);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON public.favorites(product_id);

-- Interactions
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_product_id ON public.interactions(product_id);
CREATE INDEX IF NOT EXISTS idx_interactions_action ON public.interactions(action);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON public.interactions(created_at DESC);

-- Chat Messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);

-- Idempotency Keys
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON public.idempotency_keys(key);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON public.idempotency_keys(expires_at);

-- Rate Limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON public.rate_limits(endpoint);

-- =====================================================
-- الدوال (FUNCTIONS)
-- =====================================================

-- دالة تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- دالة توليد رقم الطلب
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'WAS-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || 
    LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- دالة حجز المخزون
CREATE OR REPLACE FUNCTION reserve_stock(p_product_id UUID, p_qty INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  available INTEGER;
BEGIN
  SELECT stock_qty - reserved_qty INTO available 
  FROM products WHERE id = p_product_id FOR UPDATE;
  
  IF available >= p_qty THEN
    UPDATE products SET reserved_qty = reserved_qty + p_qty 
    WHERE id = p_product_id;
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- دالة تحرير المخزون
CREATE OR REPLACE FUNCTION release_stock(p_product_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET reserved_qty = GREATEST(0, reserved_qty - p_qty)
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- دالة تحديث تقييم المنتج
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET
    avg_rating = (SELECT AVG(rating)::DECIMAL(2,1) FROM reviews WHERE product_id = NEW.product_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = NEW.product_id)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- المشغلات (TRIGGERS)
-- =====================================================

-- تحديث updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_addresses_updated_at ON public.addresses;
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- توليد رقم الطلب
DROP TRIGGER IF EXISTS generate_order_number_trigger ON public.orders;
CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON public.orders
  FOR EACH ROW WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- تحديث تقييم المنتج
DROP TRIGGER IF EXISTS update_product_rating_trigger ON public.reviews;
CREATE TRIGGER update_product_rating_trigger AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- =====================================================
-- سياسات أمان الصف (ROW LEVEL SECURITY)
-- =====================================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- سياسات المستخدمين
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- سياسات العناوين
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
CREATE POLICY "Users can manage own addresses" ON public.addresses
  FOR ALL USING (auth.uid() = user_id);

-- سياسات المنتجات (الجميع يقرأ، المشرفون يعدلون)
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'operator'))
  );

-- سياسات السلة
DROP POLICY IF EXISTS "Users can manage own cart items" ON public.cart_items;
CREATE POLICY "Users can manage own cart items" ON public.cart_items
  FOR ALL USING (auth.uid() = user_id);

-- سياسات الطلبات
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = courier_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'operator'))
  );

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- سياسات المفضلات
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
CREATE POLICY "Users can manage own favorites" ON public.favorites
  FOR ALL USING (auth.uid() = user_id);

-- سياسات التفاعلات
DROP POLICY IF EXISTS "Users can create interactions" ON public.interactions;
CREATE POLICY "Users can create interactions" ON public.interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can view own interactions" ON public.interactions;
CREATE POLICY "Users can view own interactions" ON public.interactions
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- سياسات الدردشة
DROP POLICY IF EXISTS "Users can manage own chat" ON public.chat_messages;
CREATE POLICY "Users can manage own chat" ON public.chat_messages
  FOR ALL USING (auth.uid() = user_id);

-- سياسات التقييمات
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "Users can manage own reviews" ON public.reviews;
CREATE POLICY "Users can manage own reviews" ON public.reviews
  FOR ALL USING (auth.uid() = user_id);

-- سياسات الكوبونات
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- =====================================================
-- الصلاحيات (GRANTS)
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT SELECT ON public.coupons TO anon, authenticated;

GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.addresses TO authenticated;
GRANT ALL ON public.cart_items TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.favorites TO authenticated;
GRANT ALL ON public.interactions TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;
GRANT ALL ON public.family_carts TO authenticated;
GRANT INSERT ON public.reviews TO authenticated;
GRANT UPDATE, DELETE ON public.reviews TO authenticated;

-- =====================================================
-- بيانات تجريبية (SAMPLE DATA)
-- =====================================================

-- إضافة كوبونات تجريبية
INSERT INTO public.coupons (code, description, discount_type, discount_percent, min_order_usd, expires_at, is_active)
VALUES 
  ('WELCOME10', 'خصم 10% للعملاء الجدد', 'percentage', 10, 10, now() + INTERVAL '1 year', true),
  ('SAVE20', 'خصم 20% على الطلبات فوق $50', 'percentage', 20, 50, now() + INTERVAL '6 months', true),
  ('FLAT5', 'خصم $5 ثابت', 'fixed', NULL, 20, now() + INTERVAL '3 months', true)
ON CONFLICT (code) DO NOTHING;

-- إضافة منتجات تجريبية
INSERT INTO public.products (name, name_ar, description, category, price_usd, stock_qty, is_active, is_featured)
VALUES 
  ('Shawarma Plate', 'طبق شاورما', 'شاورما لحم أو دجاج مع الأرز والسلطة', 'الوجبات الرئيسية', 8.99, 100, true, true),
  ('Falafel Sandwich', 'ساندويش فلافل', 'فلافل طازج مع الخضار والطحينة', 'الساندويشات', 4.99, 150, true, true),
  ('Hummus', 'حمص', 'حمص بالطحينة مع زيت الزيتون', 'المقبلات', 3.99, 200, true, false),
  ('Fresh Juice', 'عصير طازج', 'عصير برتقال أو ليمون طازج', 'المشروبات', 2.99, 100, true, false),
  ('Baklava', 'بقلاوة', 'بقلاوة تركية بالفستق الحلبي', 'الحلويات', 5.99, 80, true, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- انتهى الإعداد!
-- =====================================================

SELECT 'تم إنشاء جميع الجداول بنجاح! ✅' as message;
