import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import {
  Home,
  Grid,
  User,
  ShoppingBag,
  Wallet,
  MapPin,
  Bell,
  ChevronDown,
  Crown,
  Sparkles,
  ClipboardList,
  LogIn,
  LayoutGrid,
} from 'lucide-react';
import SupportChat from './components/common/SupportChat';
import AppFooter from '@/components/common/AppFooter';
import SearchBar from './components/SearchBar';
import AndroidSmartBanner from './components/common/AndroidSmartBanner';
import NotificationPermissionPrompt from './components/common/NotificationPermissionPrompt';
import CameraPermissionPrompt from './components/common/CameraPermissionPrompt';
import { CartProvider, useCart } from './components/cart/CartContext.jsx';
import { LanguageProvider, useLanguage } from './components/common/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getUnreadCount } from './lib/inAppNotifications';
import { getSelectedAddress } from './utils/senderReceiverStorage';
import { useDarkMode } from './lib/DarkModeContext';
import SmartLottie from '@/components/animations/SmartLottie';
import { ANIMATION_PRESETS } from '@/components/animations/animationPresets';

function LayoutContent({ children, currentPageName }) {
  const languageContext = useLanguage?.() || { language: 'ar', changeLanguage: () => {}, t: (key) => key, dir: 'rtl' };
  const { language, changeLanguage, t, dir } = languageContext;
  const { cartItems = [] } = useCart?.() || {};
  const [user, setUser] = useState(null);
  const [isWaselPlusMember, setIsWaselPlusMember] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [deliveryLabel, setDeliveryLabel] = useState('درعا، سوريا');
  const [isGuest, setIsGuest] = useState(() => {
    try {
      const id = localStorage.getItem('wasel_active_identity');
      return !id || id === 'guest';
    } catch { return true; }
  });
  
  // --- سلوك إخفاء الشريط السفلي عند التمرير ---
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 50) { setNavVisible(true); return; }
      if (currentY < lastScrollY.current) {
        setNavVisible(true);
      } else if (currentY > lastScrollY.current + 8) {
        setNavVisible(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLanguageToggle = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    if (typeof changeLanguage === 'function') {
      changeLanguage(newLang);
    }
  };

  const totalItems = Array.isArray(cartItems) ? cartItems.reduce((sum, item) => sum + (Math.max(0, item?.quantity || 1)), 0) : 0;
  const location = useLocation();

  useEffect(() => {
    const checkGuest = () => {
      const id = localStorage.getItem('wasel_active_identity');
      setIsGuest(!id || id === 'guest');
    };
    checkGuest();
    window.addEventListener('wasel_identity_changed', checkGuest);
    return () => window.removeEventListener('wasel_identity_changed', checkGuest);
  }, []);

  useEffect(() => {
    const handleAuthRequired = (e) => {
      toast.error(e.detail?.message || 'سجل دخولك أولاً لإكمال الطلب', {
        action: {
          label: language === 'ar' ? 'تسجيل الدخول' : 'Sign In',
          onClick: () => navigate('/Login'),
        },
        duration: 5000,
      });
    };
    window.addEventListener('wasel_auth_required', handleAuthRequired);
    return () => window.removeEventListener('wasel_auth_required', handleAuthRequired);
  }, [navigate, language]);

  const handleGlobalSearch = (query) => {
    navigate(`${createPageUrl('Home')}?search=${encodeURIComponent(query)}`);
  };

  useEffect(() => {
    const updateCount = () => { setUnreadNotifications(getUnreadCount()); };
    updateCount();
    window.addEventListener('wasel_notifications_updated', updateCount);
    window.addEventListener('wasel_notification_added', updateCount);
    return () => {
      window.removeEventListener('wasel_notifications_updated', updateCount);
      window.removeEventListener('wasel_notification_added', updateCount);
    };
  }, []);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        if (!error && authUser) { setUser(authUser); }
        else { setUser(null); }
      } catch (err) {
        console.error('Auth check error:', err?.message || err);
        setUser(null);
      }
    };
    checkAuth();
    try {
      setTimeout(() => {
        if (typeof window !== 'undefined' && 'initEngagingNotifications' in window) {
          window.initEngagingNotifications(language);
        }
      }, 5000);
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }, [language]);

  useEffect(() => {
    const refreshSelectedAddress = () => {
      const selectedAddress = getSelectedAddress();
      const label = selectedAddress?.label || selectedAddress?.street || user?.city || 'درعا، سوريا';
      setDeliveryLabel(label);
    };
    refreshSelectedAddress();
    window.addEventListener('wasel_address_updated', refreshSelectedAddress);
    return () => window.removeEventListener('wasel_address_updated', refreshSelectedAddress);
  }, [user?.city]);

  useEffect(() => {
    const loadMembershipState = async () => {
      if (!user?.email) { setIsWaselPlusMember(false); return; }
      try {
        const { data, error } = await supabase
          .from('wasel_plus_memberships')
          .select('status, end_date, trial_end')
          .eq('user_email', user.email)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error || !data) { setIsWaselPlusMember(false); return; }
        const now = Date.now();
        const activeEnd = data?.status === 'active' && data?.end_date ? Date.parse(data.end_date) : null;
        const trialEnd = data?.status === 'trialing' && data?.trial_end ? Date.parse(data.trial_end) : null;
        const isMember =
          (data.status === 'active' && (!activeEnd || activeEnd > now)) ||
          (data.status === 'trialing' && (!trialEnd || trialEnd > now));
        setIsWaselPlusMember(Boolean(isMember));
      } catch (error) {
        console.error('Failed to load Wasel+ state in header:', error);
        setIsWaselPlusMember(false);
      }
    };
    loadMembershipState();
  }, [user?.email]);

  const { isDarkMode } = useDarkMode();
  const isActive = (path) => location.pathname.includes(path);

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-[#F8F9FA]'} font-cairo`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap');
        :root {
          --brand-navy: #0B2545;
          --brand-orange: #FF7F11;
          --wasel-green: #1F7A63;
          --wasel-cta: #2FA36B;
          --wasel-cream: #F9FAF8;
          --wasel-dark: #1F2933;
        }
        * { -webkit-tap-highlight-color: transparent; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .font-cairo { font-family: 'Cairo', sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ===== الهيدر العلوي ===== */}
      <header className={`w-full ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E8EAED]'} z-50 shadow-sm border-b pt-safe`}>
        <div className="px-3 py-1.5 space-y-1.5">
          {/* شريط العنوان والإجراءات */}
          <div className="flex items-center justify-between mb-1.5">
            <button
              onClick={() => navigate(createPageUrl('MyAddresses'))}
              className="flex items-center gap-1 text-sm text-[#0B2545] truncate max-w-[60%] hover:text-[#FF7F11] transition-colors"
              type="button"
            >
              <MapPin className="w-4 h-4 text-[#FF7F11] shrink-0" />
              <span className="font-bold">التوصيل لـ</span>
              <span className="truncate">{deliveryLabel}</span>
              <ChevronDown className="w-3 h-3 text-[#FF7F11]" />
            </button>
            <div className={`flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <SupportChat inline className="shrink-0" />
              {isGuest ? (
                <button
                  onClick={() => navigate('/Login')}
                  className="text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  style={{ background: 'linear-gradient(135deg, #0B2545, #134074)' }}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  تسجيل الدخول
                </button>
              ) : (
                <button
                  onClick={() => navigate('/Notifications')}
                  className="relative p-2 hover:bg-[#EEF4F8] rounded-lg transition-colors"
                >
                  {unreadNotifications > 0 ? (
                    <div className="relative" style={{ width: '24px', height: '24px' }}>
                      <SmartLottie animationPath={ANIMATION_PRESETS.notificationBell.path} width={24} height={24} trigger="immediate" loop={true} />
                    </div>
                  ) : (
                    <Bell className="w-5 h-5 text-[#0B2545]" />
                  )}
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#FF7F11] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>
              )}
              <button onClick={handleLanguageToggle} className="font-bold text-[10px] uppercase border border-[#E5E7EB] px-2 py-1 rounded bg-[#F9FAF8] text-[#0B2545] hover:bg-[#EEF4F8]">
                {language === 'ar' ? 'EN' : 'AR'}
              </button>
            </div>
          </div>

          {/* بانر Wasel+ أو دعوة التسجيل */}
          {isGuest ? (
            <Link to="/Login" className="block">
              <motion.div
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="rounded-xl px-3 py-2 text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #0B2545 0%, #134074 100%)' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🎁</span>
                    <span className="font-extrabold text-xs" dir="rtl">سجل الآن واحصل على 3 طلبات مجانية</span>
                  </div>
                  <LogIn className="w-4 h-4" />
                </div>
              </motion.div>
            </Link>
          ) : (
            <Link to={createPageUrl('WaselPlusMembership')} className="block">
              <motion.div
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="rounded-xl px-3 py-2 text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #1D4ED8, #0EA5E9, #FF7F11)' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-4 h-4" />
                    <span className="font-extrabold text-xs" dir="rtl">
                      {isWaselPlusMember ? 'أنت مشترك في Wasel+' : 'اشترك بـ Wasel+ ووفر'}
                    </span>
                  </div>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            </Link>
          )}

          {/* شريط البحث */}
          <div className="relative z-[60]">
            <SearchBar
              placeholder="ابحث في الهدايا والمنتجات والطلبات..."
              variant="header"
              language={language}
              dir={dir}
              onSearch={handleGlobalSearch}
            />
          </div>

          {/* بانر العرض الترويجي */}
          <Link to={createPageUrl('Home')} className="block">
            <motion.div
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 1 }}
              transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.8 }}
              className="rounded-xl border border-[#FECDAA] px-2.5 py-1 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #FFF0E5, #FFF7ED)' }}
            >
              <div className="flex items-center justify-between text-[#E16200]">
                <span className="text-[11px] font-black" dir="rtl">🔥 خصم 50% لوقت محدود على منتجات مختارة</span>
                <span className="text-[10px] font-bold">اطلب الآن</span>
              </div>
            </motion.div>
          </Link>
        </div>
      </header>

      {/* ===== المحتوى الرئيسي ===== */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* ===== الفوتر ===== */}
      <AppFooter />

      {/* ===== شريط التنقل السفلي المحسّن — 5 وجهات ===== */}
      <AnimatePresence>
        {navVisible && (
          <motion.nav
            key="bottom-nav"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className={`fixed bottom-0 left-0 right-0 z-50 pb-safe border-t
              ${isDarkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-[#E8EAED]'}
              backdrop-blur-md`}
            style={{ boxShadow: '0 -4px 20px rgba(11, 37, 69, 0.08)' }}
          >
            <div className="flex items-stretch justify-around h-[60px] max-w-lg mx-auto px-1">

              {/* الرئيسية */}
              <Link to={createPageUrl('Home')} className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative group">
                <div className="relative">
                  <Home className={`w-[22px] h-[22px] transition-all duration-200 ${isActive('Home') && !isActive('Supermarket') && !isActive('Electronics') && !isActive('Sweets') && !isActive('Restaurants') && !isActive('Gifts') && !isActive('Packages') && !isActive('Wallet') && !isActive('Cart') && !isActive('Account') && !isActive('MyOrders') ? 'text-[#0B2545] stroke-[2.5]' : isDarkMode ? 'text-gray-500' : 'text-[#9CA3AF]'}`} />
                </div>
                <span className={`text-[10px] leading-none transition-all duration-200 ${isActive('Home') && !isActive('Supermarket') && !isActive('Electronics') && !isActive('Sweets') && !isActive('Restaurants') && !isActive('Gifts') && !isActive('Packages') && !isActive('Wallet') && !isActive('Cart') && !isActive('Account') && !isActive('MyOrders') ? 'font-black text-[#0B2545]' : isDarkMode ? 'font-medium text-gray-500' : 'font-medium text-[#9CA3AF]'}`}>الرئيسية</span>
                {isActive('Home') && !isActive('Supermarket') && !isActive('Electronics') && !isActive('Sweets') && !isActive('Restaurants') && !isActive('Gifts') && !isActive('Packages') && !isActive('Wallet') && !isActive('Cart') && !isActive('Account') && !isActive('MyOrders') && (
                  <motion.div layoutId="nav-dot" className="w-1 h-1 bg-[#FF7F11] rounded-full mt-0.5" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
              </Link>

              {/* الأصناف */}
              <Link to={createPageUrl('Supermarket')} className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative group">
                <LayoutGrid className={`w-[22px] h-[22px] transition-all duration-200 ${isActive('Supermarket') || isActive('Electronics') || isActive('Sweets') || isActive('Restaurants') || isActive('Gifts') || isActive('Packages') ? 'text-[#0B2545] stroke-[2.5]' : isDarkMode ? 'text-gray-500' : 'text-[#9CA3AF]'}`} />
                <span className={`text-[10px] leading-none transition-all duration-200 ${isActive('Supermarket') || isActive('Electronics') || isActive('Sweets') || isActive('Restaurants') || isActive('Gifts') || isActive('Packages') ? 'font-black text-[#0B2545]' : isDarkMode ? 'font-medium text-gray-500' : 'font-medium text-[#9CA3AF]'}`}>الأصناف</span>
                {(isActive('Supermarket') || isActive('Electronics') || isActive('Sweets') || isActive('Restaurants') || isActive('Gifts') || isActive('Packages')) && (
                  <motion.div layoutId="nav-dot" className="w-1 h-1 bg-[#FF7F11] rounded-full mt-0.5" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
              </Link>

              {/* محفظتي */}
              <Link to={createPageUrl('Wallet')} className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative group">
                <Wallet className={`w-[22px] h-[22px] transition-all duration-200 ${isActive('Wallet') ? 'text-[#0B2545] stroke-[2.5]' : isDarkMode ? 'text-gray-500' : 'text-[#9CA3AF]'}`} />
                <span className={`text-[10px] leading-none transition-all duration-200 ${isActive('Wallet') ? 'font-black text-[#0B2545]' : isDarkMode ? 'font-medium text-gray-500' : 'font-medium text-[#9CA3AF]'}`}>محفظتي</span>
                {isActive('Wallet') && (
                  <motion.div layoutId="nav-dot" className="w-1 h-1 bg-[#FF7F11] rounded-full mt-0.5" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
              </Link>

              {/* السلة */}
              <Link to={createPageUrl('Cart')} className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative group">
                <div className="relative">
                  <ShoppingBag className={`w-[22px] h-[22px] transition-all duration-200 ${isActive('Cart') ? 'text-[#0B2545] stroke-[2.5]' : isDarkMode ? 'text-gray-500' : 'text-[#9CA3AF]'}`} />
                  {totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] bg-[#FF7F11] text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5"
                    >
                      {totalItems > 99 ? '99+' : totalItems}
                    </motion.span>
                  )}
                </div>
                <span className={`text-[10px] leading-none transition-all duration-200 ${isActive('Cart') ? 'font-black text-[#0B2545]' : isDarkMode ? 'font-medium text-gray-500' : 'font-medium text-[#9CA3AF]'}`}>السلة</span>
                {isActive('Cart') && (
                  <motion.div layoutId="nav-dot" className="w-1 h-1 bg-[#FF7F11] rounded-full mt-0.5" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
              </Link>

              {/* حسابي */}
              <Link to={isGuest ? '/Login' : createPageUrl('Account')} className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative group">
                {isGuest ? (
                  <LogIn className={`w-[22px] h-[22px] transition-all duration-200 text-[#FF7F11] stroke-[2.5]`} />
                ) : (
                  <User className={`w-[22px] h-[22px] transition-all duration-200 ${isActive('Account') || isActive('MyOrders') ? 'text-[#0B2545] stroke-[2.5]' : isDarkMode ? 'text-gray-500' : 'text-[#9CA3AF]'}`} />
                )}
                <span className={`text-[10px] leading-none transition-all duration-200 ${isGuest ? 'font-black text-[#FF7F11]' : isActive('Account') || isActive('MyOrders') ? 'font-black text-[#0B2545]' : isDarkMode ? 'font-medium text-gray-500' : 'font-medium text-[#9CA3AF]'}`}>
                  {isGuest ? 'دخول' : 'حسابي'}
                </span>
                {!isGuest && (isActive('Account') || isActive('MyOrders')) && (
                  <motion.div layoutId="nav-dot" className="w-1 h-1 bg-[#FF7F11] rounded-full mt-0.5" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
              </Link>

            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <NotificationPermissionPrompt />
      <CameraPermissionPrompt />
      <AndroidSmartBanner />
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <CartProvider>
      <LanguageProvider>
        <LayoutContent currentPageName={currentPageName}>
          {children}
        </LayoutContent>
      </LanguageProvider>
    </CartProvider>
  );
}
