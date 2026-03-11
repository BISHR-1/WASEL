import bcrypt from 'bcryptjs';
import { supabase } from './supabase';
import { sendEmailOtp, verifyEmailOtp } from '../api/otpClient';

/**
 * تسجيل مستخدم جديد - إرسال OTP
 */
export async function signup(email, password) {
  try {
    // إرسال OTP
    const otpResponse = await sendEmailOtp(email);
    
    if (!otpResponse.success) {
      throw new Error(otpResponse.error || 'فشل إرسال كود التحقق');
    }
    
    return {
      success: true,
      token: otpResponse.token,
      message: 'تم إرسال كود التحقق إلى بريدك الإلكتروني'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * تأكيد التسجيل بعد التحقق من OTP
 */
export async function confirmSignup(email, code, token, password) {
  try {
    // التحقق من OTP
    const verifyResponse = await verifyEmailOtp(email, code, token);
    
    if (!verifyResponse.success) {
      throw new Error(verifyResponse.error || 'الكود غير صحيح');
    }
    
    // تشفير كلمة المرور
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // حفظ المستخدم في LocalStorage مؤقتاً (حتى يتم إنشاء جدول Supabase)
    const users = JSON.parse(localStorage.getItem('wasel_users') || '[]');
    const existingUser = users.find(u => u.email === email.toLowerCase().trim());
    
    if (existingUser) {
      throw new Error('هذا البريد الإلكتروني مسجل بالفعل');
    }
    
    const newUser = {
      id: Date.now().toString(),
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      is_verified: true,
      created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('wasel_users', JSON.stringify(users));
    
    return {
      success: true,
      user: newUser,
      sessionToken: verifyResponse.sessionToken,
      sessionExpiresAt: verifyResponse.sessionExpiresAt
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * تسجيل الدخول بكلمة المرور - مع التحقق الحقيقي من البيانات المخزنة
 */
export async function login(email, password) {
  try {
    // التحقق من صحة المدخلات
    if (!email || !password) {
      throw new Error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
    }

    // تنظيف البريد الإلكتروني
    const cleanEmail = email.toLowerCase().trim();

    // البحث عن المستخدم في LocalStorage
    const users = JSON.parse(localStorage.getItem('wasel_users') || '[]');
    const user = users.find(u => u.email === cleanEmail);

    if (!user) {
      throw new Error('البريد الإلكتروني غير مسجل في النظام');
    }

    // التحقق من أن الحساب مفعل
    if (!user.is_verified) {
      throw new Error('يرجى تأكيد حسابك أولاً عبر البريد الإلكتروني');
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error('كلمة المرور غير صحيحة');
    }

    // تحديث تاريخ آخر تسجيل دخول
    user.last_login = new Date().toISOString();
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = user;
      localStorage.setItem('wasel_users', JSON.stringify(users));
    }

    // إنشاء session token
    const sessionToken = generateSessionToken(user.id);
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 يوم

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        is_verified: user.is_verified,
        created_at: user.created_at,
        last_login: user.last_login
      },
      sessionToken,
      sessionExpiresAt: sessionExpiresAt.toISOString()
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * إرسال كود لإعادة تعيين كلمة المرور
 */
export async function requestPasswordReset(email) {
  try {
    // التحقق من وجود المستخدم في LocalStorage
    const users = JSON.parse(localStorage.getItem('wasel_users') || '[]');
    const user = users.find(u => u.email === email.toLowerCase().trim());
    
    if (!user) {
      throw new Error('البريد الإلكتروني غير مسجل');
    }
    
    // إرسال OTP
    const otpResponse = await sendEmailOtp(email);
    
    if (!otpResponse.success) {
      throw new Error(otpResponse.error || 'فشل إرسال كود التحقق');
    }
    
    return {
      success: true,
      token: otpResponse.token,
      message: 'تم إرسال كود التحقق إلى بريدك الإلكتروني'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * إعادة تعيين كلمة المرور بعد التحقق من OTP
 */
export async function resetPassword(email, code, token, newPassword) {
  try {
    // التحقق من OTP
    const verifyResponse = await verifyEmailOtp(email, code, token);
    
    if (!verifyResponse.success) {
      throw new Error(verifyResponse.error || 'الكود غير صحيح');
    }
    
    // تشفير كلمة المرور الجديدة
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // تحديث كلمة المرور في LocalStorage
    const users = JSON.parse(localStorage.getItem('wasel_users') || '[]');
    const userIndex = users.findIndex(u => u.email === email.toLowerCase().trim());
    
    if (userIndex === -1) {
      throw new Error('المستخدم غير موجود');
    }
    
    users[userIndex].password_hash = passwordHash;
    users[userIndex].updated_at = new Date().toISOString();
    localStorage.setItem('wasel_users', JSON.stringify(users));
    
    return {
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * إنشاء session token
 */
function generateSessionToken(userId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `wasel_${userId}_${timestamp}_${random}`;
}
