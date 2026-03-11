// =====================================================
// WASEL - MENU ITEM CARD (Horizontal Layout - Noon Style)
// File: src/components/menu/MenuItemCard.jsx
// =====================================================

import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useUsdToSypRate } from '@/lib/exchangeRate';

// =====================================================
// CONSTANTS - نفس الثوابت في Cart.jsx
// =====================================================
const PRIMARY_COLOR = '#C2185B';
const EXCHANGE_RATE = 150; // fallback
const MARKUP_FACTOR = 1.20; // 20% زيادة وهمية
const FAKE_DOUBLE_FACTOR = 2.0; // السعر المضاعف المشطوب

// =====================================================
// MENU ITEM CARD COMPONENT
// =====================================================
const MenuItemCard = memo(function MenuItemCard({ 
  item, 
  quantity = 0,
  onQuantityChange,
  onAddToCart,
  currency = 'SYP' // 'SYP' | 'USD'
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const exchangeRate = useUsdToSypRate() || EXCHANGE_RATE;

  // السعر الأصلي من Base44 (بالليرة السورية)
  const originalPriceSYP = item.customer_price || item.price || 0;
  
  // السعر الظاهر (الذي يدفعه العميل) = السعر الأصلي × 1.20
  const displayedPriceSYP = Math.round(originalPriceSYP * MARKUP_FACTOR);
  const displayedPriceUSD = displayedPriceSYP / exchangeRate;
  
  // السعر المضاعف (للعرض مشطوب) = السعر المعروض × 2 (ليكون الخصم 50% صحيح)
  const doublePriceSYP = displayedPriceSYP * 2;
  const doublePriceUSD = doublePriceSYP / exchangeRate;

  // Image URL
  const imageUrl = item.images?.[0] || item.image_url || item.image || '/placeholder-food.png';
  const itemTitle = item.name_ar || item.title_ar || item.name || item.title || 'طبق لذيذ';
  const itemDescription = item.description_ar || item.description || '';

  // Handle add item
  const handleAdd = useCallback(async (e) => {
    e?.stopPropagation();
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      if (quantity === 0) {
        await onAddToCart?.(item);
      } else {
        await onQuantityChange?.(item.id, quantity + 1);
      }
    } finally {
      setTimeout(() => setIsUpdating(false), 300);
    }
  }, [item, quantity, isUpdating, onAddToCart, onQuantityChange]);

  // Handle remove item
  const handleRemove = useCallback(async (e) => {
    e?.stopPropagation();
    if (isUpdating || quantity <= 0) return;
    
    setIsUpdating(true);
    try {
      await onQuantityChange?.(item.id, quantity - 1);
    } finally {
      setTimeout(() => setIsUpdating(false), 300);
    }
  }, [item.id, quantity, isUpdating, onQuantityChange]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-row bg-white p-3 rounded-xl border-b border-gray-100 gap-3"
      dir="rtl"
    >
      {/* Image - Right Side (RTL) */}
      <div className="relative w-[110px] h-[110px] shrink-0">
        <div className={`w-full h-full rounded-xl overflow-hidden bg-gray-100 ${!imageLoaded ? 'animate-pulse' : ''}`}>
          <img
            src={imageUrl}
            alt={itemTitle}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => { 
              e.target.src = '/placeholder-food.png';
              setImageLoaded(true);
            }}
            loading="lazy"
          />
        </div>

        {/* Discount Badge - خصم 50% */}
        <div className="absolute top-1 right-1 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
          خصم 50%
        </div>

        {/* Quantity Badge */}
        {quantity > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -left-2 w-6 h-6 bg-[#C2185B] text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
          >
            {quantity}
          </motion.div>
        )}

        {/* Add/Quantity Button - Positioned on image */}
        <div className="absolute -bottom-2 -left-2">
          <AnimatePresence mode="wait">
            {quantity === 0 ? (
              // Add Button
              <motion.button
                key="add"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAdd}
                disabled={isUpdating}
                className="w-9 h-9 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-[#C2185B] hover:bg-[#C2185B] hover:text-white transition-colors disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            ) : (
              // Quantity Counter
              <motion.div
                key="counter"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center bg-white rounded-full shadow-md border border-[#C2185B]/20 overflow-hidden"
              >
                <button
                  onClick={handleRemove}
                  disabled={isUpdating}
                  className="w-8 h-8 flex items-center justify-center text-[#C2185B] hover:bg-[#C2185B]/10 transition-colors disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-6 text-center font-bold text-[#C2185B] text-sm">
                  {quantity}
                </span>
                <button
                  onClick={handleAdd}
                  disabled={isUpdating}
                  className="w-8 h-8 flex items-center justify-center text-[#C2185B] hover:bg-[#C2185B]/10 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content - Left Side (RTL) */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        {/* Title */}
        <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-1">
          {itemTitle}
        </h3>

        {/* Description */}
        {itemDescription && (
          <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mt-1">
            {itemDescription}
          </p>
        )}

        {/* Price - السعر المضاعف مشطوب + السعر الظاهر */}
        <div className="flex flex-col gap-0.5 mt-2">
          {/* السعر المضاعف مشطوب */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs line-through">
              {doublePriceSYP.toLocaleString('en-US')} ل.س
            </span>
            <span className="text-gray-300 text-[10px] line-through">
              ${doublePriceUSD.toFixed(2)}
            </span>
          </div>
          {/* السعر الظاهر (الذي يدفعه العميل) */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#C2185B] text-lg">
              {displayedPriceSYP.toLocaleString('en-US')} ل.س
            </span>
            <span className="text-gray-500 text-xs">
              | ${displayedPriceUSD.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default MenuItemCard;
