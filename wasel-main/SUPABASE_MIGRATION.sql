-- =====================================================
-- Wasel App - Supabase Database Schema
-- هذا الملف يحتوي على كامل قاعدة البيانات للتطبيق
-- =====================================================

-- تفعيل UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- جدول المستخدمين (Users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  provider TEXT DEFAULT 'email', -- 'email', 'google', 'otp'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- جدول المطاعم (Restaurants)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  image_url TEXT,
  logo_url TEXT,
  category TEXT, -- 'restaurant', 'cafe', 'bakery', 'sweets'
  rating DECIMAL(2,1) DEFAULT 0,
  delivery_time TEXT, -- مثلاً: "30-45 دقيقة"
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  min_order DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  address TEXT,
  phone TEXT,
  working_hours JSONB, -- { "saturday": "9:00-22:00", ... }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- جدول أصناف المطاعم (Menu Items / Restaurant Items)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  image_url TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2), -- السعر الأصلي قبل الخصم
  category TEXT, -- 'main', 'appetizer', 'dessert', 'drink', 'bakery'
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  preparation_time TEXT, -- "15 دقيقة"
  calories INTEGER,
  tags TEXT[], -- ['halal', 'spicy', 'vegetarian']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- جدول المنتجات (Products - للإلكترونيات والمنتجات العامة)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  image_url TEXT,
  images TEXT[], -- مصفوفة صور إضافية
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category TEXT, -- 'electronics', 'fashion', 'home', 'sports'
  subcategory TEXT,
  brand TEXT,
  stock_quantity INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  rating DECIMAL(2,1) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  specifications JSONB, -- مواصفات المنتج
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- جدول الهدايا (Gifts)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  image_url TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category TEXT, -- 'flowers', 'chocolates', 'cakes', 'occasions'
  occasion TEXT, -- 'birthday', 'wedding', 'graduation', 'general'
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  delivery_type TEXT DEFAULT 'standard', -- 'standard', 'same_day', 'express'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- جدول الباقات (Packages)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  image_url TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  duration_days INTEGER, -- مدة الباقة بالأيام
  features JSONB, -- مميزات الباقة
  is_active BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- جدول الطلبات (Orders)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'preparing', 'on_way', 'delivered', 'cancelled'
  total_amount DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  payment_method TEXT, -- 'cash', 'card', 'online'
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  delivery_address JSONB, -- عنوان التوصيل
  delivery_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- جدول تفاصيل الطلبات (Order Items)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'menu_item', 'product', 'gift', 'package'
  item_id UUID NOT NULL, -- ID من الجدول المناسب
  item_name TEXT NOT NULL,
  item_image TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  options JSONB, -- خيارات إضافية (حجم، إضافات، etc)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- جدول سلة التسوق (Cart)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'menu_item', 'product', 'gift', 'package'
  item_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  options JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

-- =====================================================
-- جدول المفضلة (Favorites)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

-- =====================================================
-- جدول التقييمات (Reviews)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- جدول العناوين (Addresses)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT, -- 'Home', 'Work', etc
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  area TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'SA',
  phone TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- جدول الإشعارات (Notifications)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT, -- 'order', 'promo', 'system'
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Indexes للأداء
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_restaurants_category ON public.restaurants(category);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active ON public.restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON public.cart(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_item ON public.reviews(item_type, item_id);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- حذف أي policies قديمة (إذا كانت موجودة)
DROP POLICY IF EXISTS "Anyone can view restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Anyone can view menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view gifts" ON public.gifts;
DROP POLICY IF EXISTS "Anyone can view packages" ON public.packages;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart;
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;

-- تفعيل RLS على كل الجداول
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- سياسات القراءة العامة للمطاعم والمنتجات (يمكن للجميع القراءة)
CREATE POLICY "Anyone can view restaurants" ON public.restaurants FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view menu items" ON public.menu_items FOR SELECT USING (is_available = true);
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (is_available = true);
CREATE POLICY "Anyone can view gifts" ON public.gifts FOR SELECT USING (is_available = true);
CREATE POLICY "Anyone can view packages" ON public.packages FOR SELECT USING (is_active = true);

-- سياسات الإدخال للبيانات التجريبية (مؤقتة - يمكن حذفها لاحقاً)
CREATE POLICY "Allow service role to insert restaurants" ON public.restaurants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role to insert menu items" ON public.menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role to insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role to insert gifts" ON public.gifts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role to insert packages" ON public.packages FOR INSERT WITH CHECK (true);

-- سياسات المستخدمين (يمكن للمستخدم قراءة وتعديل بياناته فقط)
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_id);

-- سياسات الطلبات (يمكن للمستخدم رؤية طلباته فقط)
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE public.users.id = public.orders.user_id AND public.users.auth_id = auth.uid())
);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE public.users.id = public.orders.user_id AND public.users.auth_id = auth.uid())
);

-- سياسات السلة (يمكن للمستخدم إدارة سلته فقط)
CREATE POLICY "Users can manage own cart" ON public.cart FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE public.users.id = public.cart.user_id AND public.users.auth_id = auth.uid())
);

-- سياسات المفضلة
CREATE POLICY "Users can manage own favorites" ON public.favorites FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE public.users.id = public.favorites.user_id AND public.users.auth_id = auth.uid())
);

-- سياسات العناوين
CREATE POLICY "Users can manage own addresses" ON public.addresses FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE public.users.id = public.addresses.user_id AND public.users.auth_id = auth.uid())
);

-- سياسات الإشعارات
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE public.users.id = public.notifications.user_id AND public.users.auth_id = auth.uid())
);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE public.users.id = public.notifications.user_id AND public.users.auth_id = auth.uid())
);

-- سياسات تفاصيل الطلبات (يمكن للمستخدم رؤية تفاصيل طلباته)
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE public.orders.id = public.order_items.order_id 
    AND EXISTS (SELECT 1 FROM public.users WHERE public.users.id = public.orders.user_id AND public.users.auth_id = auth.uid())
  )
);

-- سياسات التقييمات
CREATE POLICY "Users can view all reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE public.users.id = public.reviews.user_id AND public.users.auth_id = auth.uid())
);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE public.users.id = public.reviews.user_id AND public.users.auth_id = auth.uid())
);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE public.users.id = public.reviews.user_id AND public.users.auth_id = auth.uid())
);

-- =====================================================
-- Functions للتحديث التلقائي
-- =====================================================

-- Function لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers للتحديث التلقائي
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gifts_updated_at BEFORE UPDATE ON public.gifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON public.cart FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Function لإنشاء مستخدم جديد عند التسجيل
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, full_name, avatar_url, provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN NEW.app_metadata->>'provider' IS NOT NULL THEN NEW.app_metadata->>'provider'
      ELSE 'email'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger لإنشاء المستخدم تلقائياً
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Function لإنشاء رقم طلب فريد
-- =====================================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Sequence لأرقام الطلبات
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- =====================================================
-- تم إنشاء قاعدة البيانات بنجاح
-- Database created successfully
-- =====================================================
-- يمكنك الآن إضافة البيانات من:
-- 1. Supabase Dashboard → Table Editor
-- 2. أو تنفيذ SAMPLE_DATA.sql
-- =====================================================
