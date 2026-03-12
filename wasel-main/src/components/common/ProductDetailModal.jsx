import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Package } from 'lucide-react';
import AddToCartButton from '@/components/buttons/AddToCartButton';
import PriceDisplay from '@/components/common/PriceDisplay';
import { useDarkMode } from '@/lib/DarkModeContext';

/**
 * ProductDetailModal - نافذة موحدة لعرض تفاصيل المنتج
 * تعمل كـ bottom-sheet على الموبايل ومنتصف الشاشة على الديسكتوب
 */
export default function ProductDetailModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
  addToCartLabel = 'أضف للسلة',
  isLoading = false,
  extraContent = null,
}) {
  if (!isOpen || !item) return null;

  const { isDarkMode } = useDarkMode();
  const name = item.name_ar || item.name || item.title_ar || item.title || '';
  const description = item.details || item.description_ar || item.description || '';
  const price = item.customer_price || item.price || item.base_price || 0;

  const getImageUrl = () => {
    if (item.image_url && typeof item.image_url === 'string' && item.image_url.trim()) return item.image_url;
    if (item.image && typeof item.image === 'string' && item.image.startsWith('http')) return item.image;
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      const img = item.images[0];
      return typeof img === 'string' ? img : img?.url;
    }
    return null;
  };

  const imageUrl = getImageUrl();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal - bottom sheet on mobile, centered on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-[101] pointer-events-none"
          >
            <div
              className={`pointer-events-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[88vh] overflow-hidden shadow-2xl flex flex-col`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle (mobile) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Image */}
              {imageUrl && (
                <div className="relative w-full h-52 sm:h-56 bg-gray-100 shrink-0 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  {/* Close button over image */}
                  <button
                    onClick={onClose}
                    className="absolute top-3 left-3 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              )}

              {/* Close button when no image */}
              {!imageUrl && (
                <div className="flex justify-end px-4 pt-3">
                  <button
                    onClick={onClose}
                    className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              )}

              {/* Content - scrollable */}
              <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2" dir="rtl">
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'} mb-2 leading-snug`}>{name}</h2>

                {description && (
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm leading-relaxed mb-4 whitespace-pre-line`}>
                    {description}
                  </p>
                )}

                {/* Price */}
                {price > 0 && (
                  <div className="mb-4">
                    <PriceDisplay basePrice={price} size="medium" />
                  </div>
                )}

                {/* Extra content (e.g. contents, delivery info for packages) */}
                {extraContent}
              </div>

              {/* Add to Cart - sticky bottom */}
              <div className={`px-5 pb-5 pt-2 shrink-0 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <AddToCartButton
                  onClick={() => {
                    onAddToCart?.(item);
                    onClose?.();
                  }}
                  disabled={item.available === false}
                  isLoading={isLoading}
                  label={addToCartLabel}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
