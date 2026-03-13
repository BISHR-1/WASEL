/**
 * Staff Login/Register Page
 * صفحة تسجيل الدخول والتسجيل للمشرفين والموصلين والموردين
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  LogIn,
  UserPlus,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Truck,
  Package,
  Users
} from 'lucide-react';
import { 
  registerAdminUser, 
  loginAdminUser, 
  ADMIN_ROLES 
} from '@/utils/adminAuth';
import { createPageUrl } from '@/utils';

export default function StaffLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('role'); // start by choosing a role
  const [selectedRole, setSelectedRole] = useState(null);
  const [referralCode, setReferralCode] = useState(null);

  // roles that can be chosen on the first screen
  const roles = [
    {
      id: ADMIN_ROLES.DELIVERY_PERSON,
      name_ar: 'موصل',
      description: 'استقبل الطلبات ونقلها',
      icon: <Truck className="w-6 h-6" />
    },
    {
      id: ADMIN_ROLES.SUPPLIER,
      name_ar: 'مورد',
      description: 'أضف منتجاتك وقم بإدارة مخزونك',
      icon: <Package className="w-6 h-6" />
    },
    {
      id: ADMIN_ROLES.SUPERVISOR,
      name_ar: 'مشرف',
      description: 'تنظيم الطلبات ومراقبة الموصلين',
      icon: <Users className="w-6 h-6" />
    }
  ];
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const ref = params.get('ref') || params.get('referral') || '';
    const joinAs = params.get('join') || '';
    if (!ref) return;

    const normalizedRef = ref.trim().toUpperCase();
    if (!normalizedRef) return;

    setReferralCode(normalizedRef);
    setSelectedRole(ADMIN_ROLES.DELIVERY_PERSON);
    setMode('register');

    // Keep referral context for linked signup flow and enforce inside Syria on public auth forms.
    try {
      localStorage.setItem('wasel_referral_code', normalizedRef);
      localStorage.setItem('wasel_auth_preferred_region', 'inside_syria');
      localStorage.setItem('wasel_auth_region_locked', '1');
      if (joinAs === 'courier' || !joinAs) {
        localStorage.setItem('wasel_auth_preferred_mode', 'signup');
      }
    } catch {
      // noop
    }
  }, [location.search]);

  // other helpers
  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setMode('login');
  };

  // Register state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Login state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // no role selection for public registration – only delivery_person allowed
  // supervisors/admins can add other accounts via AdminPanel (backend validation enforces this)

  // ============================================================
  // REGISTRATION
  // ============================================================

  const handleRegisterChange = (field, value) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateRegisterForm = () => {
    const newErrors = {};

    if (!registerData.name.trim()) {
      newErrors.name = 'الاسم مطلوب';
    }

    if (!registerData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    if (!registerData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (registerData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    if (!registerData.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!validateRegisterForm()) {
      toast.error('يرجى ملء جميع الحقول بشكل صحيح');
      return;
    }

    const effectiveRole = referralCode ? ADMIN_ROLES.DELIVERY_PERSON : selectedRole;

    // supervisors are not allowed to self-create - they must be added by المدير
    if (effectiveRole === ADMIN_ROLES.SUPERVISOR) {
      toast.error('لا يمكنك إنشاء حساب مشرف. الرجاء التواصل مع المدير.');
      return;
    }

    setIsLoading(true);
    try {
      await registerAdminUser({
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        role: effectiveRole || ADMIN_ROLES.DELIVERY_PERSON,
        referralCode,
      });

      toast.success('تم إنشاء الحساب بنجاح! 🎉');
      // after creating, send them back to login so they can authenticate
      setMode('login');
      setRegisterData({ name: '', email: '', password: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.message || 'حدث خطأ في التسجيل');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // LOGIN
  // ============================================================

  const handleLoginChange = (field, value) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateLoginForm = () => {
    const newErrors = {};

    if (!loginData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    }

    if (!loginData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!validateLoginForm()) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginAdminUser(loginData.email, loginData.password);
      toast.success(`مرحبا ${result.user.name}! 👋`);

      // redirect based on actual role returned from server
      const userRole = result.user.role;
      if (userRole === ADMIN_ROLES.DELIVERY_PERSON) {
        navigate(createPageUrl('DriverPanel'));
      } else if (userRole === ADMIN_ROLES.SUPERVISOR) {
        navigate(createPageUrl('SupervisorPanel'));
      } else if (userRole === ADMIN_ROLES.ADMIN) {
        navigate(createPageUrl('StaffDashboard')); // manager page
      } else {
        // fallback to dashboard
        navigate(createPageUrl('StaffDashboard'));
      }
    } catch (error) {
      toast.error(error.message || 'البريد الإلكتروني أو كلمة المرور غير صحيح');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo/Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">واصل ستور</h1>
          </div>
          <p className="text-purple-300 text-sm">لوحة تحكم المشرفين والموصلين</p>
        </motion.div>

        {/* ROLE SELECTION MODE */}
        {mode === 'role' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="role-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <p className="text-center text-white mb-6" dir="rtl">
                اختر دورك لكي تبدأ
              </p>

              {roles.map((role, index) => (
                <motion.button
                  key={role.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, translateX: 10 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect(role.id)}
                  className="w-full p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:border-white/30 transition-all"
                >
                  <div className="flex items-center gap-4" dir="rtl">
                    <span className="text-3xl">{role.icon}</span>
                    <div className="flex-1 text-right">
                      <p className="font-bold text-white">{role.name_ar}</p>
                      <p className="text-xs text-purple-200">{role.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-purple-400" />
                  </div>
                </motion.button>
              ))}

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode('login')}
                className="w-full mt-6 p-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-purple-100 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                لديك حساب؟ تسجيل دخول
              </motion.button>
            </motion.div>
          </AnimatePresence>
        )}

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="login-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => {
                    setMode('role');
                    setSelectedRole(null);
                    setLoginData({ email: '', password: '' });
                    setErrors({});
                  }}
                  className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors text-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                  الرجوع لاختيار الدور
                </button>

                <p className="text-center text-white mb-2">
                  تسجيل دخول {selectedRole ? roles.find(r=>r.id===selectedRole).name_ar : ''}
                </p>

                {/* Email Input */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2" dir="rtl">
                    البريد الإلكتروني *
                  </label>
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => handleLoginChange('email', e.target.value)}
                    placeholder="admin@wasel.com"
                    className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400 transition-all ${
                      errors.email ? 'border-red-500' : 'border-white/20'
                    }`}
                    dir="ltr"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2" dir="rtl">
                    كلمة المرور *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={(e) => handleLoginChange('password', e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400 transition-all ${
                        errors.password ? 'border-red-500' : 'border-white/20'
                      }`}
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/70"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري الدخول...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      تسجيل الدخول
                    </>
                  )}
                </motion.button>

                {/* Create Account Link */}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrors({});
                  }}
                  className="w-full py-2 text-purple-300 hover:text-purple-200 transition-colors text-sm font-medium"
                >
                  لا تملك حساب؟ أنشئ واحد الآن
                </button>
              </form>
            </motion.div>
          </AnimatePresence>
        )}

        {/* REGISTER MODE */}
        {mode === 'register' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="register-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* Back to role selection */}
                <button
                  type="button"
                  onClick={() => {
                    setMode('role');
                    setSelectedRole(null);
                    setRegisterData({ name: '', email: '', password: '', confirmPassword: '' });
                    setErrors({});
                  }}
                  className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors text-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                  الرجوع لاختيار الدور
                </button>

                <p className="text-center text-white mb-2">
                  إنشاء حساب {selectedRole ? roles.find(r => r.id === selectedRole).name_ar : ''}
                </p>
                {referralCode && (
                  <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 p-3 text-right" dir="rtl">
                    <p className="text-emerald-200 text-sm font-bold">تم فتح رابط إحالة موصل</p>
                    <p className="text-emerald-100/90 text-xs mt-1">سيتم إنشاء الحساب كموصل تلقائيًا وداخل سوريا (رمز: {referralCode})</p>
                  </div>
                )}
                {selectedRole === ADMIN_ROLES.SUPERVISOR && (
                  <p className="text-center text-red-400 mb-4 text-sm">
                    لا يمكن إنشاء حساب مشرف هنا. الرجاء التواصل مع المدير.
                  </p>
                )}

                {/* Name Input */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2" dir="rtl">
                    الاسم الكريم *
                  </label>
                  <input
                    type="text"
                    value={registerData.name}
                    onChange={(e) => handleRegisterChange('name', e.target.value)}
                    placeholder="محمد علي"
                    className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400 transition-all ${
                      errors.name ? 'border-red-500' : 'border-white/20'
                    }`}
                    dir="rtl"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2" dir="rtl">
                    البريد الإلكتروني *
                  </label>
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => handleRegisterChange('email', e.target.value)}
                    placeholder="admin@wasel.com"
                    className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400 transition-all ${
                      errors.email ? 'border-red-500' : 'border-white/20'
                    }`}
                    dir="ltr"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2" dir="rtl">
                    كلمة المرور *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={registerData.password}
                      onChange={(e) => handleRegisterChange('password', e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400 transition-all ${
                        errors.password ? 'border-red-500' : 'border-white/20'
                      }`}
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/70"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2" dir="rtl">
                    تأكيد كلمة المرور *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.confirmPassword}
                    onChange={(e) => handleRegisterChange('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400 transition-all ${
                      errors.confirmPassword ? 'border-red-500' : 'border-white/20'
                    }`}
                    dir="ltr"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Security Note */}
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2" dir="rtl">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <p className="text-xs text-green-300">بيانات آمنة ومشفرة 🔒</p>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      إنشاء حساب
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </AnimatePresence>
        )}
        {/* LOGIN MODE */}
        {mode === 'login' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="login-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => {
                    setMode('role');
                    setLoginData({ email: '', password: '' });
                    setErrors({});
                  }}
                  className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors text-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                  العودة
                </button>

                {/* Email Input */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2" dir="rtl">
                    البريد الإلكتروني *
                  </label>
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => handleLoginChange('email', e.target.value)}
                    placeholder="admin@wasel.com"
                    className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400 transition-all ${
                      errors.email ? 'border-red-500' : 'border-white/20'
                    }`}
                    dir="ltr"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2" dir="rtl">
                    كلمة المرور *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={(e) => handleLoginChange('password', e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400 transition-all ${
                        errors.password ? 'border-red-500' : 'border-white/20'
                      }`}
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/70"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري الدخول...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      تسجيل الدخول
                    </>
                  )}
                </motion.button>

                {/* Create Account Link */}
                <button
                  type="button"
                  onClick={() => {
                    setMode('role');
                    setLoginData({ email: '', password: '' });
                    setErrors({});
                  }}
                  className="w-full py-2 text-purple-300 hover:text-purple-200 transition-colors text-sm font-medium"
                >
                  لا تملك حساب؟ أنشئ واحد الآن
                </button>
              </form>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
