import React from 'react';
import { motion } from 'framer-motion';
import { Percent } from 'lucide-react';
import { useUsdToSypRate } from '@/lib/exchangeRate';

// =====================================================
// CONSTANTS - نفس الثوابت في Cart.jsx
// =====================================================
const EXCHANGE_RATE = 150; // fallback if live rate unavailable
const MARKUP_FACTOR = 1.20; // 20% زيادة وهمية
const FAKE_DOUBLE_FACTOR = 2.0; // السعر المضاعف المشطوب

/**
 * مكون عرض السعر مع الخصم الوهمي
 * السعر الأصلي من قاعدة البيانات (بالليرة السورية):
 * - السعر المعروض = السعر الأصلي × 1.20 (زيادة 20%)
 * - السعر المخطوط = السعر الأصلي × 2 (الدبل)
 * - الخصم الظاهر = 50%
 */
export default function PriceDisplay({ 
  basePrice, 
  size = 'medium',
  showDiscount = true,
  animated = true 
}) {
  const exchangeRate = useUsdToSypRate() || EXCHANGE_RATE;
  const safeBasePrice = Math.max(0, Number(basePrice) || 0);
  if (safeBasePrice <= 0) return null;

  // السعر الأصلي من Base44 (بالليرة السورية)
  const originalPriceSYP = safeBasePrice;
  
  // السعر الظاهر (الذي يدفعه العميل) = السعر الأصلي × 1.20
  const displayedPriceSYP = Math.round(originalPriceSYP * MARKUP_FACTOR);
  const displayedPriceUSD = displayedPriceSYP / exchangeRate;
  
  // السعر المضاعف (للعرض مشطوب) = السعر المعروض × 2 (ليكون الخصم 50% صحيح)
  const doublePriceSYP = displayedPriceSYP * 2;
  const doublePriceUSD = doublePriceSYP / exchangeRate;
  
  // خصم 50% دائماً
  const discountPercentage = 50;

  const sizeClasses = {
    small: {
      original: 'text-xs',
      final: 'text-base',
      badge: 'text-[10px] px-1.5 py-0.5'
    },
    medium: {
      original: 'text-sm',
      final: 'text-xl',
      badge: 'text-xs px-2 py-0.5'
    },
    large: {
      original: 'text-base',
      final: 'text-2xl',
      badge: 'text-sm px-2.5 py-1'
    }
  };

  const classes = sizeClasses[size];

  const PriceContent = (
    <div className="flex flex-col gap-1">
      {/* السعر المخطوط (الدبل) مع badge الخصم */}
      <div className="flex items-center gap-2">
        <span className={`${classes.original} text-gray-400 line-through`}>
          {doublePriceSYP.toLocaleString()} ل.س
        </span>
        <span className={`${classes.original} text-gray-300 line-through`}>
          ${doublePriceUSD.toFixed(2)}
        </span>
        {showDiscount && (
          <span className={`${classes.badge} bg-green-500 text-white rounded-full font-bold shadow-sm`}>
            خصم {discountPercentage}%
          </span>
        )}
      </div>

      {/* السعر الظاهر (الذي يدفعه العميل) */}
      <div className="flex items-center gap-2">
        <span className={`${classes.final} font-extrabold text-[#8B0E3A]`}>
          {displayedPriceSYP.toLocaleString()} ل.س
        </span>
        <span className="text-[#374151] text-sm font-semibold">
          | ${displayedPriceUSD.toFixed(2)}
        </span>
      </div>
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {PriceContent}
      </motion.div>
    );
  }

  return PriceContent;
}

/**
 * دالة مساعدة لحساب السعر الظاهر (الذي يدفعه العميل)
 */
export function calculateDisplayedPrice(basePrice) {
  return Math.round(basePrice * MARKUP_FACTOR);
}

/**
 * دالة مساعدة لحساب السعر المخطوط (الدبل)
 */
export function calculateDoublePrice(basePrice) {
  return Math.round(basePrice * FAKE_DOUBLE_FACTOR);
}