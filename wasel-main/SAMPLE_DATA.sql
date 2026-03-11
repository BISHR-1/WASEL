-- ==========================================
-- بيانات تجريبية لاختبار التطبيق
-- Sample Data for Testing
-- ==========================================
-- نفذ هذا الملف بعد تنفيذ SUPABASE_MIGRATION.sql
-- Run this file after executing SUPABASE_MIGRATION.sql
-- ==========================================

-- 1. إضافة مطاعم (Restaurants)
INSERT INTO restaurants (name, name_en, category, cuisine_type, description, description_en, image_url, rating, delivery_fee, delivery_time, location, location_en, is_active, is_featured)
VALUES
-- مطاعم عادية
('مطعم الشام', 'Al-Sham Restaurant', 'restaurant', 'عربي', 'أفضل المأكولات الشامية الأصيلة', 'Best authentic Syrian cuisine', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800', 4.5, 2000, '30-40 دقيقة', 'درعا - الشارع الرئيسي', 'Daraa - Main Street', true, true),

('مطعم بيروت', 'Beirut Restaurant', 'restaurant', 'لبناني', 'المأكولات اللبنانية الفاخرة', 'Premium Lebanese cuisine', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', 4.3, 2500, '25-35 دقيقة', 'درعا - حي المحطة', 'Daraa - Mahatta District', true, true),

-- محلات حلويات
('حلويات الأمير', 'Al-Amir Sweets', 'sweets', 'حلويات شرقية', 'أشهى الحلويات الشرقية والغربية', 'Delicious Eastern and Western sweets', 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800', 4.8, 1500, '20-30 دقيقة', 'درعا - السوق القديم', 'Daraa - Old Market', true, true),

('حلويات دمشق', 'Damascus Sweets', 'sweets', 'بوظة وحلويات', 'بوظة عربية طازجة وحلويات دمشقية', 'Fresh Arabic ice cream and Damascus sweets', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800', 4.7, 1000, '15-25 دقيقة', 'درعا - شارع الثورة', 'Daraa - Thawra Street', true, true);


-- 2. إضافة أصناف للمطاعم (Menu Items)
INSERT INTO menu_items (restaurant_id, name, name_en, description, description_en, category, price, image_url, is_available, is_featured)
SELECT 
    r.id,
    'مشاوي مشكلة',
    'Mixed Grills',
    'تشكيلة من أفضل المشاوي: كباب، شيش طاووق، كفتة',
    'Selection of best grills: Kebab, Shish Tawook, Kofta',
    'main_course',
    25000,
    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800',
    true,
    true
FROM restaurants r WHERE r.name = 'مطعم الشام';

INSERT INTO menu_items (restaurant_id, name, name_en, description, description_en, category, price, image_url, is_available, is_featured)
SELECT 
    r.id,
    'فتة حمص',
    'Hummus Fatteh',
    'فتة حمص بالطحينة والصنوبر',
    'Hummus fatteh with tahini and pine nuts',
    'appetizer',
    8000,
    'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800',
    true,
    false
FROM restaurants r WHERE r.name = 'مطعم الشام';

INSERT INTO menu_items (restaurant_id, name, name_en, description, description_en, category, price, image_url, is_available, is_featured)
SELECT 
    r.id,
    'شاورما دجاج',
    'Chicken Shawarma',
    'شاورما دجاج طازجة مع الثوم والخضار',
    'Fresh chicken shawarma with garlic and vegetables',
    'main_course',
    12000,
    'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800',
    true,
    true
FROM restaurants r WHERE r.name = 'مطعم بيروت';

-- حلويات
INSERT INTO menu_items (restaurant_id, name, name_en, description, description_en, category, price, image_url, is_available, is_featured)
SELECT 
    r.id,
    'بقلاوة بالفستق',
    'Baklava with Pistachios',
    'بقلاوة طازجة محشوة بالفستق الحلبي',
    'Fresh baklava stuffed with Aleppo pistachios',
    'sweets',
    15000,
    'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800',
    true,
    true
FROM restaurants r WHERE r.name = 'حلويات الأمير';

INSERT INTO menu_items (restaurant_id, name, name_en, description, description_en, category, price, image_url, is_available, is_featured)
SELECT 
    r.id,
    'بوظة عربية',
    'Arabic Ice Cream',
    'بوظة عربية بالمستكة والقشطة',
    'Arabic ice cream with mastic and cream',
    'sweets',
    5000,
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800',
    true,
    true
FROM restaurants r WHERE r.name = 'حلويات دمشق';


-- 3. إضافة منتجات (Products)
INSERT INTO products (name, name_en, description, description_en, category, price, image_url, stock_quantity, is_active, is_featured)
VALUES
-- سوبر ماركت
('رز أبو كاس 5 كغ', 'Abu Kas Rice 5kg', 'رز أبو كاس درجة أولى', 'Abu Kas first grade rice', 'supermarket', 20000, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800', 100, true, true),

('زيت زيتون 1 لتر', 'Olive Oil 1L', 'زيت زيتون بكر ممتاز سوري', 'Syrian extra virgin olive oil', 'supermarket', 15000, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800', 50, true, true),

('سكر أبيض 2 كغ', 'White Sugar 2kg', 'سكر أبيض ناعم', 'Fine white sugar', 'supermarket', 8000, 'https://images.unsplash.com/photo-1582103964943-1459505fc89a?w=800', 200, true, false),

-- إلكترونيات
('سماعات بلوتوث', 'Bluetooth Headphones', 'سماعات لاسلكية بجودة صوت عالية', 'Wireless headphones with high sound quality', 'electronics', 50000, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 20, true, true),

('شاحن سريع USB-C', 'Fast USB-C Charger', 'شاحن سريع 65 واط مع كابل', 'Fast 65W charger with cable', 'electronics', 25000, 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800', 30, true, false);


-- 4. إضافة هدايا (Gifts)
INSERT INTO gifts (name, name_en, description, description_en, occasion, price, image_url, is_available, is_featured)
VALUES
('باقة ورد أحمر', 'Red Roses Bouquet', 'باقة من 24 وردة حمراء طازجة', 'Bouquet of 24 fresh red roses', 'engagement', 30000, 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800', true, true),

('علبة شوكولا فاخرة', 'Premium Chocolate Box', 'علبة شوكولا بلجيكية فاخرة - 500 غرام', 'Premium Belgian chocolate box - 500g', 'birthday', 40000, 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800', true, true),

('باقة أفراح كاملة', 'Complete Wedding Package', 'باقة كاملة للأفراح: ورد، شوكولا، وزينة', 'Complete wedding package: flowers, chocolates, decorations', 'wedding', 150000, 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800', true, true),

('هدية مولود جديد', 'Newborn Gift Set', 'طقم هدايا للمولود الجديد: ملابس، لعب، ومستلزمات', 'Newborn gift set: clothes, toys, essentials', 'newborn', 50000, 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800', true, true);


-- 5. إضافة باقات (Packages)
INSERT INTO packages (name, name_en, description, description_en, package_type, price, duration_days, features, is_active, is_featured)
VALUES
('باقة توصيل شهرية', 'Monthly Delivery Package', 'توصيل مجاني لمدة شهر لجميع الطلبات', 'Free delivery for one month for all orders', 'delivery', 50000, 30, '["توصيل مجاني", "أولوية في التوصيل", "خصم 10% على الطلبات"]', true, true),

('باقة VIP', 'VIP Package', 'خدمة VIP مع مميزات حصرية', 'VIP service with exclusive features', 'premium', 100000, 30, '["توصيل مجاني", "خصومات حصرية", "أولوية في الطلبات", "دعم فني 24/7"]', true, true),

('باقة العائلة', 'Family Package', 'باقة خاصة للعائلات مع خصومات كبيرة', 'Special family package with big discounts', 'family', 75000, 30, '["خصم 20% على جميع الطلبات", "توصيل مجاني فوق 20000", "هدايا شهرية"]', true, false);


-- ==========================================
-- ملاحظة: بعد تنفيذ هذا الملف، ستحتاج لإضافة مستخدمين من خلال:
-- 1. التسجيل في التطبيق (سيتم إنشاء user تلقائياً)
-- 2. أو إضافة users يدوياً من Supabase Dashboard → Authentication
-- ==========================================

-- للتحقق من البيانات:
-- SELECT * FROM restaurants;
-- SELECT * FROM menu_items;
-- SELECT * FROM products;
-- SELECT * FROM gifts;
-- SELECT * FROM packages;
