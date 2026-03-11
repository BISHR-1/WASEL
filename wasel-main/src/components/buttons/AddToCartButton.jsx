import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

/**
 * AddToCartButton - مكون زر أضف للسلة مع انيميشن محترف
 * الانيميشن: حركة زرقاء ↔ صفراء داخل الزر تحاكي السلة
 */
export default function AddToCartButton({ 
  onClick, 
  disabled = false, 
  isLoading = false,
  label = 'أضف للسلة',
  className = '' 
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    onClick?.();
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`
        relative w-full bg-[#1B4332] hover:bg-[#163426] disabled:bg-gray-400
        text-white py-3 rounded-xl font-bold text-sm md:text-base
        flex items-center justify-center gap-2
        transition-all duration-300
        overflow-hidden
        ${className}
      `}
    >
      {/* خلفية أنيمية - موجة زرقاء وصفراء */}
      {isAnimating && (
        <>
          {/* الموجة الزرقاء */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-500 via-yellow-400 to-blue-500"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
          
          {/* الموجة الثانية - للحركة المزدوجة */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-blue-500"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeInOut' }}
            style={{ opacity: 0.6 }}
          />
        </>
      )}

      {/* النص والأيقونة */}
      <motion.div 
        className="relative z-10 flex items-center gap-2"
        animate={isAnimating ? { scale: [1, 0.9, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <ShoppingBag className="w-5 h-5" />
        <span>{isLoading ? 'جاري...' : label}</span>
      </motion.div>

      {/* دائرة متحركة إضافية */}
      {isAnimating && (
        <motion.div
          className="absolute w-2 h-2 bg-white rounded-full"
          initial={{ x: -20, opacity: 1 }}
          animate={{ x: 200, opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{ left: '10%', top: '50%', marginTop: -4 }}
        />
      )}
    </motion.button>
  );
}
