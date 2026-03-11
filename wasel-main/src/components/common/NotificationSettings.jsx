import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Gift, Tag, TrendingUp, Heart, Sparkles, X, Check } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useDarkMode } from '@/lib/DarkModeContext';
import { 
  getNotificationPreferences, 
  saveNotificationPreferences,
  sendSpecialOfferNotification,
  sendFamilyReminderNotification,
  sendNewProductNotification
} from '@/lib/engagingNotifications';
import { toast } from 'sonner';

export default function NotificationSettings({ isOpen, onClose }) {
  const { language } = useLanguage();
  const { isDarkMode } = useDarkMode();
  const [preferences, setPreferences] = useState(getNotificationPreferences());

  const notificationTypes = {
    ar: [
      {
        id: 'specialOffers',
        icon: Tag,
        title: 'العروض الخاصة',
        description: 'احصل على إشعارات بأحدث العروض والخصومات',
        color: 'from-orange-500 to-red-500',
        testFunction: () => sendSpecialOfferNotification('ar')
      },
      {
        id: 'familyReminders',
        icon: Heart,
        title: 'تذكير بالعائلة',
        description: 'رسائل تحفيزية لإرسال الفرحة لأهلك',
        color: 'from-pink-500 to-rose-500',
        testFunction: () => sendFamilyReminderNotification('ar')
      },
      {
        id: 'newProducts',
        icon: Sparkles,
        title: 'منتجات جديدة',
        description: 'كن أول من يعرف عن الإضافات الجديدة',
        color: 'from-purple-500 to-indigo-500',
        testFunction: () => sendNewProductNotification('ar')
      },
      {
        id: 'orderUpdates',
        icon: TrendingUp,
        title: 'تحديثات الطلبات',
        description: 'تابع حالة طلباتك خطوة بخطوة',
        color: 'from-blue-500 to-cyan-500',
        testFunction: null
      },
      {
        id: 'promotions',
        icon: Gift,
        title: 'العروض الترويجية',
        description: 'احصل على هدايا ومكافآت حصرية',
        color: 'from-green-500 to-emerald-500',
        testFunction: null
      }
    ],
    en: [
      {
        id: 'specialOffers',
        icon: Tag,
        title: 'Special Offers',
        description: 'Get notified about latest deals and discounts',
        color: 'from-orange-500 to-red-500',
        testFunction: () => sendSpecialOfferNotification('en')
      },
      {
        id: 'familyReminders',
        icon: Heart,
        title: 'Family Reminders',
        description: 'Motivational messages to send joy to your loved ones',
        color: 'from-pink-500 to-rose-500',
        testFunction: () => sendFamilyReminderNotification('en')
      },
      {
        id: 'newProducts',
        icon: Sparkles,
        title: 'New Products',
        description: 'Be the first to know about new additions',
        color: 'from-purple-500 to-indigo-500',
        testFunction: () => sendNewProductNotification('en')
      },
      {
        id: 'orderUpdates',
        icon: TrendingUp,
        title: 'Order Updates',
        description: 'Track your order status step by step',
        color: 'from-blue-500 to-cyan-500',
        testFunction: null
      },
      {
        id: 'promotions',
        icon: Gift,
        title: 'Promotions',
        description: 'Get exclusive gifts and rewards',
        color: 'from-green-500 to-emerald-500',
        testFunction: null
      }
    ]
  };

  const types = notificationTypes[language] || notificationTypes.ar;

  const handleToggle = (id) => {
    const newPreferences = {
      ...preferences,
      [id]: !preferences[id]
    };
    setPreferences(newPreferences);
    saveNotificationPreferences(newPreferences);
    
    toast.success(
      language === 'ar' 
        ? 'تم تحديث التفضيلات بنجاح' 
        : 'Preferences updated successfully'
    );
  };

  const handleTestNotification = (type) => {
    if (type.testFunction) {
      type.testFunction();
      toast.success(
        language === 'ar' 
          ? '🔔 تم إرسال إشعار تجريبي!' 
          : '🔔 Test notification sent!'
      );
    }
  };

  const handleEnableAll = () => {
    const allEnabled = {
      specialOffers: true,
      familyReminders: true,
      newProducts: true,
      orderUpdates: true,
      promotions: true
    };
    setPreferences(allEnabled);
    saveNotificationPreferences(allEnabled);
    toast.success(language === 'ar' ? 'تم تفعيل جميع الإشعارات' : 'All notifications enabled');
  };

  const handleDisableAll = () => {
    const allDisabled = {
      specialOffers: false,
      familyReminders: false,
      newProducts: false,
      orderUpdates: false,
      promotions: false
    };
    setPreferences(allDisabled);
    saveNotificationPreferences(allDisabled);
    toast.success(language === 'ar' ? 'تم إيقاف جميع الإشعارات' : 'All notifications disabled');
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`max-w-2xl w-full rounded-3xl shadow-2xl overflow-hidden ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {language === 'ar' ? 'إعدادات الإشعارات' : 'Notification Settings'}
              </h2>
              <p className="text-white/80 text-sm">
                {language === 'ar' 
                  ? 'تحكم في أنواع الإشعارات التي تريد استلامها' 
                  : 'Control which notifications you want to receive'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Quick Actions */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleEnableAll}
              className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {language === 'ar' ? 'تفعيل الكل' : 'Enable All'}
            </button>
            <button
              onClick={handleDisableAll}
              className={`flex-1 py-2 rounded-full font-semibold transition-all ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {language === 'ar' ? 'إيقاف الكل' : 'Disable All'}
            </button>
          </div>

          {/* Notification Types */}
          <div className="space-y-4">
            {types.map((type) => {
              const Icon = type.icon;
              const isEnabled = preferences[type.id];

              return (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-4 ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  } hover:shadow-md transition-all`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1">
                      <h3 className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {type.title}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {type.description}
                      </p>

                      {type.testFunction && isEnabled && (
                        <button
                          onClick={() => handleTestNotification(type)}
                          className="mt-2 text-xs text-blue-500 hover:text-blue-600 font-semibold"
                        >
                          {language === 'ar' ? '🔔 إرسال تجريبي' : '🔔 Send Test'}
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggle(type.id)}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        isEnabled
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : isDarkMode
                          ? 'bg-gray-600'
                          : 'bg-gray-300'
                      }`}
                    >
                      <motion.div
                        animate={{ x: isEnabled ? 24 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                      />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Info Note */}
          <div className={`mt-6 p-4 rounded-xl ${
            isDarkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'
          }`}>
            <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
              {language === 'ar'
                ? '💡 يمكنك تغيير هذه الإعدادات في أي وقت. سنحترم خياراتك ولن نرسل إلا الإشعارات التي تريدها.'
                : '💡 You can change these settings anytime. We will respect your choices and only send notifications you want.'}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
