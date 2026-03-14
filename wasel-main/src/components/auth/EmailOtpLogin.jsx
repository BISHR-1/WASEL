import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { sendEmailOtp, verifyEmailOtp } from '@/api/otpClient';
import { setOtpSession, getOtpSession } from '@/lib/otpAuth';
import { Loader2, ArrowRight } from 'lucide-react';
import { OTPInput } from 'input-otp';
import GoogleSignInButton from './GoogleSignInButton';
import { supabase } from '@/lib/supabase';
import AnimatedLoginCard from './AnimatedLoginCard';
import LoginCard from './LoginCard';
import { signup, confirmSignup, login, requestPasswordReset, resetPassword } from '@/lib/auth';
import { unifiedLogin } from '@/utils/unifiedAuth';
import { createPageUrl } from '@/utils';
import { initPushNotifications } from '@/lib/pushNotifications';
import { addNotification } from '@/lib/inAppNotifications';
import { setUserRegion } from '@/lib/userRegion';


export default function EmailOtpLogin({ onSuccess }) {
    const navigate = useNavigate();
    const [referralCode, setReferralCode] = useState('');
    const [regionLocked, setRegionLocked] = useState(false);
    const isReferralFlow = Boolean(referralCode);

    const clearReferralContext = () => {
      try {
        localStorage.removeItem('wasel_referral_code');
        localStorage.removeItem('wasel_auth_region_locked');
      } catch {
        // noop
      }
      setReferralCode('');
      setRegionLocked(false);
    };

    const provisionReferredCourier = async (authUser) => {
      if (!authUser?.id || !authUser?.email || !referralCode) return;

      const normalizedCode = String(referralCode).trim().toUpperCase();
      if (!normalizedCode) return;

      const { error: rpcError } = await supabase.rpc('complete_referral_courier_signup', {
        p_referral_code: normalizedCode,
      });
      if (!rpcError) {
        clearReferralContext();
        return;
      }

      const displayName = authUser?.user_metadata?.full_name
        || authUser?.user_metadata?.name
        || String(authUser.email).split('@')[0]
        || 'Courier';

      const nowIso = new Date().toISOString();

      const { data: existingByEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', authUser.email)
        .limit(1);

      const existingUserId = Array.isArray(existingByEmail) && existingByEmail.length > 0
        ? existingByEmail[0]?.id
        : null;

      if (existingUserId) {
        await supabase
          .from('users')
          .update({
            auth_id: authUser.id,
            role: 'courier',
            full_name: displayName,
            updated_at: nowIso,
          })
          .eq('id', existingUserId);
      } else {
        await supabase
          .from('users')
          .upsert({
            id: authUser.id,
            auth_id: authUser.id,
            email: authUser.email,
            full_name: displayName,
            role: 'courier',
            updated_at: nowIso,
          }, { onConflict: 'id' });
      }

      const { data: referrerProfile } = await supabase
        .from('courier_profiles')
        .select('user_id')
        .eq('referral_code', normalizedCode)
        .maybeSingle();

      const referrerUserId = referrerProfile?.user_id || null;
      if (!referrerUserId) {
        clearReferralContext();
        return;
      }

      const { data: referredUser } = await supabase
        .from('users')
        .select('id')
        .or(`id.eq.${authUser.id},auth_id.eq.${authUser.id},email.eq.${authUser.email}`)
        .limit(1)
        .maybeSingle();

      const referredUserId = referredUser?.id || authUser.id;

      await supabase
        .from('courier_referrals')
        .upsert({
          referrer_user_id: referrerUserId,
          referred_user_id: referredUserId,
          referral_code: normalizedCode,
          joined_via_link: true,
          registration_completed: true,
          onboarding_completed: false,
          updated_at: nowIso,
        }, { onConflict: 'referred_user_id' });

      // Ensure admin_users row exists for supervisor assignment compatibility
      await supabase
        .from('admin_users')
        .upsert({
          id: authUser.id,
          name: displayName,
          email: authUser.email,
          role: 'delivery_person',
          is_active: true,
        }, { onConflict: 'id' }).catch(() => {});

      // Ensure courier_profiles row exists
      await supabase
        .from('courier_profiles')
        .upsert({
          user_id: referredUserId,
          referral_code: null,
          onboarding_completed: false,
        }, { onConflict: 'user_id' }).catch(() => {});

      clearReferralContext();
    };
    
    // دالة تسجيل الدخول الموحدة - تدعم الموظفين والعملاء
    const handleLogin = async (e) => {
      e?.preventDefault?.();
      setError("");
      setLoading(true);
      try {
        if (!selectedRegion) {
          setError('يرجى اختيار (داخل سوريا / خارج سوريا) أولاً');
          setLoading(false);
          return;
        }

        if (!email || !password) {
          setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
          setLoading(false);
          return;
        }

        if (isReferralFlow) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (error) throw error;

          if (data?.user) {
            await provisionReferredCourier(data.user);
          }

          onSuccess?.();
          return;
        }
        
        // استخدم unifiedLogin الذي يكتشف تلقائياً موظف أو عميل
        const response = await unifiedLogin(email.trim(), password);
        
        if (response?.success) {
          const expMs = response.sessionExpiresAt
            ? (typeof response.sessionExpiresAt === 'number'
              ? response.sessionExpiresAt
              : Date.parse(response.sessionExpiresAt))
            : Date.now() + 24 * 60 * 60 * 1000;

          // حفظ الجلسة
          setOtpSession({
            token: response.sessionToken || 'employee-' + response.user.id,
            email: email.trim(),
            exp: Number.isFinite(expMs) ? expMs : Date.now() + 24 * 60 * 60 * 1000,
            type: response.type,
            role: response.role
          });
          
          // توجيه تلقائي حسب نوع المستخدم
          if (response.type === 'employee') {
            // موظف - وجهه للصفحة المناسبة حسب الدور
            console.log('✅ تسجيل دخول موظف:', response.role);
            if (response.role === 'delivery_person') {
              navigate(createPageUrl('DriverPanel'));
            } else if (response.role === 'supervisor') {
              navigate(createPageUrl('SupervisorPanel'));
            } else if (response.role === 'admin') {
              navigate(createPageUrl('StaffDashboard'));
            }
          } else if (response.type === 'customer') {
            // عميل عادي - استمر الطريق العادي
            console.log('✅ تسجيل دخول عميل');
            localStorage.setItem('sessionToken', response.sessionToken || `customer-${Date.now()}`);
            localStorage.setItem('sessionExpiresAt', String(Number.isFinite(expMs) ? expMs : Date.now() + 24 * 60 * 60 * 1000));
            onSuccess?.();
          }
        } else {
          throw new Error(response?.error || "البريد الإلكتروني أو كلمة المرور غير صحيحة");
        }
      } catch (err) {
        setError(err?.message || "البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } finally {
        setLoading(false);
      }
    };

    // دالة التسجيل (signup)
    const handleSend = async (e) => {
      e?.preventDefault?.();
      setError("");
      setLoading(true);
      try {
        if (!selectedRegion) {
          setError('يرجى اختيار (داخل سوريا / خارج سوريا) أولاً');
          setLoading(false);
          return;
        }

        if (!email || !password) {
          setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
          setLoading(false);
          return;
        }

        // التحقق من صحة البريد الإلكتروني
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          setError("يرجى إدخال بريد إلكتروني صحيح");
          setLoading(false);
          return;
        }

        // التحقق من طول كلمة المرور
        if (password.length < 6) {
          setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
          setLoading(false);
          return;
        }

        if (isReferralFlow) {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                role: 'courier',
                name: email.trim().split('@')[0],
              },
            },
          });

          if (error) throw error;

          if (data?.user) {
            await provisionReferredCourier(data.user);
          }

          if (data?.session) {
            onSuccess?.();
            return;
          }

          setError('تم إنشاء الحساب. تحقق من بريدك ثم سجّل الدخول.');
          setMode('login');
          setStep('auth');
          return;
        }

        const response = await signup(email.trim(), password);
        if (response?.success) {
          setToken(response.token); // حفظ التوكن للتحقق لاحقاً
          // حفظ بيانات التسجيل في localStorage للحفاظ عليها عند إعادة التحميل
          localStorage.setItem('wasel_signup', JSON.stringify({
            email: email.trim(),
            password: password,
            token: response.token
          }));
          setStep('verify');
        } else {
          throw new Error(response?.error || "حدث خطأ أثناء التسجيل");
        }
      } catch (err) {
        setError(err?.message || "حدث خطأ أثناء التسجيل");
      } finally {
        setLoading(false);
      }
    };

    // دالة التحقق من OTP
    const handleVerify = async (e) => {
      e?.preventDefault?.();
      setError("");
      setLoading(true);
      try {
        // التحقق من اكتمال البيانات
        if (!email || !code || !token) {
          setError("بيانات غير مكتملة، يرجى المحاولة مرة أخرى");
          setLoading(false);
          return;
        }

        if (code.length < 6) {
          setError("يرجى إدخال رمز التحقق كاملاً");
          setLoading(false);
          return;
        }

        const response = await confirmSignup(email.trim(), code, token, password);
        if (response?.success && response?.sessionToken) {
          setOtpSession({
            token: response.sessionToken,
            email: email.trim(),
            exp: response.sessionExpiresAt
          });
          // Initialize push notifications after successful signup
          try {
            await initPushNotifications();
          } catch (pushError) {
            console.warn('Failed to initialize push notifications:', pushError);
          }
          // Add welcome notification
          addNotification({
            title: 'مرحباً بك في واصل ستور!',
            message: 'تم تسجيل حسابك بنجاح. استمتع بتجربة التسوق السهلة!',
            type: 'success'
          });
          localStorage.removeItem('wasel_signup');
          onSuccess?.();
        } else if (response?.success) {
          // Fallback: بعض البيئات تؤكد OTP بدون إرجاع sessionToken مباشرة
          const loginResult = await login(email.trim(), password);
          if (loginResult?.success && loginResult?.sessionToken) {
            setOtpSession({
              token: loginResult.sessionToken,
              email: email.trim(),
              exp: loginResult.sessionExpiresAt
            });
            localStorage.removeItem('wasel_signup');
            onSuccess?.();
          } else {
            throw new Error('تم التحقق من الرمز لكن فشل إنشاء الجلسة. حاول تسجيل الدخول الآن.');
          }
        } else {
          throw new Error(response?.error || "رمز التحقق غير صحيح");
        }
      } catch (err) {
        setError(err?.message || "رمز التحقق غير صحيح");
      } finally {
        setLoading(false);
      }
    };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [mode, setMode] = useState('signup'); // 'signup' | 'login' | 'forgot'
  const [step, setStep] = useState('auth'); // 'auth' | 'verify'
  const [error, setError] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(null);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const refFromUrl = (url.searchParams.get('ref') || url.searchParams.get('referral') || '').trim().toUpperCase();
      const joinAs = (url.searchParams.get('join') || '').trim().toLowerCase();
      const storedReferralCode = (localStorage.getItem('wasel_referral_code') || '').trim().toUpperCase();
      const effectiveReferralCode = refFromUrl || storedReferralCode;
      const lockedRegionValue = localStorage.getItem('wasel_auth_region_locked');
      const shouldLockRegion = lockedRegionValue === '1' || lockedRegionValue === 'outside_syria' || lockedRegionValue === 'inside_syria' || Boolean(refFromUrl);

      if (effectiveReferralCode && (joinAs === 'courier' || joinAs === '' || refFromUrl)) {
        setReferralCode(effectiveReferralCode);
        setRegionLocked(true);
        setMode('signup');
        setSelectedRegion('inside_syria');
        setUserRegion('inside_syria');
        localStorage.setItem('wasel_referral_code', effectiveReferralCode);
        localStorage.setItem('wasel_auth_region_locked', '1');
        localStorage.setItem('wasel_auth_preferred_mode', 'signup');
        localStorage.setItem('wasel_post_login_redirect', createPageUrl('DriverPanel'));
      } else if (shouldLockRegion) {
        setRegionLocked(true);
        if (lockedRegionValue === 'outside_syria') {
          setSelectedRegion('outside_syria');
          setUserRegion('outside_syria');
        } else if (lockedRegionValue === 'inside_syria' || lockedRegionValue === '1') {
          setSelectedRegion('inside_syria');
          setUserRegion('inside_syria');
        }
      }

      const preferredMode = localStorage.getItem('wasel_auth_preferred_mode');
      if (!effectiveReferralCode && (preferredMode === 'signup' || preferredMode === 'login')) {
        setMode(preferredMode);
        localStorage.removeItem('wasel_auth_preferred_mode');
      }

      const preferredRegion = localStorage.getItem('wasel_auth_preferred_region');
      if (preferredRegion === 'inside_syria' || preferredRegion === 'outside_syria') {
        setSelectedRegion(preferredRegion);
        setUserRegion(preferredRegion);
        if (!regionLocked) {
          localStorage.removeItem('wasel_auth_preferred_region');
        }
      }
    } catch {
      // noop
    }
  }, [regionLocked]);

  const handleRegionChange = (region) => {
    if (regionLocked && region !== selectedRegion) {
      if (selectedRegion === 'outside_syria') {
        setError('هذا الرابط مخصص للدفع من خارج سوريا ولا يمكن تغيير المنطقة.');
      } else {
        setError('هذا الرابط مخصص للموصلين داخل سوريا ولا يمكن تغيير المنطقة.');
      }
      return;
    }

    const ok = setUserRegion(region);
    if (ok) {
      setSelectedRegion(region);
      setError('');
    }
  };

  // فحص الجلسة عند تحميل الصفحة (مرة واحدة فقط)
  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const checkSession = async () => {
      try {
        console.log('WASEL_DEBUG: checkSession START');

        console.log('WASEL_DEBUG: Creating timeout promise...');
        // Timeout قصير لواجهة أسرع
        timeoutId = setTimeout(() => {
          if (isMounted) setCheckingSession(false);
        }, 1200);

        // فحص الجلسة من localStorage أو API
        const session = getOtpSession();
        if (session && session.token && Number(session.exp) > Date.now()) {
          // الجلسة صالحة
          console.log('WASEL_DEBUG: Valid session found');
          if (isMounted) {
            setCheckingSession(false);
            onSuccess?.();
          }
          return;
        }

        // فحص بيانات التسجيل المحفوظة
        const savedSignup = localStorage.getItem('wasel_signup');
        if (savedSignup) {
          try {
            const data = JSON.parse(savedSignup);
            if (data.email && data.token && data.password) {
              setEmail(data.email);
              setPassword(data.password);
              setToken(data.token);
              setStep('verify');
            }
          } catch (e) {
            localStorage.removeItem('wasel_signup');
          }
        }

        // لا توجد جلسة صالحة
        console.log('WASEL_DEBUG: No valid session');
        if (isMounted) {
          setCheckingSession(false);
        }

      } catch (err) {
        console.error('Session check error:', err);
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [onSuccess]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        if (isReferralFlow) {
          provisionReferredCourier(session.user).catch((error) => {
            console.warn('Referral provisioning warning:', error);
          });
        }
        onSuccess?.();
      }
    });

    return () => subscription?.unsubscribe();
  }, [onSuccess]);

  const bgGradient = "bg-gradient-to-br from-[#1F7A63] to-[#2FA36B]";

  // عرض شاشة التحميل عند أول دخول
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAF8]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#1F7A63] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#1F2933] font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Show animated signup card
  if (step === 'auth' && mode === 'signup') {
    return (
      <AnimatedLoginCard
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        onSubmit={handleSend}
        loading={loading}
        error={error}
        onLoginClick={() => setMode('login')}
        selectedRegion={selectedRegion}
        onRegionChange={handleRegionChange}
        regionLocked={regionLocked}
        referralCode={referralCode}
        language="ar"
      />
    );
  }

  // Show login card
  if (step === 'auth' && mode === 'login') {
    return (
      <LoginCard
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        onSubmit={handleLogin}
        loading={loading}
        error={error}
        onSignupClick={() => setMode('signup')}
        selectedRegion={selectedRegion}
        onRegionChange={handleRegionChange}
        onForgotPassword={() => {
          setMode('forgot');
          setStep('auth');
        }}
        language="ar"
        regionLocked={regionLocked}
        referralCode={referralCode}
      />
    );
  }

  // Show OTP verification step
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#F9FAF8] via-[#E5E7EB] to-[#F9FAF8] py-6">
      
      {/* Decorative Circles */}
      <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-[#1F7A63]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
      <div className="absolute bottom-[-100px] left-[-100px] w-64 h-64 bg-[#2FA36B]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm px-6 relative z-10"
      >
        {/* Card Container */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-[#E5E7EB]">
          
          {/* Top Section - Mascot */}
          <div className="relative bg-gradient-to-br from-[#F9FAF8] to-[#E5E7EB] pt-8 pb-6 px-6">
            {/* Decorative circles */}
            <div className="absolute top-2 left-2 w-16 h-16 bg-[#1F7A63]/10 rounded-full blur-xl" />
            <div className="absolute bottom-2 right-2 w-24 h-24 bg-[#2FA36B]/10 rounded-full blur-2xl" />
            
            {/* Mascot Image - Smaller version */}
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              className="relative z-10 flex justify-center mb-4"
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-[#1F7A63]/30 rounded-full blur-lg scale-110" />
                
                {/* Character image */}
                <img
                  src="/wasel-mascot.png"
                  alt="Wasel Character"
                  className="relative w-32 h-32 object-contain drop-shadow-2xl"
                  loading="eager"
                />
              </div>
            </motion.div>

            {/* Title */}
            <div className="relative z-10 text-center">
              <h1 className="text-3xl font-bold text-[#1F2933] drop-shadow-lg">
                واصل ستور || Wasel Store
              </h1>
              <p className="text-[#1F7A63] text-sm mt-1">
                {email}
              </p>
            </div>
          </div>

          {/* Bottom Section - OTP Form */}
          <div className="p-6 bg-white">
            <h2 className="text-xl font-bold text-[#1F2933] mb-2 text-center">
              رمز التحقق
            </h2>
            <p className="text-sm text-[#1F7A63]/70 mb-6 text-center">
              {mode === 'forgot' 
                ? 'أدخل الرمز لإعادة تعيين كلمة المرور'
                : 'أدخل الرمز المرسل إلى بريدك الإلكتروني'
              }
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              {/* OTP Input - حقل واحد للرمز لتحسين التوافق مع الهواتف */}
              <div className="flex justify-center" dir="ltr">
                <input
                  id="otp-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setCode(value);
                  }}
                  className="w-full max-w-xs h-14 text-center text-2xl font-bold border-2 border-[#E5E7EB] rounded-xl text-[#1F2933] bg-[#F9FAF8] focus:border-[#1F7A63] focus:ring-2 focus:ring-[#1F7A63]/20 focus:outline-none transition-all"
                  placeholder="000000"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full h-14 bg-gradient-to-r from-[#1F7A63] to-[#2FA36B] hover:from-[#2FA36B] hover:to-[#1F7A63] text-white rounded-xl text-lg font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>تحقق</span>
                    <ArrowRight className="w-5 h-5 mr-2" />
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep('auth');
                  setCode('');
                  setError('');
                  // مسح بيانات التسجيل عند العودة
                  localStorage.removeItem('wasel_signup');
                }}
                className="w-full text-[#1F2933]/60 text-sm hover:text-[#1F7A63] transition-colors"
              >
                ← العودة {mode === 'signup' ? 'للتسجيل' : 'لتسجيل الدخول'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6 text-sm text-[#1F2933]"
        >
          نوصل حبك لحد الباب 💚
        </motion.p>
      </motion.div>
    </div>
  );
}
