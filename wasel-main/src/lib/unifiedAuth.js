import { getOtpSession } from './otpAuth';
import { getGoogleSession } from './googleAuth';

/**
 * الحصول على الجلسة الموحدة (OTP أو Google)
 */
export async function getUnifiedSession() {
  // جرّب OTP أولاً
  const otpSession = getOtpSession();
  if (otpSession && otpSession.email) {
    return {
      email: otpSession.email,
      provider: 'otp',
      session: otpSession
    };
  }

  // إذا لم يوجد OTP، جرّب Google
  const googleSession = await getGoogleSession();
  if (googleSession && googleSession.user) {
    return {
      email: googleSession.user.email,
      provider: 'google',
      session: googleSession,
      user: googleSession.user
    };
  }

  return null;
}

/**
 * مسح جميع الجلسات
 */
export function clearAllSessions() {
  // مسح OTP session
  localStorage.removeItem('wasel_otp_session');
  
  // سيتم مسح Google session من خلال signOutGoogle() في googleAuth.js
}
