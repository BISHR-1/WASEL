import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Globe, Bell, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { useDarkMode } from '@/lib/DarkModeContext';
import { useLanguage } from '@/components/common/LanguageContext';

export default function Settings() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { language, changeLanguage, t } = useLanguage();
  
  const [settings, setSettings] = useState({
    notifications: true
  });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('wasel_settings') || '{}');
    setSettings({ ...settings, ...saved });
  }, []);

  const saveSettings = (newSettings) => {
    localStorage.setItem('wasel_settings', JSON.stringify(newSettings));
    setSettings(newSettings);
  };

  const handleToggle = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
    toast.success('تم تحديث الإعدادات');
  };

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    toast.success(lang === 'ar' ? 'تم تغيير اللغة إلى العربية' : 'Language changed to English');
  };
  
  const handleDarkModeToggle = () => {
    toggleDarkMode();
    toast.success(isDarkMode ? 'تم إيقاف الوضع الليلي' : 'تم تفعيل الوضع الليلي');
  };

  return (
    <div className={`min-h-screen pb-24 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200'}`}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`pt-6 pb-8 px-4 rounded-b-[2rem] shadow-lg ${
          isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-gray-100 to-gray-200'
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            <SettingsIcon className={`w-8 h-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            {t('settings')}
          </h1>
          <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'ar' ? 'تخصيص تجربتك في واصل' : 'Customize your Wasel experience'}
          </p>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {t('language')}
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {language === 'ar' ? 'اختر لغة التطبيق' : 'Choose app language'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleLanguageChange('ar')}
              className={`px-4 py-3 rounded-xl font-bold transition-all ${
                language === 'ar'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : `${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'} hover:bg-gray-200`
              }`}
            >
              العربية
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-4 py-3 rounded-xl font-bold transition-all ${
                language === 'en'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : `${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'} hover:bg-gray-200`
              }`}
            >
              English
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {t('enableNotifications')}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {language === 'ar' ? 'تفعيل إشعارات الطلبات' : 'Enable order notifications'}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggle('notifications')}
              className={`w-16 h-8 rounded-full transition-all ${
                settings.notifications ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow-md transition-all ${
                  settings.notifications ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-2xl shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-gray-900' : 'bg-yellow-100'
              }`}>
                {isDarkMode ? (
                  <Moon className="w-6 h-6 text-yellow-400" />
                ) : (
                  <Sun className="w-6 h-6 text-yellow-600" />
                )}
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {t('darkMode')}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {language === 'ar' ? 'راحة للعين' : 'Easy on the eyes'}
                </p>
              </div>
            </div>

            <button
              onClick={handleDarkModeToggle}
              className={`w-16 h-8 rounded-full transition-all ${
                isDarkMode ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow-md transition-all ${
                  isDarkMode ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`rounded-2xl shadow-lg p-6 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
        >
          <img 
            src="/wasel-mascot.png" 
            alt="Wasel Mascot" 
            className="w-24 h-24 mx-auto mb-4"
            onError={(event) => {
              event.currentTarget.src = 'https://placehold.co/200x200/F1F5F9/1F2933?text=Wasel';
            }}
          />
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Wasel Store || واصل ستور
          </h3>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {language === 'ar' ? 'نوصّل حبك لحد الباب 💙' : 'Delivering love to your doorstep 💙'}
          </p>
          <p className={`text-xs mt-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {t('appVersion')}: 2.0.0
          </p>
        </motion.div>
      </div>
    </div>
  );
}
