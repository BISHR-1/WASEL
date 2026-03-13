import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, Gift, Sparkles, Tag, TrendingUp } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useDarkMode } from '@/lib/DarkModeContext';
import { toast } from 'sonner';
import { requestNotificationPermission } from '@/lib/notificationHelpers';

export default function NotificationPermissionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const { language } = useLanguage();
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    // Check if prompt was already shown
    const promptShown = localStorage.getItem('notification_prompt_shown');

    // Safely check notification permission without referencing undefined global
    let notificationPermission = null;
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        notificationPermission = Notification.permission;
      } catch (e) {
        notificationPermission = null;
      }
    }

    // Show prompt only if:
    // 1. Not shown before OR shown more than 7 days ago
    // 2. Notification permission is not granted yet
    // 3. Browser supports notifications
    if (typeof window !== 'undefined' && 'Notification' in window && notificationPermission !== 'granted') {
      if (!promptShown) {
        // Show after 5 seconds on first visit
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 5000);
        return () => clearTimeout(timer);
      } else {
        // Check if 7 days passed since last prompt
        const lastShown = parseInt(promptShown);
        const daysSinceLastShown = (Date.now() - lastShown) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLastShown > 7) {
          const timer = setTimeout(() => {
            setShowPrompt(true);
          }, 10000); // Show after 10 seconds on return visit
          return () => clearTimeout(timer);
        }
      }
    }
  }, []);

  const handleEnableNotifications = async () => {
    try {
      const permission = await requestNotificationPermission();
      
      if (permission === 'granted') {
        toast.success(
          language === 'ar' 
            ? '🎉 تم تفعيل الإشعارات بنجاح! ستصلك جميع العروض والتحديثات' 
            : '🎉 Notifications enabled! You\'ll receive all offers and updates'
        );
        
        // Show a test notification
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: language === 'ar' ? '🎊 مرحباً بك في واصل ستور!' : '🎊 Welcome to Wasel Store!',
            body: language === 'ar' 
              ? 'سنبقيك على اطلاع بأحدث العروض والخصومات الحصرية لك ولعائلتك' 
              : 'We\'ll keep you updated with the latest offers and exclusive deals for you and your family',
            icon: '/icon-192.png'
          });
        }
      } else if (permission === 'denied') {
        toast.error(
          language === 'ar' 
            ? 'تم رفض الإشعارات. يمكنك تفعيلها لاحقاً من إعدادات المتصفح' 
            : 'Notifications denied. You can enable them later from browser settings'
        );
      }
      
      setShowPrompt(false);
      localStorage.setItem('notification_prompt_shown', Date.now().toString());
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error(language === 'ar' ? 'حدث خطأ في تفعيل الإشعارات' : 'Error enabling notifications');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification_prompt_shown', Date.now().toString());
  };

  const messages = {
    ar: {
      title: 'لا تفوت أي عرض! 🎁',
      subtitle: 'فعّل الإشعارات وكن أول من يعلم',
      benefits: [
        {
          icon: Tag,
          title: 'خصومات حصرية',
          description: 'احصل على إشعار فوري بأفضل العروض والخصومات'
        },
        {
          icon: Gift,
          title: 'عروض محدودة',
          description: 'لا تفوت العروض الخاصة التي تنتهي سريعاً'
        },
        {
          icon: Sparkles,
          title: 'منتجات جديدة',
          description: 'كن أول من يعرف عن المنتجات الجديدة'
        },
        {
          icon: TrendingUp,
          title: 'حالة الطلبات',
          description: 'تابع طلباتك لحظة بلحظة حتى الوصول'
        }
      ],
      enable: 'فعّل الإشعارات الآن',
      later: 'لاحقاً',
      note: '💡 يمكنك إيقاف الإشعارات في أي وقت من الإعدادات'
    },
    en: {
      title: "Don't Miss Any Offer! 🎁",
      subtitle: 'Enable notifications and be the first to know',
      benefits: [
        {
          icon: Tag,
          title: 'Exclusive Discounts',
          description: 'Get instant alerts for best offers and discounts'
        },
        {
          icon: Gift,
          title: 'Limited Offers',
          description: "Don't miss special offers that expire quickly"
        },
        {
          icon: Sparkles,
          title: 'New Products',
          description: 'Be the first to know about new products'
        },
        {
          icon: TrendingUp,
          title: 'Order Status',
          description: 'Track your orders moment by moment until arrival'
        }
      ],
      enable: 'Enable Notifications Now',
      later: 'Later',
      note: '💡 You can turn off notifications anytime from settings'
    }
  };

  const msg = messages[language] || messages.ar;

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div
              className={`max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with animated gradient */}
              <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6 text-white">
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 10, 0],
                    scale: [1, 1.1, 1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Bell className="w-10 h-10" />
                </motion.div>

                <h2 className="text-2xl font-bold text-center mb-2">{msg.title}</h2>
                <p className="text-white/90 text-center text-sm">{msg.subtitle}</p>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Benefits Grid */}
                <div className="grid grid-cols-1 gap-4 mb-6">
                  {msg.benefits.map((benefit, index) => {
                    const Icon = benefit.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-start gap-4 p-4 rounded-xl ${
                          isDarkMode 
                            ? 'bg-gray-700/50 hover:bg-gray-700' 
                            : 'bg-gradient-to-r from-blue-50 to-purple-50 hover:shadow-md'
                        } transition-all`}
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {benefit.title}
                          </h3>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {benefit.description}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Note */}
                <div className={`p-3 rounded-xl mb-6 text-sm text-center ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-yellow-50 text-yellow-800'
                }`}>
                  {msg.note}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEnableNotifications}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Bell className="w-5 h-5" />
                    {msg.enable}
                  </motion.button>

                  <button
                    onClick={handleDismiss}
                    className={`w-full py-3 rounded-full font-semibold transition-colors flex items-center justify-center gap-2 ${
                      isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <BellOff className="w-4 h-4" />
                    {msg.later}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
