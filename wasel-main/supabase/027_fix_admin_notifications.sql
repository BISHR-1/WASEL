-- =====================================================================
-- 🔧 إصلاح: ضمان وصول الإشعارات للمشرفين والمدراء
-- 
-- المشكلة: المشرفون/المدراء ليس لديهم صفوف في جدول public.users
-- مما يمنع إنشاء إشعارات لهم (FK violation) ويمنع اشتراك Realtime
--
-- الحل:
-- 1. إنشاء صفوف public.users لكل admin_users مفقود
-- 2. trigger تلقائي لإنشاء الصف عند إضافة مشرف جديد
-- 3. تحسين سياسات notifications لضمان وصولها
--
-- شغّل هذا الملف في Supabase SQL Editor
-- =====================================================================

BEGIN;

-- =============================================================
-- الخطوة 1: إنشاء صفوف public.users لكل المشرفين/المدراء المفقودين
-- =============================================================

INSERT INTO public.users (id, auth_id, email, full_name, role, created_at, updated_at)
SELECT
  gen_random_uuid(),
  au.id,
  au.email,
  au.name,
  au.role,
  COALESCE(au.created_at, now()),
  now()
FROM public.admin_users au
WHERE au.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_id = au.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = au.id
  )
ON CONFLICT (email) DO UPDATE SET
  auth_id = EXCLUDED.auth_id,
  role = EXCLUDED.role,
  updated_at = now();

-- أيضاً: لو كان هناك مشرف له صف في public.users لكن بدون auth_id، نربطه
UPDATE public.users u
SET auth_id = au.id,
    role = au.role,
    updated_at = now()
FROM public.admin_users au
WHERE u.email = au.email
  AND u.auth_id IS NULL
  AND au.is_active = true;

-- =============================================================
-- الخطوة 2: trigger تلقائي عند إضافة مشرف جديد في admin_users
-- =============================================================

CREATE OR REPLACE FUNCTION public.ensure_admin_has_public_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- تحقق من وجود صف في public.users
  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE auth_id = NEW.id
  ) AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = NEW.id
  ) THEN
    -- حاول ربط عبر البريد الإلكتروني أولاً
    UPDATE public.users
    SET auth_id = NEW.id,
        role = NEW.role,
        updated_at = now()
    WHERE email = NEW.email
      AND auth_id IS NULL;

    -- إذا لم يتم التحديث، أنشئ صفاً جديداً
    IF NOT FOUND THEN
      INSERT INTO public.users (id, auth_id, email, full_name, role, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        NEW.id,
        NEW.email,
        NEW.name,
        NEW.role,
        now(),
        now()
      )
      ON CONFLICT (email) DO UPDATE SET
        auth_id = EXCLUDED.auth_id,
        role = EXCLUDED.role,
        updated_at = now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- حذف trigger قديم إذا كان موجوداً
DROP TRIGGER IF EXISTS trg_ensure_admin_public_user ON public.admin_users;

-- إنشاء trigger جديد
CREATE TRIGGER trg_ensure_admin_public_user
  AFTER INSERT OR UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_admin_has_public_user();

-- =============================================================
-- الخطوة 3: التأكد من أن RLS على notifications يسمح بالإدراج
-- والقراءة للمشرفين
-- =============================================================

-- notif_insert يسمح لأي مسجل بالإدراج (موجود بالفعل لكن نعيد تأكيده)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'notif_insert'
  ) THEN
    CREATE POLICY notif_insert ON public.notifications
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- التأكد من أن المشرفين يمكنهم قراءة إشعاراتهم
-- notif_select_own موجود بالفعل USING (user_id = auth.uid() OR user_id = current_app_user_id())
-- notif_select_staff موجود بالفعل USING (is_staff_user())
-- لا حاجة لتغييرات إضافية

-- =============================================================
-- الخطوة 4: التأكد من أن user_devices يسمح بالإدراج للمشرفين
-- =============================================================

-- ud_insert_own يتحقق من user_id = auth.uid() فقط
-- المشرف يسجل جهازه بـ auth.uid() فهذا يعمل بشكل صحيح

-- إضافة سياسة للسماح للموظفين بإدراج أجهزة (احتياطي)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_devices' AND policyname = 'ud_insert_staff'
  ) THEN
    EXECUTE 'CREATE POLICY ud_insert_staff ON public.user_devices
      FOR INSERT WITH CHECK (public.is_staff_user())';
  END IF;
END $$;

-- =============================================================
-- تأكيد: عرض المشرفين وصفوفهم في public.users
-- =============================================================

DO $$
DECLARE
  admin_count integer;
  linked_count integer;
BEGIN
  SELECT count(*) INTO admin_count FROM public.admin_users WHERE is_active = true;
  SELECT count(*) INTO linked_count
  FROM public.admin_users au
  WHERE au.is_active = true
    AND EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = au.id);

  RAISE NOTICE '=== تقرير ربط المشرفين ===';
  RAISE NOTICE 'مشرفون نشطون: %', admin_count;
  RAISE NOTICE 'مشرفون مربوطون بـ public.users: %', linked_count;

  IF admin_count > linked_count THEN
    RAISE NOTICE '⚠️ هناك % مشرف بدون ربط!', admin_count - linked_count;
  ELSE
    RAISE NOTICE '✅ جميع المشرفين مربوطون بنجاح';
  END IF;
END $$;

COMMIT;
