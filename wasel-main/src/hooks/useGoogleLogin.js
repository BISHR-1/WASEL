import axios from 'axios';
import { base44 } from '@/api/base44Client';

export const handleGoogleLoginSuccess = async (credentialResponse) => {
  try {
    console.log('Google Response:', credentialResponse);
    
    // الحصول على JWT token من Google
    const { credential } = credentialResponse;

    if (!credential) {
      console.error('لم يتم استقبال credential من Google');
      return;
    }

    // إرسال الـ token إلى Backend
    const result = await base44.auth.loginWithGoogle({
      idToken: credential
    });

    console.log('نتيجة تسجيل الدخول:', result);

    if (result && result.success) {
      console.log('تم تسجيل الدخول بنجاح!');
      // إعادة التوجيه إلى الصفحة الرئيسية
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } else {
      console.error('فشل تسجيل الدخول:', result?.message);
    }
  } catch (error) {
    console.error('خطأ في تسجيل الدخول عبر Google:', error);
  }
};

export const useGoogleLogin = () => {
  return { login: handleGoogleLoginSuccess };
};
