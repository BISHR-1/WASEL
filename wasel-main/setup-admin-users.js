/**
 * 🚀 سكريبت إنشاء حسابات الموظفين
 * Create Staff Users Script
 * 
 * هذا السكريبت ينشئ:
 * 1. حسابات Auth (driver, supervisor, admin)
 * 2. إدراجها في جدول admin_users
 * 
 * الاستخدام:
 * node setup-admin-users.js
 */

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// البيانات الخاصة بك من Supabase:
// ============================================================

const SUPABASE_URL = 'https://ofdqkracfqakbtjjmksa.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHFrcmFjZnFha2J0ampta3NhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA4MzI3MywiZXhwIjoyMDg0NjU5MjczfQ.ykDfnyOhA1ed9SdfWylr_X3R4K7Pz7GKmTtG0d3KtZs';

// ============================================================

// التحقق من البيانات
if (!SUPABASE_URL.includes('supabase.co')) {
  console.error('❌ خطأ: يجب ملء SUPABASE_URL');
  console.error('   مثال: https://ofdqkracfqakbtjjmksa.supabase.co');
  process.exit(1);
}

if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY' || SERVICE_ROLE_KEY.length < 40) {
  console.error('❌ خطأ: يجب ملء SERVICE_ROLE_KEY');
  console.error('   اذهب إلى: Supabase Console → Settings → API → Service Role');
  process.exit(1);
}

// بيانات الموظفين
const staff = [
  {
    email: 'driver1@example.com',
    password: 'Driver@1234',
    name: 'أحمد الموصل',
    role: 'delivery_person'
  },
  {
    email: 'supervisor1@example.com',
    password: 'Supervisor@1234',
    name: 'علي المشرف',
    role: 'supervisor'
  },
  {
    email: 'admin1@example.com',
    password: 'Admin@1234',
    name: 'محمد المدير',
    role: 'admin'
  }
];

/**
 * إنشاء مستخدم عبر Admin API
 */
async function createAuthUser(email, password) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const user = await response.json();
    return user;
  } catch (error) {
    throw new Error(`Failed to create auth user ${email}: ${error.message}`);
  }
}

/**
 * إدراج بيانات في جدول admin_users
 */
async function insertAdminUser(supabase, id, email, name, role) {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .insert([{
        id,
        email,
        name,
        role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    throw new Error(`Failed to insert admin user ${email}: ${error.message}`);
  }
}

/**
 * البرنامج الرئيسي
 */
async function main() {
  console.log('\n🚀 جاري إنشاء حسابات الموظفين...\n');

  try {
    // إنشاء عميل Supabase
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // إنشاء كل موظف
    for (const staff_member of staff) {
      console.log(`📝 جاري معالجة: ${staff_member.email}`);

      // 1. إنشاء في Auth
      console.log(`   → إنشاء حساب Auth...`);
      const authUser = await createAuthUser(staff_member.email, staff_member.password);
      console.log(`   ✅ تم إنشاء Auth user (ID: ${authUser.user.id.substring(0, 8)}...)`);

      // 2. إدراج في admin_users
      console.log(`   → إدراج في جدول admin_users...`);
      const dbUser = await insertAdminUser(
        supabase,
        authUser.user.id,
        staff_member.email,
        staff_member.name,
        staff_member.role
      );
      console.log(`   ✅ تم الإدراج بنجاح\n`);
    }

    console.log('\n✅ تم إنشاء جميع الموظفين بنجاح!\n');
    console.log('📋 بيانات الدخول:\n');
    console.log('┌─────────────────────────────────────────────┐');
    staff.forEach(s => {
      console.log(`│ البريد: ${s.email.padEnd(25)} │`);
      console.log(`│ الكلمة: ${s.password.padEnd(25)} │`);
      console.log(`│ الدور: ${s.role.padEnd(27)} │`);
      console.log('├─────────────────────────────────────────────┤');
    });
    console.log('└─────────────────────────────────────────────┘\n');

    console.log('🎉 الآن يمكنك الدخول إلى التطبيق باستخدام هذه البيانات!\n');

  } catch (error) {
    console.error('\n❌ حدث خطأ:', error.message, '\n');
    process.exit(1);
  }
}

// تشغيل البرنامج
main();
