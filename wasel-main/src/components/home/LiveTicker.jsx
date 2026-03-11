import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Clock } from 'lucide-react';
import { useLanguage } from '../common/LanguageContext';

const FAKE_ORDERS = [
  { user: 'Ahmed', country: 'Germany', item: 'Mixed Grill', time: '5' },
  { user: 'Sara', country: 'UAE', item: 'Red Roses Bouquet', time: '2' },
  { user: 'Mohammed', country: 'Saudi Arabia', item: 'Arabic Sweets', time: '10' },
  { user: 'Lana', country: 'Qatar', item: 'Birthday Gift', time: '1' },
  { user: 'Omar', country: 'Kuwait', item: 'Broasted Meal', time: '7' },
  { user: 'Khalid', country: 'Sweden', item: 'Chocolate Bouquet', time: '15' },
];

export default function LiveTicker() {
  const [index, setIndex] = useState(0);
  const { t, language } = useLanguage();

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % FAKE_ORDERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const currentOrder = FAKE_ORDERS[index];

  return (
    <div className="bg-[#1B4332] text-white py-3 overflow-hidden shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between sm:justify-center relative">
        <div className={`flex items-center gap-2 text-[#52B788] text-xs font-bold uppercase tracking-wider absolute ${language === 'ar' ? 'right-4 sm:mr-8' : 'left-4 sm:ml-8'} sm:static`}>
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          {t('live')}
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm truncate max-w-[80%]"
          >
            <div className="flex items-center gap-1 text-[#F5E6D3]">
              <User className="w-3 h-3" />
              <span>{currentOrder.user}</span>
              <span className="text-white/60">{t('from')}</span>
              <span>{currentOrder.country}</span>
            </div>
            <span className="text-white/40 hidden sm:inline">|</span>
            <div className="flex items-center gap-1 font-medium">
              <span>{t('orderFrom')} {currentOrder.item}</span>
            </div>
            <span className="text-white/40 hidden sm:inline">|</span>
            <div className="flex items-center gap-1 text-[#52B788]">
              <Clock className="w-3 h-3" />
              <span>{t('since')} {currentOrder.time} {t('minutes')}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}