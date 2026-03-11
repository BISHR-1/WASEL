import { supabase } from './supabase';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

/**
 * تسجيل الدخول عبر Google OAuth
 */
export async function signInWithGoogle() {
  try {
    if (Capacitor.isNativePlatform()) {
      // للأندرويد: استخدام Browser plugin
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'com.wasel.app://login-callback',
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      
      // فتح OAuth في متصفح
      if (data?.url) {
        console.log('WASEL_DEBUG: Opening browser for OAuth...');
        await Browser.open({ 
          url: data.url,
          presentationStyle: 'popover'
        });
        
        // التحقق من الجلسة بعد إغلاق المتصفح
        const browserFinishedHandler = Browser.addListener('browserFinished', async () => {
          console.log('WASEL_DEBUG: Browser closed, checking session...');
          
          // انتظار قصير لضمان معالجة deep link
          await new Promise(resolve => setTimeout(resolve, 500));
          
          let attempts = 0;
          const maxAttempts = 15;
          
          const checkSession = async () => {
            attempts++;
            console.log(`WASEL_DEBUG: Session check attempt ${attempts}/${maxAttempts}`);
            
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
              console.log('✅ تم العثور على الجلسة!', session.user.email);
              browserFinishedHandler.remove();
              // إعادة تحميل التطبيق
              window.location.replace('/');
              return true;
            }
            
            if (attempts < maxAttempts) {
              setTimeout(checkSession, 800);
            } else {
              console.log('❌ فشل الحصول على الجلسة بعد', maxAttempts, 'محاولات');
              browserFinishedHandler.remove();
            }
            return false;
          };
          
          checkSession();
        });
      }
      
      return { data, error: null };
    } else {
      // للويب: استخدم PKCE ليعود ?code=... ثم نستبدله بجلسة
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          flowType: 'pkce',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      return { data, error: null };
    }
  } catch (error) {
    console.error('Google sign-in error:', error);
    return { data: null, error };
  }
}

/**
 * تسجيل الخروج من Supabase Auth
 */
export async function signOutGoogle() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error };
  }
}

/**
 * الحصول على الجلسة الحالية من Supabase Auth
 */
export async function getGoogleSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * مراقبة تغييرات حالة المصادقة
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
