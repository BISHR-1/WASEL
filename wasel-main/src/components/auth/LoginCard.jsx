import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';

export default function LoginCard({ 
  email, 
  setEmail,
  password,
  setPassword, 
  onSubmit, 
  loading,
  error,
  onSignupClick,
  onForgotPassword,
  selectedRegion,
  onRegionChange,
  regionLocked = false,
  referralCode = '',
  language = 'ar' 
}) {
  const [showPassword, setShowPassword] = useState(false);

  const regionSelected = Boolean(selectedRegion);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAF8] via-[#E5E7EB] to-[#F9FAF8] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Wasel Mascot Card */}
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-[#E5E7EB]">
          
          {/* Top Section - Mascot */}
          <div className="relative bg-gradient-to-br from-[#F9FAF8] to-[#E5E7EB] pt-12 pb-8 px-8">
            {/* Decorative circles */}
            <div className="absolute top-4 left-4 w-20 h-20 bg-[#1F7A63]/20 rounded-full blur-2xl" />
            <div className="absolute bottom-4 right-4 w-32 h-32 bg-[#2FA36B]/20 rounded-full blur-3xl" />
            
            {/* Mascot Image */}
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ 
                delay: 0.2,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              className="relative z-10 flex justify-center mb-4"
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-[#1F7A63]/30 rounded-full blur-xl scale-110" />
                
                {/* Character image */}
                <img
                  src="/wasel-mascot.png"
                  alt="Wasel Character"
                  className="relative w-48 h-48 object-contain drop-shadow-2xl"
                  loading="eager"
                />
              </div>
            </motion.div>

            {/* Brand Text */}
            <div className="relative z-10 text-center space-y-2">
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-5xl font-bold text-[#1F2933] tracking-wider drop-shadow-lg"
              >
                واصل || Wasel
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-[#1F7A63] text-lg font-medium"
              >
                {language === 'ar' ? 'نوصل حبك لحد الباب 💚' : 'Delivering love to your doorstep 💚'}
              </motion.p>
            </div>
          </div>

          {/* Bottom Section - Form */}
          <div className="p-8 bg-white">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-2xl font-bold text-[#1F2933] mb-2 text-center">
                {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
              </h3>
              <p className="text-sm text-[#1F7A63]/70 mb-6 text-center">
                {language === 'ar' ? 'مرحباً بعودتك!' : 'Welcome back!'}
              </p>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              {/* Social Login */}
              <div className="mb-4" dir="rtl">
                <p className="text-sm text-[#1F2933] font-semibold mb-2">اختر موقعك قبل المتابعة</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onRegionChange?.('outside_syria')}
                    disabled={regionLocked}
                    className={`rounded-xl border-2 px-3 py-2 text-sm font-bold transition ${selectedRegion === 'outside_syria' ? 'border-[#1F7A63] bg-[#ECFDF5] text-[#1F7A63]' : 'border-[#E5E7EB] text-[#374151]'}`}
                  >
                    أنا خارج سوريا
                  </button>
                  <button
                    type="button"
                    onClick={() => onRegionChange?.('inside_syria')}
                    disabled={regionLocked && selectedRegion !== 'inside_syria'}
                    className={`rounded-xl border-2 px-3 py-2 text-sm font-bold transition ${selectedRegion === 'inside_syria' ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]' : 'border-[#E5E7EB] text-[#374151]'}`}
                  >
                    أنا داخل سوريا
                  </button>
                </div>
                {regionLocked && (
                  <p className="text-[11px] text-[#0F766E] mt-2">
                    {selectedRegion === 'outside_syria'
                      ? 'تم قفل المنطقة على "خارج سوريا" لهذا الرابط ولا يمكن تغييرها.'
                      : `تم قفل المنطقة على "داخل سوريا"${referralCode ? ` عبر رمز الإحالة (${referralCode})` : ''}.`}
                  </p>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <GoogleSignInButton disabled={!regionSelected} />
                <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                  <div className="flex-1 h-px bg-[#E5E7EB]" />
                  <span>{language === 'ar' ? 'أو' : 'or'}</span>
                  <div className="flex-1 h-px bg-[#E5E7EB]" />
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={onSubmit} className="space-y-4">
                {/* Email Input */}
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1F7A63]" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    className="w-full pr-12 bg-[#F9FAF8] border-2 border-[#E5E7EB] h-14 text-lg rounded-xl focus:ring-2 focus:ring-[#1F7A63] focus:border-[#1F7A63] transition-all text-[#1F2933] placeholder:text-[#1F7A63]/60"
                    required
                    disabled={loading}
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1F7A63]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={language === 'ar' ? 'كلمة المرور' : 'Password'}
                    className="w-full pr-12 pl-12 bg-[#F9FAF8] border-2 border-[#E5E7EB] h-14 text-lg rounded-xl focus:ring-2 focus:ring-[#1F7A63] focus:border-[#1F7A63] transition-all text-[#1F2933] placeholder:text-[#1F7A63]/60"
                    required
                    disabled={loading}
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1F7A63] hover:text-[#1F2933]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Forgot Password */}
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-sm text-[#1F7A63] hover:text-[#2FA36B] transition-colors"
                >
                  {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </button>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading || !regionSelected}
                  className="w-full h-14 bg-gradient-to-r from-[#1F7A63] to-[#2FA36B] hover:from-[#2FA36B] hover:to-[#1F7A63] text-white rounded-xl text-lg font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {language === 'ar' ? 'دخول' : 'Login'}
                      <ArrowRight className={`w-5 h-5 ${language === 'ar' ? 'mr-2' : 'ml-2'}`} />
                    </>
                  )}
                </Button>

                {/* Signup Link */}
                <button
                  type="button"
                  onClick={onSignupClick}
                  className="w-full text-sm text-[#1F2933] hover:text-[#1F7A63] transition-colors py-2 font-medium"
                >
                  {language === 'ar' ? 'ليس لديك حساب؟ سجل الآن' : 'Don\'t have an account? Sign up'}
                </button>
              </form>
            </motion.div>
          </div>
        </div>

        {/* Footer Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-6 text-sm text-[#1F2933]"
        >
          {language === 'ar' ? 'معك بكل خطوة 🚀' : 'With you every step 🚀'}
        </motion.p>
      </motion.div>
    </div>
  );
}
