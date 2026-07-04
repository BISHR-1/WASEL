// =====================================================
// WASEL — بطاقة المنتج الاحترافية 2.0
// ملف: src/components/ProductCard.jsx
// =====================================================

import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, Star, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUsdToSypRate } from '@/lib/exchangeRate';
import SmartLottie from '@/components/animations/SmartLottie';
import { ANIMATION_PRESETS } from '@/components/animations/animationPresets';
import AddToCartButton from '@/components/buttons/AddToCartButton';

// =====================================================
// ثوابت التسعير
// =====================================================
const EXCHANGE_RATE = 150;
const MARKUP_FACTOR = 1.20;
const FAKE_DOUBLE_FACTOR = 2.0;

// =====================================================
// SVG Fallback احترافي — يظهر عند فشل تحميل الصورة
// =====================================================
function ProductImageFallback({ title }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#EEF4F8] to-[#F8F9FA] gap-2 p-4">
      <svg viewBox="0 0 64 64" className="w-14 h-14 opacity-30" fill="none">
        <rect x="8" y="16" width="48" height="36" rx="4" stroke="#0B2545" strokeWidth="2" />
        <circle cx="24" cy="28" r="5" stroke="#0B2545" strokeWidth="2" />
        <path d="M8 44l14-12 10 10 8-8 14 10" stroke="#0B2545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[10px] text-[#0B2545]/40 font-medium text-center line-clamp-2 leading-tight">{title}</span>
    </div>
  );
}

// =====================================================
// مكوّن بطاقة المنتج
// =====================================================
const ProductCard = memo(function ProductCard({
  product,
  isFavorited = false,
  onFavoriteChange,
  onCartAdd,
  showQuickView = true,
  size = 'normal', // 'normal' | 'small' | 'large'
}) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isFav, setIsFav] = useState(isFavorited);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showAddAnimation, setShowAddAnimation] = useState(false);
  const [imgError, setImgError] = useState(false);
  const exchangeRate = useUsdToSypRate() || EXCHANGE_RATE;

  // حساب الأسعار
  const originalPriceSYP = product.customer_price || product.price || 0;
  const displayedPriceSYP = Math.round(originalPriceSYP * MARKUP_FACTOR);
  const displayedPriceUSD = displayedPriceSYP / exchangeRate;
  const doublePriceSYP = displayedPriceSYP * FAKE_DOUBLE_FACTOR;
  const doublePriceUSD = doublePriceSYP / exchangeRate;
  const discountPercent = 50;

  // معطيات المنتج
  const imageUrl = product.images?.[0] || product.thumbnail_url || product.image_url || product.image || '';
  const productTitle = product.title_ar || product.title || product.name || 'منتج';
  const productStock = product.stock ?? 10;
  const productRatingCount = Number(product.review_count ?? product.rating_count ?? 0);
  const productRatingAverage = Number(product.avg_rating ?? product.rating_avg ?? product.rating ?? 0);

  // إعدادات الحجم
  const sizeConfig = {
    small: { image: 'h-28', title: 'text-xs line-clamp-1', price: 'text-sm', heartBtn: 'w-7 h-7', heart: 'w-4 h-4' },
    normal: { image: 'h-36', title: 'text-sm line-clamp-2', price: 'text-base', heartBtn: 'w-8 h-8', heart: 'w-4.5 h-4.5' },
    large: { image: 'h-48', title: 'text-base line-clamp-2', price: 'text-lg', heartBtn: 'w-10 h-10', heart: 'w-5 h-5' },
  };
  const cfg = sizeConfig[size] || sizeConfig.normal;

  const handleFavorite = useCallback(async (e) => {
    e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);
    const newState = !isFav;
    setIsFav(newState);
    try { onFavoriteChange?.(product.id, newState); }
    catch (err) { setIsFav(!newState); }
    finally { setFavLoading(false); }
  }, [product.id, isFav, favLoading, onFavoriteChange]);

  const handleAddToCart = useCallback(async (e) => {
    e?.stopPropagation();
    if (isAddingToCart || productStock < 1) return;
    setIsAddingToCart(true);
    setShowAddAnimation(true);
    try { onCartAdd?.(product); }
    catch (err) { console.error('خطأ في إضافة المنتج:', err); }
    finally {
      setTimeout(() => setIsAddingToCart(false), 500);
      setTimeout(() => setShowAddAnimation(false), 1500);
    }
  }, [product, isAddingToCart, productStock, onCartAdd]);

  const handleCardClick = useCallback(() => {
    navigate(`/product/${product.id}`);
  }, [product.id, navigate]);

  return (
    <motion.div
      className="w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E8EAED] cursor-pointer relative group"
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(11, 37, 69, 0.12)' }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleCardClick}
      layout
    >
      {/* ===== صندوق الصورة — نسبة 1:1 مع خلفية بيضاء ===== */}
      <div className={`relative ${cfg.image} aspect-square overflow-hidden bg-white`}>
        {!imgError && imageUrl ? (
          <img
            src={imageUrl}
            alt={productTitle}
            className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <ProductImageFallback title={productTitle} />
        )}

        {/* شارة الخصم */}
        <div
          className="absolute top-2 left-2 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md"
          style={{ background: 'linear-gradient(135deg, #FF7F11, #E16200)' }}
        >
          خصم {discountPercent}%
        </div>

        {/* طبقة نفاد المخزون */}
        {productStock < 1 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-black text-sm bg-red-500 px-3 py-1 rounded-full">نفذ المخزون</span>
          </div>
        )}

        {/* زر المفضلة */}
        <motion.button
          className={`absolute top-2 right-2 ${cfg.heartBtn} rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md z-10 border border-gray-100`}
          onClick={handleFavorite}
          whileTap={{ scale: 0.85 }}
          disabled={favLoading}
        >
          <Heart
            className={`${cfg.heart} transition-colors duration-200 ${
              isFav ? 'fill-red-500 text-red-500' : 'text-[#0B2545]/40 group-hover:text-red-400'
            }`}
          />
        </motion.button>

        {/* زر الإضافة السريعة عند التحوّم */}
        <AnimatePresence>
          {showQuickView && isHovered && productStock > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-xs px-4 py-1.5 rounded-full flex items-center gap-1 font-bold shadow-lg whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #0B2545, #134074)' }}
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>أضف للسلة</span>
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ===== محتوى البطاقة ===== */}
      <div className="p-3 space-y-1.5" dir="rtl">

        {/* الفئة */}
        {product.category && (
          <span className="text-[10px] text-[#588157] font-bold bg-[#F4F7F4] px-2 py-0.5 rounded-full">
            {product.category}
          </span>
        )}

        {/* الاسم */}
        <h3 className={`font-bold text-[#0B2545] ${cfg.title} leading-snug`}>
          {productTitle}
        </h3>

        {/* التقييم */}
        {productRatingCount > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-500">
              {productRatingAverage.toFixed(1)} ({productRatingCount})
            </span>
          </div>
        )}

        {/* الأسعار */}
        <div className="space-y-0.5">
          {/* السعر المشطوب */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-300 line-through">{doublePriceSYP.toLocaleString('en-US')} ل.س</span>
            <span className="text-[9px] text-gray-300 line-through">${doublePriceUSD.toFixed(2)}</span>
          </div>
          {/* السعر الحالي */}
          <div className="flex items-center gap-1.5">
            <span className={`font-black text-[#E16200] ${cfg.price}`}>{displayedPriceSYP.toLocaleString('en-US')} ل.س</span>
            <span className="text-xs text-gray-400">${displayedPriceUSD.toFixed(2)}</span>
          </div>
        </div>

        {/* زر إضافة للسلة */}
        <div className="relative pt-1">
          <AddToCartButton
            onClick={(e) => { if (e) e.stopPropagation(); handleAddToCart(null); }}
            disabled={isAddingToCart || productStock < 1}
            isLoading={isAddingToCart}
            label="أضف إلى السلة"
            className="h-9 text-xs w-full"
          />

          {/* أنيميشن الإضافة */}
          <AnimatePresence>
            {showAddAnimation && (
              <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-50">
                <SmartLottie
                  animationPath={ANIMATION_PRESETS.addToCartSuccess.path}
                  width={100} height={100}
                  trigger="never" autoplay={true} loop={false} hideWhenDone={true}
                />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* تحذير المخزون */}
        {productStock > 0 && productStock <= 5 && (
          <div className="text-[10px] text-orange-500 font-bold">⚠️ باقي {productStock} قطعة فقط</div>
        )}
      </div>
    </motion.div>
  );
});

