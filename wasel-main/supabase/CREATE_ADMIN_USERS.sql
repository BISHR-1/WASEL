/**
 * ================================================
 * سكربت إنشاء حسابات الموظفين (الموصلين والمشرفين والمديرين)
 * ================================================
 * 
 * هذا السكربت يقوم بـ:
 * 1. إنشاء اختبار الجداول إن لم تكن موجودة
 * 2. إنشاء حسابات Supabase Auth للموظفين
 * 3. ربطها في جدول admin_users
 * 4. تفعيل RLS والسياسات الأمنية
 * 
 * كيفية الاستخدام:
 * 1. انسخ هذا السكربت
 * 2. افتح Supabase Console → SQL Editor
 * 3. الصق السكربت وشغله
 * 4. عدّل الإيميلات والأسماء وكلمات المرور حسب احتياجك
 */

-- ============================================================
-- الخطوة 1️⃣: تفعيل الامتدادات المطلوبة
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- الخطوة 2️⃣: إنشاء جدول admin_users (إن لم يكن موجود)
-- ============================================================

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  role text not null check (role in ('delivery_person', 'supervisor', 'admin')),
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- الفهرسة لتسريع الاستعلامات
create index if not exists idx_admin_users_email on public.admin_users(email);
create index if not exists idx_admin_users_role on public.admin_users(role);

-- ============================================================
-- الخطوة 3️⃣: تفعيل Row Level Security (RLS)
-- ============================================================

alter table public.admin_users enable row level security;

-- سياسة SELECT: يقرأ المستخدم بيانات نفسه فقط + الموظفون يرون بعضهم
drop policy if exists "admin_users_select_policy" on public.admin_users;
create policy "admin_users_select_policy" on public.admin_users
  for select using (
    auth.uid() = id or 
    (select role from public.admin_users where id = auth.uid()) in ('supervisor', 'admin')
  );

-- سياسة INSERT: يمكن للمسؤول الإضافة (يتم الإضافة من استعلام SQL عادة)
drop policy if exists "admin_users_insert_policy" on public.admin_users;
create policy "admin_users_insert_policy" on public.admin_users
  for insert with check (
    (select role from public.admin_users where id = auth.uid()) = 'admin'
  );

-- سياسة UPDATE: يقدر تحديث نفسه + الأدمن يحدث الكل
drop policy if exists "admin_users_update_policy" on public.admin_users;
create policy "admin_users_update_policy" on public.admin_users
  for update using (
    auth.uid() = id or 
    (select role from public.admin_users where id = auth.uid()) = 'admin'
  );

-- ============================================================
-- الخطوة 4️⃣: إنشاء حسابات Supabase Auth
-- ============================================================

-- ❌ ملاحظة: إذا كانت الحسابات موجودة بالفعل، ستظهر أخطاء.
-- في هذه الحالة، انتقل للخطوة 5️⃣ مباشرة.

-- إنشاء حساب موصل
select auth.admin.create_user(
  email := 'driver1@example.com',
  password := 'Driver@1234',
  email_confirm := true
);

-- إنشاء حساب مشرف
select auth.admin.create_user(
  email := 'supervisor1@example.com',
  password := 'Supervisor@1234',
  email_confirm := true
);

-- إنشاء حساب مدير
select auth.admin.create_user(
  email := 'admin1@example.com',
  password := 'Admin@1234',
  email_confirm := true
);

-- ============================================================
-- الخطوة 5️⃣: إدراج الموظفين في جدول admin_users
-- ============================================================

-- ⚠️ احذر! إذا قمت بتشغيل هذا مرتين، استخدم ON CONFLICT
insert into public.admin_users (id, email, name, role, is_active, created_at, updated_at)
select 
  id, 
  email,
  'أحمد الموصل' as name,
  'delivery_person' as role,
  true,
  now(),
  now()
from auth.users
where email = 'driver1@example.com'
on conflict (email) do update set updated_at = now();

insert into public.admin_users (id, email, name, role, is_active, created_at, updated_at)
select 
  id, 
  email,
  'علي المشرف' as name,
  'supervisor' as role,
  true,
  now(),
  now()
from auth.users
where email = 'supervisor1@example.com'
on conflict (email) do update set updated_at = now();

insert into public.admin_users (id, email, name, role, is_active, created_at, updated_at)
select 
  id, 
  email,
  'محمد المدير' as name,
  'admin' as role,
  true,
  now(),
  now()
from auth.users
where email = 'admin1@example.com'
on conflict (email) do update set updated_at = now();

-- ============================================================
-- الخطوة 6️⃣: التحقق من البيانات
-- ============================================================

-- عرض جميع الموظفين المضافين
select id, email, name, role, is_active, created_at
from public.admin_users
order by created_at desc;

-- ============================================================
-- الخطوة 7️⃣: (اختياري) إنشاء حسابات إضافية
-- ============================================================

-- يمكنك نسخ هذا النموذج لإنشاء موظفين آخرين:

/*
select auth.admin.create_user(
  email := 'driver2@example.com',
  password := 'Driver@1234',
  email_confirm := true
);

insert into public.admin_users (id, email, name, role, is_active, created_at, updated_at)
select 
  id, 
  email,
  'محمود الموصل الثاني' as name,
  'delivery_person' as role,
  true,
  now(),
  now()
from auth.users
where email = 'driver2@example.com'
on conflict (email) do update set updated_at = now();
*/

-- ============================================================
-- ملاحظات هامة ⚠️
-- ============================================================

/*
1. **البريد والكلمة المرور:**
   - عدّل 'driver1@example.com' و 'Driver@1234' بالقيم الحقيقية
   - استخدم كلمات مرور قوية (أحرف كبيرة + أرقام + رموز)

2. **الأدوار المتاحة:**
   - 'delivery_person' → الموصل
   - 'supervisor' → المشرف
   - 'admin' → المدير

3. **إرسال البيانات للموظف:**
   - انسخ البريد وكلمة المرور
   - أرسلها للموظف عبر بريد آمن (WhatsApp، Signal، إلخ)

4. **حذف حساب موظف:**
   delete from public.admin_users where email = 'driver1@example.com';
   -- سيؤدي لحذف حساب auth تلقائياً (ON DELETE CASCADE)

5. **تفعيل/تعطيل حساب:**
   update public.admin_users set is_active = false where email = 'driver1@example.com';

6. **كيفية الدخول:**
   - الموظف يدخل من الصفحة العادية (EmailOtpLogin)
   - يكتب نفس البريد وكلمة المرور
   - النظام يكتشف أنه موظف (من جدول admin_users)
   - يُوجه للصفحة المناسبة (DriverPanel, SupervisorPanel, StaffDashboard)
   - العملاء العاديين لا يتأثرون

7. **اختبار الاتصال:**
   - استخدم Browser Console لاختبار
   - console.log(localStorage.getItem('admin_user'))
*/