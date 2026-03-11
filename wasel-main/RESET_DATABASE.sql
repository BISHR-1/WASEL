-- =====================================================
-- حذف قاعدة البيانات القديمة بالكامل وإعادة إنشائها
-- DROP OLD DATABASE AND RECREATE
-- =====================================================
-- ⚠️ تحذير: هذا سيحذف كل البيانات الموجودة
-- Warning: This will delete all existing data
-- =====================================================

-- حذف كل الجداول الموجودة
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.cart CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.packages CASCADE;
DROP TABLE IF EXISTS public.gifts CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;
DROP TABLE IF EXISTS public.product_reviews CASCADE;

-- حذف الـ Sequences
DROP SEQUENCE IF EXISTS order_number_seq CASCADE;

-- حذف الـ Functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;

-- =====================================================
-- تم حذف كل شيء - الآن قم بتنفيذ SUPABASE_MIGRATION.sql
-- Everything deleted - now execute SUPABASE_MIGRATION.sql
-- =====================================================