// =====================================================
// شبكة المنتجات
// =====================================================
export function ProductGrid({ products, favorites = [], onFavoriteChange, onCartAdd, columns = 2, gap = 4, loading = false }) {
  const gridCols = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-2 md:grid-cols-3', 4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' };
  const gridGap = { 2: 'gap-2', 3: 'gap-3', 4: 'gap-4', 6: 'gap-6' };

  if (loading) {
    return (
      <div className={`grid ${gridCols[columns]} ${gridGap[gap]}`}>
        {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-bold text-[#0B2545]">لا توجد منتجات</h3>
        <p className="text-gray-400 text-sm mt-1">جرب البحث بكلمات مختلفة</p>
      </div>
    );
  }

  const favoriteIds = new Set(favorites.map((f) => f.product_id || f.id));

  return (
    <div className={`grid ${gridCols[columns]} ${gridGap[gap]}`}>
      <AnimatePresence mode="popLayout">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
          >
            <ProductCard
              product={product}
              isFavorited={favoriteIds.has(product.id)}
              onFavoriteChange={onFavoriteChange}
              onCartAdd={onCartAdd}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// =====================================================
// هيكل تحميل (Skeleton)
// =====================================================
function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E8EAED] animate-pulse">
      <div className="aspect-square bg-[#EEF4F8]" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 bg-[#EEF4F8] rounded w-16" />
        <div className="h-4 bg-[#EEF4F8] rounded w-full" />
        <div className="h-4 bg-[#EEF4F8] rounded w-3/4" />
        <div className="flex justify-between items-center gap-2">
          <div className="h-5 bg-[#EEF4F8] rounded w-20" />
          <div className="h-5 bg-[#EEF4F8] rounded w-12" />
        </div>
        <div className="h-9 bg-[#EEF4F8] rounded-xl w-full" />
      </div>
    </div>
  );
}

export default ProductCard;