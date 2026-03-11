/**
 * نظام المصادقة الموحد - للعملاء والموظفين
 * Unified Authentication System - Customers + Employees
 * 
 * هذا الملف يجمع بين:
 * 1. تسجيل دخول الموظفين (Supabase) من adminAuth.js
 * 2. تسجيل دخول العملاء (LocalStorage) من auth.js
 * 
 * النتيجة: صفحة دخول واحدة تدعم الجميع 🎉
 */

import { supabase } from '@/lib/supabase';
import { login as customerLogin } from '@/lib/auth';
import { 
  getCurrentAdminUser, 
  getCurrentAdminSession,
  ADMIN_ROLES 
} from '@/utils/adminAuth';

/**
 * تسجيل دخول موحد - يحاول الموظفين أولاً ثم العملاء
 * @param {string} email - البريد الإلكتروني
 * @param {string} password - كلمة المرور
 * @returns {Object} - {success, user, type: 'employee' | 'customer'}
 */
export async function unifiedLogin(email, password) {
  try {
    if (!email || !password) {
      throw new Error('برجاء إدخال البريد الإلكتروني وكلمة المرور');
    }

    const cleanEmail = email.toLowerCase().trim();

    // ============================================================
    // المحاولة 1️⃣: دخول Supabase (قد يكون موظفاً أو عميلاً)
    // ============================================================
    try {
      console.log('🔍 جاري التحقق من حساب Supabase...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (!error && data?.user?.id) {
        console.log('✅ تم تسجيل الدخول عبر Supabase');
        
        // جلب بيانات الموظف من جدول admin_users
        const { data: userData, error: userError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          throw userError;
        }

        // المستخدم موجود في Supabase Auth لكنه ليس موظفاً
        if (!userData) {
          const expMs = data.session?.expires_at
            ? data.session.expires_at * 1000
            : Date.now() + 24 * 60 * 60 * 1000;

          const customerData = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || data.user.email,
            provider: 'supabase',
          };

          localStorage.setItem('customer_data', JSON.stringify(customerData));

          return {
            success: true,
            user: customerData,
            type: 'customer',
            sessionToken: data.session?.access_token || `supabase-${data.user.id}`,
            sessionExpiresAt: expMs,
          };
        }

        // التحقق من أن الموظف نشط
        if (!userData.is_active) {
          throw new Error('حسابك معطل. يرجى التواصل مع المدير');
        }

        // حفظ بيانات الجلسة
        const session = {
          userId: data.user.id,
          email: data.user.email,
          name: userData.name,
          role: userData.role,
          createdAt: Date.now()
        };

        localStorage.setItem('admin_session', JSON.stringify(session));
        localStorage.setItem('admin_user', JSON.stringify(userData));
        localStorage.setItem('admin_user_data', JSON.stringify(userData));

        return {
          success: true,
          user: userData,
          type: 'employee', // موظف ✅
          role: userData.role
        };
      }
    } catch (adminError) {
      console.log('⚠️ فشل دخول Supabase أو ليس حساباً مطابقاً، جاري محاولة دخول العميل المحلي...');
    }

    // ============================================================
    // المحاولة 2️⃣: دخول العميل (LocalStorage/OTP)
    // ============================================================
    console.log('🔍 جاري التحقق من حساب عميل...');
    
    const customerResult = await customerLogin(cleanEmail, password);
    
    if (customerResult.success) {
      console.log('✅ تم تسجيل دخول عميل');

      localStorage.setItem('customer_data', JSON.stringify(customerResult.user));
      
      return {
        success: true,
        user: customerResult.user,
        type: 'customer', // عميل ✅
        sessionToken: customerResult.sessionToken,
        sessionExpiresAt: customerResult.sessionExpiresAt
      };
    }

    // ============================================================
    // فشل كلا النوعين
    // ============================================================
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيح');

  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error);
    return {
      success: false,
      error: error.message || 'حدث خطأ في تسجيل الدخول'
    };
  }
}

/**
 * تسجيل خروج موحد
 */
export async function unifiedLogout() {
  try {
    // خروج من Supabase (الموظفين)
    await supabase.auth.signOut();

    // مسح بيانات الموظفين
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_user_data');

    // مسح بيانات العملاء
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('sessionExpiresAt');
    localStorage.removeItem('wasel_signup');
    localStorage.removeItem('customer_data');

    return { success: true };
  } catch (error) {
    console.error('❌ خطأ في تسجيل الخروج:', error);
    
    // لا تزال نمسح البيانات محلياً حتى لو حدث خطأ
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_user_data');
    
    return { success: true }; // نعتبرها نجحت
  }
}

/**
 * جلب المستخدم الحالي (موظف أو عميل)
 * @returns {Object|null} - بيانات المستخدم أو null
 */
export function getCurrentUnifiedUser() {
  // تحقق من الموظف أولاً
  const adminUser = getCurrentAdminUser();
  if (adminUser) {
    return {
      ...adminUser,
      type: 'employee'
    };
  }

  // ثم تحقق من العميل
  const otpSessionRaw = localStorage.getItem('wasel_otp_session');
  if (otpSessionRaw) {
    const users = JSON.parse(localStorage.getItem('wasel_users') || '[]');
    const customerData = JSON.parse(localStorage.getItem('customer_data') || 'null');
    
    if (customerData) {
      return {
        ...customerData,
        type: 'customer'
      };
    }
  }

  return null;
}

/**
 * التحقق من نوع المستخدم الحالي
 * @returns {string} - 'employee' | 'customer' | 'none'
 */
export function getCurrentUserType() {
  const adminUser = getCurrentAdminUser();
  if (adminUser) return 'employee';

  const otpSessionRaw = localStorage.getItem('wasel_otp_session');
  if (otpSessionRaw) return 'customer';

  return 'none';
}

/**
 * هل المستخدم الحالي موظف؟
 */
export function isEmployee() {
  return getCurrentUserType() === 'employee';
}

/**
 * هل المستخدم الحالي عميل؟
 */
export function isCustomer() {
  return getCurrentUserType() === 'customer';
}

/**
 * جلب دور الموظف الحالي (إن كان موظف)
 * @returns {string|null} - 'admin' | 'supervisor' | 'delivery_person' | null
 */
export function getEmployeeRole() {
  const adminUser = getCurrentAdminUser();
  return adminUser?.role || null;
}

/**
 * التحقق من أن الموظف لديه دور معين
 */
export function hasEmployeeRole(role) {
  const currentRole = getEmployeeRole();
  if (Array.isArray(role)) {
    return role.includes(currentRole);
  }
  return currentRole === role;
}

/**
 * هل يمكن للمستخدم الوصول للصفحات المحمية؟
 */
export function canAccessProtectedPages() {
  return isEmployee(); // فقط الموظفين
}

export default {
  unifiedLogin,
  unifiedLogout,
  getCurrentUnifiedUser,
  getCurrentUserType,
  isEmployee,
  isCustomer,
  getEmployeeRole,
  hasEmployeeRole,
  canAccessProtectedPages
};
