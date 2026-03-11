import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../cart/CartContext';
import { useLanguage } from './LanguageContext';
import { useDarkMode } from '@/lib/DarkModeContext';

export default function CartAbandonmentReminder() {
  const [showReminder, setShowReminder] = useState(false);
  const { cartItems } = useCart();
  const { language } = useLanguage();
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has items in cart
    if (cartItems.length === 0) {
      setShowReminder(false);
      return;
    }

    // Check if reminder was already shown in this session
    const reminderShown = sessionStorage.getItem('cart_reminder_shown');
    if (reminderShown === 'true') {
      return;
    }

    // Check when items were first added to cart
    const cartTimestamp = localStorage.getItem('wasel_cart_timestamp');
    const now = Date.now();

    if (!cartTimestamp) {
      // First time adding items - set timestamp
      localStorage.setItem('wasel_cart_timestamp', now.toString());
      return;
    }

    // Show reminder after 3 minutes (180000 ms) of inactivity
    const timeSinceAdded = now - parseInt(cartTimestamp);
    const REMINDER_DELAY = 180000; // 3 minutes

    if (timeSinceAdded > REMINDER_DELAY) {
      // Check if user is not already on cart page
      const isOnCartPage = window.location.pathname.includes('/cart');
      if (!isOnCartPage) {
        setShowReminder(true);
        sessionStorage.setItem('cart_reminder_shown', 'true');
      }
    }
  }, [cartItems.length]);

  const handleGoToCart = () => {
    setShowReminder(false);
    navigate('/cart');
  };

  const handleDismiss = () => {
    setShowReminder(false);
    sessionStorage.setItem('cart_reminder_shown', 'true');
  };

  const messages = {
    ar: {
      title: 'لا تنسى عائلتك في درعا! ❤️',
      subtitle: 'لديك طلبات في السلة تنتظر إتمامها',
      body: 'أكمل طلبك الآن وأرسل الفرحة لأحبابك. كل دقيقة تأخير، دقيقة بعد عن قلوبهم 💕',
      points: [
        '🎁 منتجات مختارة بعناية لأهلك',
        '⚡ توصيل سريع خلال 24-48 ساعة',
        '📸 صورة توثيق عند الوصول',
        '💝 أسعد قلوبهم اليوم'
      ],
      goToCart: 'أكمل طلبي الآن',
      dismiss: 'لاحقاً'
    },
    en: {
      title: "Don't Forget Your Family in Daraa! ❤️",
      subtitle: 'You have items waiting in your cart',
      body: 'Complete your order now and send joy to your loved ones. Every minute delayed is a minute away from their hearts 💕',
      points: [
        '🎁 Carefully selected products for your family',
        '⚡ Fast delivery within 24-48 hours',
        '📸 Proof photo upon arrival',
        '💝 Make their hearts happy today'
      ],
      goToCart: 'Complete My Order',
      dismiss: 'Later'
    }
  };

  const msg = messages[language] || messages.ar;

  return (
    <AnimatePresence>
      {showReminder && (
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
              className={`max-w-md w-full rounded-3xl shadow-2xl overflow-hidden ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with animated gradient */}
              <div className="relative bg-gradient-to-br from-red-500 via-pink-500 to-rose-500 p-6 text-white">
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <ShoppingCart className="w-10 h-10" />
                </motion.div>

                <h2 className="text-2xl font-bold text-center mb-2">{msg.title}</h2>
                <p className="text-white/90 text-center text-sm">{msg.subtitle}</p>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className={`text-center mb-6 leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {msg.body}
                </p>

                {/* Benefits */}
                <div className="space-y-3 mb-6">
                  {msg.points.map((point, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-3 p-3 rounded-xl ${
                        isDarkMode ? 'bg-gray-700/50' : 'bg-gradient-to-r from-pink-50 to-rose-50'
                      }`}
                    >
                      <span className="text-lg">{point}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Cart Summary */}
                <div className={`p-4 rounded-xl mb-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {language === 'ar' ? 'عدد المنتجات' : 'Items in cart'}
                    </span>
                    <span className="text-2xl font-bold text-pink-500">{cartItems.length}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoToCart}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Heart className="w-5 h-5 fill-white" />
                    {msg.goToCart}
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>

                  <button
                    onClick={handleDismiss}
                    className={`w-full py-3 rounded-full font-semibold transition-colors ${
                      isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {msg.dismiss}
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
