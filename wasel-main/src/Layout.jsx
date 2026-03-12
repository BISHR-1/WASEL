import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
  Home, 
  Grid, 
  List, 
  User, 
  ShoppingCart, 
  Wallet, 
  MapPin, 
  Bell, 
  Menu,
  ChevronDown,
  Crown,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import SupportChat from './components/common/SupportChat';
import AppFooter from '@/components/common/AppFooter';
import SearchBar from './components/SearchBar';
import CartAbandonmentReminder from './components/common/CartAbandonmentReminder';
import NotificationPermissionPrompt from './components/common/NotificationPermissionPrompt';
import CameraPermissionPrompt from './components/common/CameraPermissionPrompt';
import { CartProvider, useCart } from './components/cart/CartContext.jsx';
import { LanguageProvider, useLanguage } from './components/common/LanguageContext';
import { motion } from 'framer-motion';
import { getUnreadCount } from './lib/inAppNotifications';
import { getSelectedAddress } from './utils/senderReceiverStorage';
import SmartLottie from '@/components/animations/SmartLottie';
import { ANIMATION_PRESETS } from '@/components/animations/animationPresets';


function LayoutContent({ children, currentPageName }) {
  const languageContext = useLanguage?.() || { language: 'ar', changeLanguage: () => {}, t: (key) => key, dir: 'rtl' };
  const { language, changeLanguage, t, dir } = languageContext;
  const { cartItems = [] } = useCart?.() || {};
  const [user, setUser] = useState(null);
  const [isWaselPlusMember, setIsWaselPlusMember] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [deliveryLabel, setDeliveryLabel] = useState('Daraa, Syria');
  const navigate = useNavigate();
  
  const handleLanguageToggle = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    if (typeof changeLanguage === 'function') {
      // @ts-ignore - changeLanguage accepts lang parameter
      changeLanguage(newLang);
    }
  };
  
  const totalItems = Array.isArray(cartItems) ? cartItems.reduce((sum, item) => sum + (Math.max(0, item?.quantity || 1)), 0) : 0;
  const location = useLocation();

  // Scroll visibility logic
  const [showTopBar, setShowTopBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setShowTopBar(false);
      } else {
        setShowTopBar(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleGlobalSearch = (query) => {
    navigate(`${createPageUrl('Home')}?search=${encodeURIComponent(query)}`);
  };

  // تحديث عداد الإشعارات
  useEffect(() => {
    const updateCount = () => {
      setUnreadNotifications(getUnreadCount());
    };
    
    updateCount();
    
    // الاستماع للتحديثات
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
        if (!error && authUser) {
          setUser(authUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth check error:', err?.message || err);
        setUser(null);
      }
    };
    checkAuth();
    
    // Initialize engaging notifications system if available on window
    try {
      setTimeout(() => {
        // @ts-ignore - initEngagingNotifications is added dynamically
        if (typeof window !== 'undefined' && 'initEngagingNotifications' in window) {
          // @ts-ignore
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
      const label = selectedAddress?.label || selectedAddress?.street || user?.city || 'Daraa, Syria';
      setDeliveryLabel(label);
    };

    refreshSelectedAddress();
    window.addEventListener('wasel_address_updated', refreshSelectedAddress);

    return () => {
      window.removeEventListener('wasel_address_updated', refreshSelectedAddress);
    };
  }, [user?.city]);

  useEffect(() => {
    const loadMembershipState = async () => {
      if (!user?.email) {
        setIsWaselPlusMember(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('wasel_plus_memberships')
          .select('status, end_date, trial_end')
          .eq('user_email', user.email)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !data) {
          setIsWaselPlusMember(false);
          return;
        }

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

  const isActive = (path) => location.pathname.includes(path);

  return (
    <div className={`min-h-screen flex flex-col bg-[#F9FAF8] ${language === 'ar' ? "font-['Cairo',sans-serif]" : "font-sans"}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap');
        :root {
          --primary: #1F7A63; 
          --dark: #1F2933;
          --wasel-cream: #F9FAF8;
          --wasel-gray: #E5E7EB;
          --wasel-green: #1F7A63;
          --wasel-cta: #2FA36B;
        }
        * { -webkit-tap-highlight-color: transparent; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      {/* Top Header - Trust Green Style */}
      <header className={`w-full bg-white z-50 shadow-sm border-b border-[#E5E7EB] pt-safe sticky top-0 transition-transform duration-300 ${showTopBar ? 'translate-y-0' : '-translate-y-full'}`}>
        
        {/* Search & Address Bar */}
        <div className="px-3 py-1.5 space-y-1.5">
            {/* Top Actions Bar */}
            <div className="flex items-center justify-between mb-1.5">
                <button
                  onClick={() => navigate(createPageUrl('MyAddresses'))}
                  className="flex items-center gap-1 text-sm text-[#1F2933] truncate max-w-[60%] hover:text-[#1F7A63] transition-colors"
                  type="button"
                >
                    <MapPin className="w-4 h-4 text-[#1F7A63] shrink-0" />
                    <span className="font-bold">{language === 'ar' ? 'التوصيل لـ' : 'Delivery to'}</span>
                  <span className="truncate">{deliveryLabel}</span>
                    <ChevronDown className="w-3 h-3 text-[#1F7A63]" />
                </button>
                 <div className={`flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                     <SupportChat inline className="shrink-0" />

                     {/* Notifications Bell with Animation */}
                     <button 
                       onClick={() => navigate('/Notifications')}
                       className="relative p-2 hover:bg-[#E5E7EB] rounded-lg transition-colors"
                     >
                       {unreadNotifications > 0 ? (
                         <div className="relative" style={{ width: '24px', height: '24px' }}>
                           <SmartLottie
                             animationPath={ANIMATION_PRESETS.notificationBell.path}
                             width={24}
                             height={24}
                             trigger="immediate"
                             loop={true}
                           />
                         </div>
                       ) : (
                         <Bell className="w-5 h-5 text-[#1F2933]" />
                       )}
                       {unreadNotifications > 0 && (
                         <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#2FA36B] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                           {unreadNotifications > 9 ? '9+' : unreadNotifications}
                         </span>
                       )}
                     </button>
                     
                     <button onClick={handleLanguageToggle} className="font-bold text-[10px] uppercase border border-[#E5E7EB] px-2 py-1 rounded bg-[#F9FAF8] text-[#1F2933] hover:bg-[#E5E7EB]">
                         {language === 'ar' ? 'EN' : 'AR'}
                     </button>
                </div>
            </div>

            {/* Search Bar */}
            <Link
              to={createPageUrl('WaselPlusMembership')}
              className="block"
            >
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="rounded-xl p-3 bg-gradient-to-r from-[#1D4ED8] via-[#0EA5E9] to-[#F59E0B] text-white shadow-[0_8px_20px_rgba(14,165,233,0.35)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    <span className="font-extrabold text-sm" dir="rtl">
                      {isWaselPlusMember ? 'أنت مشترك في Wasel+' : 'اشترك بـ Wasel+ ووفر'}
                    </span>
                  </div>
                  <Sparkles className="w-4 h-4" />
                </div>
                {!isWaselPlusMember && (
                  <p className="text-[11px] text-white/90 mt-1" dir="rtl">
                    خصومات حصرية وتوصيل مجاني أسرع
                  </p>
                )}
              </motion.div>
            </Link>

            <div className="relative z-[60]">
              <SearchBar
                placeholder={language === 'ar' ? 'ابحث في المطاعم والهدايا والمنتجات...' : 'Search restaurants, gifts, products...'}
                variant="header"
                language={language}
                dir={dir}
                onSearch={handleGlobalSearch}
              />
            </div>

            <Link to={createPageUrl('Home')} className="block">
              <motion.div
                initial={{ opacity: 0.9 }}
                animate={{ opacity: 1 }}
                transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.6 }}
                className="rounded-xl border border-[#FCD34D] bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#FFF7ED] px-3 py-2 shadow-sm"
              >
                <div className="flex items-center justify-between text-[#92400E]">
                  <span className="text-xs font-black" dir="rtl">خصم 50% لوقت محدود على منتجات مختارة</span>
                  <span className="text-[11px] font-bold text-[#B45309]">{language === 'ar' ? 'اطلب الآن' : 'Order now'}</span>
                </div>
              </motion.div>
            </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Footer */}
      <AppFooter />

      {/* Bottom Navigation - Trust Green Style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] z-50 shadow-[0_-5px_15px_rgba(31,41,51,0.08)] pb-safe">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
            {/* Home - الرئيسية */}
            <Link to={createPageUrl('Home')} className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${isActive('Home') && !location.hash ? 'text-[#1F7A63]' : 'text-[#1F2933]/50'}`}>
                <Home className={`w-5 h-5 transition-all ${isActive('Home') && !location.hash ? 'stroke-[2.5]' : 'stroke-2'}`} strokeLinecap="round" strokeLinejoin="round" />
                <span className="text-[9px] font-medium mt-0.5">{language === 'ar' ? 'الرئيسية' : 'Home'}</span>
            </Link>

            {/* My Orders - طلباتي */}
            <Link to={createPageUrl('MyOrders')} className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${isActive('MyOrders') ? 'text-[#1F7A63]' : 'text-[#1F2933]/50'}`}>
                <ClipboardList className={`w-5 h-5 transition-all ${isActive('MyOrders') ? 'stroke-[2.5]' : 'stroke-2'}`} strokeLinecap="round" strokeLinejoin="round" />
                <span className="text-[9px] font-medium mt-0.5">{language === 'ar' ? 'طلباتي' : 'Orders'}</span>
            </Link>

            {/* Cart - السلة */}
            <Link to={createPageUrl('Cart')} className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${isActive('Cart') ? 'text-[#1F7A63]' : 'text-[#1F2933]/50'}`}>
                <div className="relative">
                    <ShoppingCart className={`w-5 h-5 transition-all ${isActive('Cart') ? 'stroke-[2.5]' : 'stroke-2'}`} strokeLinecap="round" strokeLinejoin="round" />
                    {totalItems > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 bg-[#1F7A63] text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1"
                        >
                            {totalItems > 99 ? '99+' : totalItems}
                        </motion.span>
                    )}
                </div>
                <span className="text-[9px] font-medium mt-0.5">{language === 'ar' ? 'السلة' : 'Cart'}</span>
            </Link>

            {/* Wallet - المحفظة */}
            <Link to={createPageUrl('Wallet')} className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${isActive('Wallet') ? 'text-[#1F7A63]' : 'text-[#1F2933]/50'}`}>
                <Wallet className={`w-5 h-5 transition-all ${isActive('Wallet') ? 'stroke-[2.5]' : 'stroke-2'}`} strokeLinecap="round" strokeLinejoin="round" />
                <span className="text-[9px] font-medium mt-0.5">{language === 'ar' ? 'المحفظة' : 'Wallet'}</span>
            </Link>

            {/* Account - الحساب */}
            <Link to={createPageUrl('Account')} className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${isActive('Account') || isActive('Orders') || isActive('Track') ? 'text-[#1F7A63]' : 'text-[#1F2933]/50'}`}>
                <User className={`w-5 h-5 transition-all ${isActive('Account') || isActive('Orders') || isActive('Track') ? 'stroke-[2.5]' : 'stroke-2'}`} strokeLinecap="round" strokeLinejoin="round" />
                <span className="text-[9px] font-medium mt-0.5">{language === 'ar' ? 'الحساب' : 'Account'}</span>
            </Link>
        </div>
      </nav>

      <CartAbandonmentReminder />
      <NotificationPermissionPrompt />
      <CameraPermissionPrompt />
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
