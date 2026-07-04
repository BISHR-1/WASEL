// =====================================================
// WASEL — بوابة المصادقة الهجينة
// ملف: src/components/auth/HybridAuthGate.jsx
// =====================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Zap, Shield, Clock, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// =====================================================
// زر جوجل SVG
// =====================================================
function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// =====================================================
// مزايا الحساب
// =====================================================
const ACCOUNT_PERKS = [
  { icon: Clock, text: 'حفظ عناوين التسليم تلقائياً' },
  { icon: Star, text: 'متابعة جميع طلباتك السابقة' },
  { icon: Shield, text: 'محفظة رقمية آمنة لمدفوعاتك' },
];

// =====================================================
// المكوّن الرئيسي
// =====================================================
export default function HybridAuthGate({ isOpen, onClose, onGuestContinue, onAuthSuccess, redirectAfter }) {
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectAfter || window.location.href,
        },
      });
      if (authError) throw authError;
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('تعذّر تسجيل الدخول بجوجل حالياً. حاول مرة أخرى.');
      setIsLoadingGoogle(false);
    }
  };

  const handleGuestContinue = () => {
    // حفظ هوية الضيف
    try { localStorage.setItem('wasel_active_identity', 'guest'); } catch (_) {}
    window.dispatchEvent(new Event('wasel_identity_changed'));
    onGuestContinue?.();
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* طبقة التعتيم */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
          />

          {/* بطاقة البوابة */}
          <motion.div
            key="gate"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-0 flex items-end sm:items-center justify-center z-[101] p-4"
          >
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">

              {/* رأس البطاقة */}
              <div className="relative p-6 pb-4" style={{ background: 'linear-gradient(135deg, #0B2545 0%, #134074 100%)' }}>
                <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="text-center" dir="rtl">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 mx-auto flex items-center justify-center mb-3">
                    <span className="text-3xl">🎁</span>
                  </div>
                  <h2 className="text-white font-black text-xl mb-1">أكمل طلبك بسهولة</h2>
                  <p className="text-white/70 text-sm">اختر كيف تريد المتابعة</p>
                </div>
              </div>

              {/* محتوى البطاقة */}
              <div className="p-5 space-y-4" dir="rtl">

                {/* الخطأ إن وجد */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm text-center"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ===== خيار الضيف (رئيسي) ===== */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGuestContinue}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-[#0B2545] text-right group transition-all hover:bg-[#EEF4F8]"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                    style={{ background: 'linear-gradient(135deg, #0B2545, #134074)' }}
                  >
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-[#0B2545] text-base">استمر كضيف سريع</p>
                    <p className="text-gray-400 text-xs mt-0.5">بدون تسجيل — ادفع وتابع فوراً</p>
                  </div>
                  <Zap className="w-5 h-5 text-[#FF7F11] shrink-0" />
                </motion.button>

                {/* فاصل */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-gray-400 text-xs font-medium">أو</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* ===== خيار جوجل (ثانوي) ===== */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleSignIn}
                  disabled={isLoadingGoogle}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-200 text-right group transition-all hover:border-[#4285F4]/40 hover:bg-blue-50/50 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center shrink-0">
                    {isLoadingGoogle ? (
                      <div className="w-5 h-5 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-[#1A202C] text-base">دخول سريع بلمسة واحدة</p>
                    <p className="text-gray-400 text-xs mt-0.5">عبر حسابك في جوجل — لحفظ طلباتك وعناوينك</p>
                  </div>
                  <Shield className="w-5 h-5 text-[#4285F4] shrink-0" />
                </motion.button>

                {/* مزايا الحساب */}
                <div className="bg-[#F8F9FA] rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-500 text-center">مزايا تسجيل الحساب</p>
                  {ACCOUNT_PERKS.map((perk, i) => {
                    const Icon = perk.icon;
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        <Icon className="w-3.5 h-3.5 text-[#FF7F11] shrink-0" />
                        <span className="text-xs text-gray-600">{perk.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* تنبيه الخصوصية */}
                <p className="text-center text-[10px] text-gray-400">
                  بالمتابعة تقبل{' '}
                  <a href="/TermsAndConditions" className="text-[#0B2545] underline">الشروط والأحكام</a>
                  {' '}و{' '}
                  <a href="/PrivacyPolicy" className="text-[#0B2545] underline">سياسة الخصوصية</a>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// =====================================================
// مكوّن دعوة إنشاء حساب في صفحة نجاح الطلب
// =====================================================
export function PostOrderAccountInvite({ guestEmail, onDismiss }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleGoogleLink = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href },
      });
      if (error) throw error;
      setIsDone(true);
    } catch (err) {
      console.error('Link error:', err);
      setIsLoading(false);
    }
  };

  if (isDone) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 text-center border-2 border-[#FECDAA] relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #FFF0E5, #FFFAF7)' }}
      dir="rtl"
    >
      {onDismiss && (
        <button onClick={onDismiss} className="absolute top-3 left-3 text-gray-300 hover:text-gray-500">
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="text-3xl mb-3">🏆</div>
      <h3 className="font-black text-[#0B2545] text-lg mb-1">وفّر وقتك في الطلبات القادمة!</h3>
      <p className="text-[#E16200] text-sm mb-4">
        نقرة واحدة لحفظ معلوماتك وربط بريدك بحساب جوجل تلقائياً
      </p>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGoogleLink}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-xl bg-white border-2 border-gray-200 font-bold text-[#1A202C] hover:border-[#4285F4]/40 hover:bg-blue-50/50 transition-all disabled:opacity-60"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        <span>ربط الحساب بجوجل مجاناً</span>
      </motion.button>
    </motion.div>
  );
}
