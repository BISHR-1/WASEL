// =====================================================
// NOTIFICATION BELL ANIMATED COMPONENT
// File: src/components/notifications/NotificationBell.jsx
// =====================================================

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SmartLottie from '@/components/animations/SmartLottie';
import { ANIMATION_PRESETS } from '@/components/animations/animationPresets';

/**
 * مكون الجرس المتحرك مع الإشعارات
 * عرض عدد الإشعارات بدون قراءة مع animation
 */
export default function NotificationBell({ 
  unreadCount = 0, 
  onClick = () => {},
  showAnimation = true 
}) {
  const [animate, setAnimate] = useState(false);
  
  // تشغيل animation عند وصول إشعار جديد
  useEffect(() => {
    if (unreadCount > 0 && showAnimation) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount, showAnimation]);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      aria-label={`الإشعارات (${unreadCount} بدون قراءة)`}
    >
      {/* الجرس الرئيسي */}
      <motion.div
        animate={animate ? { rotate: [0, -15, 15, -15, 15, 0] } : { rotate: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Bell className="w-6 h-6 text-gray-600" />
      </motion.div>

      {/* عدد الإشعارات */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse animation عند وصول إشعار */}
      <AnimatePresence>
        {animate && (
          <motion.div
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-red-400 rounded-full"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/**
 * مكون متقدم: الجرس مع Lottie animation
 */
export function NotificationBellAnimated({ 
  unreadCount = 0, 
  onClick = () => {},
  displayAnimation = true
}) {
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    if (unreadCount > 0 && displayAnimation) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount, displayAnimation]);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className="relative p-2 hover:bg-blue-50 rounded-full transition-colors group"
    >
      {/* Container للـ animation */}
      <div className="relative w-6 h-6 flex items-center justify-center">
        {/* Lottie animation - يظهر فقط عند وجود إشعارات جديدة */}
        {showPulse && displayAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute inset-0"
          >
            <SmartLottie
              animationPath={ANIMATION_PRESETS.notificationBell?.path}
              width={24}
              height={24}
              trigger="never"
              autoplay={true}
              loop={true}
            />
          </motion.div>
        )}

        {/* الجرس الثابت */}
        <motion.div
          animate={showPulse ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.4, repeat: showPulse ? Infinity : 0 }}
        >
          <Bell className="w-6 h-6 text-blue-600" />
        </motion.div>
      </div>

      {/* Badge الإشعارات */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -10 }}
            className="absolute -top-2 -right-2 flex items-center justify-center min-w-5 h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap pointer-events-none"
      >
        {unreadCount === 0 
          ? 'لا إشعارات جديدة'
          : `${unreadCount} إشعار جديد`
        }
      </motion.div>
    </motion.button>
  );
}
