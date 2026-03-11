/**
 * Admin Authentication Service
 * خدمة المصادقة للمشرفين والموصلين والموردين
 */

import { supabase } from '@/lib/supabase';

// ============================================================
// Authentication Constants
// ============================================================

const ADMIN_ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  DELIVERY_PERSON: 'delivery_person',
  SUPPLIER: 'supplier'
};

const SESSION_STORAGE_KEY = 'admin_session';
const USER_DATA_KEY = 'admin_user_data';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================
// Core Authentication Functions
// ============================================================

/**
 * Register a new admin/supervisor/delivery person
 */
export async function registerAdminUser(data) {
  try {
    const { name, email, password, role, referralCode = null } = data;

    // Only delivery_person (and supplier if allowed) can self-register.
    // supervisors/admins must be created by an existing supervisor/admin through the admin panel.
    const adminSession = getCurrentAdminSession();
    let finalRole = role;

    if (!adminSession || (adminSession.role !== ADMIN_ROLES.SUPERVISOR && adminSession.role !== ADMIN_ROLES.ADMIN)) {
      // public registration: only drivers or suppliers are allowed to sign up by themselves.
      // if caller does not specify a role we default to delivery_person, otherwise honor the
      // requested role as long as it is one of the permitted ones.
      if (!role) {
        finalRole = ADMIN_ROLES.DELIVERY_PERSON;
      } else if (
        role !== ADMIN_ROLES.DELIVERY_PERSON &&
        role !== ADMIN_ROLES.SUPPLIER
      ) {
        throw new Error('غير مصرح بتسجيل هذا الدور');
      } else {
        finalRole = role;
      }
    }

    if (!name || !email || !password || !finalRole) {
      throw new Error('جميع الحقول مطلوبة');
    }

    if (!Object.values(ADMIN_ROLES).includes(finalRole)) {
      throw new Error('دور غير صالح');
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: finalRole,
          name
        }
      }
    });

    if (authError) throw authError;

    // Create admin user record
    const { data: userData, error: userError } = await supabase
      .from('admin_users')
      .insert([{
        id: authData.user.id,
        name,
        email,
        role: finalRole,
        created_at: new Date().toISOString(),
        is_active: true
      }])
      .select()
      .single();

    if (userError) throw userError;

    await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        auth_id: authData.user.id,
        email,
        full_name: name,
        role: finalRole === ADMIN_ROLES.DELIVERY_PERSON ? 'courier' : (finalRole === ADMIN_ROLES.ADMIN || finalRole === ADMIN_ROLES.SUPERVISOR ? 'admin' : 'operator'),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (finalRole === ADMIN_ROLES.DELIVERY_PERSON && referralCode) {
      const normalizedCode = String(referralCode).trim().toUpperCase();
      const { data: referrerProfile } = await supabase
        .from('courier_profiles')
        .select('user_id')
        .eq('referral_code', normalizedCode)
        .maybeSingle();

      if (referrerProfile?.user_id) {
        await supabase
          .from('courier_referrals')
          .upsert({
            referrer_user_id: referrerProfile.user_id,
            referred_user_id: authData.user.id,
            referral_code: normalizedCode,
            joined_via_link: true,
            registration_completed: true,
            onboarding_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'referred_user_id' });
      }
    }

    // Save session
    const newSession = {
      userId: authData.user.id,
      email,
      name,
      role: finalRole,
      createdAt: Date.now()
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));

    return { success: true, user: userData };
  } catch (error) {
    console.error('❌ خطأ في التسجيل:', error);
    throw error;
  }
}

/**
 * Login admin user
 */
export async function loginAdminUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيح');
      }
      throw error;
    }

    // Fetch user from admin_users table
    const { data: userData, error: userError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) throw userError;

    // Save session
    const session = {
      userId: data.user.id,
      email: data.user.email,
      name: userData.name,
      role: userData.role,
      createdAt: Date.now()
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));

    return { success: true, user: userData };
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error);
    throw error;
  }
}

/**
 * Logout admin user
 */
export async function logoutAdminUser() {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    return { success: true };
  } catch (error) {
    console.error('❌ خطأ في تسجيل الخروج:', error);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    throw error;
  }
}

/**
 * Get current admin session
 */
export function getCurrentAdminSession() {
  const session = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!session) return null;

  try {
    const parsedSession = JSON.parse(session);
    
    // Check if session expired
    if (Date.now() - parsedSession.createdAt > SESSION_TIMEOUT) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      return null;
    }

    return parsedSession;
  } catch (error) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

/**
 * Get current admin user data
 */
export function getCurrentAdminUser() {
  const userData = localStorage.getItem(USER_DATA_KEY);
  if (!userData) return null;

  try {
    return JSON.parse(userData);
  } catch (error) {
    localStorage.removeItem(USER_DATA_KEY);
    return null;
  }
}

/**
 * Check if user is authenticated as admin
 */
export function isAdminAuthenticated() {
  return getCurrentAdminSession() !== null;
}

/**
 * Check if user has specific role
 */
export function hasAdminRole(requiredRoles) {
  const session = getCurrentAdminSession();
  if (!session) return false;

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(session.role);
}

/**
 * Extend session timeout
 */
export function extendAdminSession() {
  const session = getCurrentAdminSession();
  if (session) {
    session.createdAt = Date.now();
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
}

// ============================================================
// Export Constants
// ============================================================

export { ADMIN_ROLES, SESSION_STORAGE_KEY, USER_DATA_KEY };
