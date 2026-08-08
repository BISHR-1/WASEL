// =====================================================
// WASEL — الصفحة الرئيسية 2.0 (بدون AutoScroll)
// ملف: src/pages/Home.jsx
// =====================================================

import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '../api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronLeft, Heart, Star, Package, Gift,
  Smartphone, Utensils, IceCream, Store, Sparkles, Truck,
  Plus, Minus, Crown, ShoppingBag, Flame, ArrowLeft,
  MapPin, Shield, Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/components/cart/CartContext';
import { createPageUrl } from '@/utils';
import PriceDisplay from '@/components/common/PriceDisplay';
import { toast } from 'sonner';
import { initializePushNotifications } from '@/services/pushNotifications';
import { supabase } from '@/lib/supabase';
import { interleaveByCategory, scoreItemsByBehavior } from '@/lib/recommendationSignals';
import SmartLottie from '@/components/animations/SmartLottie';
import { ANIMATION_PRESETS } from '@/components/animations/animationPresets';
import AddToCartButton from '@/components/buttons/AddToCartButton';
import ProductDetailModal from '@/components/common/ProductDetailModal';
import { useDarkMode } from '@/lib/DarkModeContext';
import { attachRatingsFromReviews, normalizeItemRating } from '@/lib/itemRatings';
import AdBanner from '@/components/ads/AdBanner';

const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || ''));

// =====================================================
// إعدادات الأصناف مع التدرجات الجديدة
// =====================================================
const CATEGORY_CONFIG = {
  electronics: { label: 'الإلكترونيات', icon: Smartphone, color: '#0B2545', bg: '#EEF4F8' },
  food:        { label: 'أطعمة',          icon: Utensils,   color: '#588157', bg: '#F4F7F4' },
  restaurants: { label: 'مطاعم',          icon: Utensils,   color: '#E16200', bg: '#FFF0E5' },
  sweets:      { label: 'حلويات',         icon: IceCream,   color: '#9333EA', bg: '#F5F3FF' },
  supermarket: { label: 'سوبرماركت',      icon: Store,      color: '#0B2545', bg: '#EEF4F8' },
  gifts:       { label: 'هدايا مميزة',    icon: Gift,       color: '#E16200', bg: '#FFF0E5' },
  packages:    { label: 'باقات وعروض',    icon: Package,    color: '#0B2545', bg: '#EEF4F8' },
  other:       { label: 'منتجات متنوعة',  icon: ShoppingBag,color: '#588157', bg: '#F4F7F4' },
};

// =====================================================
// شبكة الأصناف الثابتة
// =====================================================
const SHOP_CATEGORIES = [
  { name: 'السوبرماركت', link: 'Supermarket', image: '/categories/supermarket.png' },
  { name: 'المطاعم', link: 'Restaurants', image: '/categories/restaurants.png' },
  { name: 'الحلويات', link: 'Sweets', image: '/categories/sweets.png' },
  { name: 'الإلكترونيات', link: 'Electronics', image: '/categories/electronics.png' },
  { name: 'الهدايا', link: 'Gifts', image: '/categories/gifts.png' },
  { name: 'الباقات', link: 'Packages', image: '/categories/packages.png' },
];

// =====================================================
// شارات الثقة — بدون ذكر طريقة التوصيل
// =====================================================
const TRUST_BADGES = [
  { emoji: '🔒', label: 'دفع آمن 100%' },
  { emoji: '⚡', label: 'تنفيذ سريع' },
  { emoji: '💬', label: 'دعم واتساب' },
  { emoji: '⭐', label: 'خدمة موثوقة' },
];

// =====================================================
// مكوّن بطاقة منتج مصغّرة داخل الصفحة الرئيسية
// =====================================================
function HomeProductCard({ item, onAdd, onRemove, onUpdate, onOpenDetail, cartQty, isDarkMode }) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = item.image_url || item.image || '';

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 12px 28px rgba(11,37,69,0.12)' }}
      whileTap={{ scale: 0.98 }}
      dir="rtl"
      className={`shrink-0 rounded-2xl overflow-hidden border transition-shadow
        ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E8EAED]'}
        min-w-[160px] max-w-[180px] shadow-sm`}
    >
      {/* صورة المنتج — نسبة 1:1 وخلفية بيضاء */}
      <div
        className="w-full aspect-square bg-white flex items-center justify-center cursor-pointer overflow-hidden"
        onClick={() => onOpenDetail?.(item)}
      >
        {!imgError && imgSrc ? (
          <img
            src={imgSrc}
            alt={item.name}
            className="w-[85%] h-[85%] object-contain transition-transform duration-300 hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#EEF4F8]">
            <span className="text-4xl opacity-30">📦</span>
          </div>
        )}
      </div>

      {/* معلومات المنتج */}
      <div className="p-2.5">
        <h4 className={`font-bold text-sm truncate mb-1 ${isDarkMode ? 'text-white' : 'text-[#0B2545]'}`}>
          {item.name}
        </h4>
        <PriceDisplay basePrice={item.price || item.customer_price} />

        {/* أزرار الكمية */}
        <div className="flex items-center justify-center gap-2 mt-2">
          {cartQty > 0 ? (
            <>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => { e.stopPropagation(); if (cartQty <= 1) onRemove(item.id); else onUpdate(item.id, cartQty - 1); }}
                className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm"
              >
                <Minus className="w-3.5 h-3.5" />
              </motion.button>
              <span className={`text-base font-black min-w-[20px] text-center ${isDarkMode ? 'text-white' : 'text-[#0B2545]'}`}>{cartQty}</span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => { e.stopPropagation(); onAdd(item); }}
                className="w-8 h-8 rounded-full text-white flex items-center justify-center shadow-sm"
                style={{ background: 'linear-gradient(135deg, #0B2545, #134074)' }}
              >
                <Plus className="w-3.5 h-3.5" />
              </motion.button>
            </>
          ) : (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => { e.stopPropagation(); onAdd(item); }}
              className="w-9 h-9 rounded-full text-white flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #FF7F11, #E16200)' }}
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// =====================================================
// صف عرض أفقي قابل للسحب (بدون auto-scroll)
// =====================================================
function ManualScrollRow({ items, title, titleColor = '#0B2545', icon: Icon, onAdd, onRemove, onUpdate, onOpenDetail, getCartQty, isDarkMode, onViewAll }) {
  if (!items || items.length < 2) return null;

  return (
    <div dir="rtl" className="mb-8">
      {/* رأس القسم */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: titleColor + '20' }}>
              <Icon className="w-4 h-4" style={{ color: titleColor }} />
            </div>
          )}
          <h3 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-[#0B2545]'}`}>{title}</h3>
        </div>
        {onViewAll && (
          <button onClick={onViewAll} className="flex items-center gap-1 text-sm font-bold" style={{ color: titleColor }}>
            الكل <ArrowLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* الصف الأفقي — قابل للسحب يدوياً */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ direction: 'rtl' }}>
        {items.map((item, idx) => (
          <HomeProductCard
            key={`${title}-${idx}-${item.id}`}
            item={item}
            onAdd={onAdd}
            onRemove={onRemove}
            onUpdate={onUpdate}
            onOpenDetail={onOpenDetail}
            cartQty={getCartQty(item.id)}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>
    </div>
  );
}

// =====================================================
// المكوّن الرئيسي — الصفحة الرئيسية
// =====================================================
const Home = () => {
  const navigate = useNavigate();
  const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();
  const { isDarkMode } = useDarkMode();

  const [favoriteProductIds, setFavoriteProductIds] = useState([]);
  const [likedProductId, setLikedProductId] = useState(null);
  const [addedToCartProductId, setAddedToCartProductId] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [recentReviews, setRecentReviews] = useState([]);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [isWaselPlusMember, setIsWaselPlusMember] = useState(false);

  const getCartQty = (itemId) => {
    const safe = Array.isArray(cartItems) ? cartItems : [];
    return safe.find((i) => i?.id === itemId)?.quantity || 0;
  };

  // تهيئة الإشعارات
  useEffect(() => { initializePushNotifications(); }, []);

  // تحميل الدليل الاجتماعي
  useEffect(() => {
    const loadSocialProof = async () => {
      try {
        const [reviewsRes, ordersRes] = await Promise.all([
          supabase.from('reviews').select('rating, comment, created_at').gt('rating', 3).order('created_at', { ascending: false }).limit(6),
          supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'delivered'),
        ]);
        if (reviewsRes.data) setRecentReviews(reviewsRes.data.filter((r) => r.comment?.trim()));
        if (ordersRes.count) setDeliveredCount(ordersRes.count);
      } catch (_) {}
    };
    loadSocialProof();
  }, []);

  // تلاشي أنيميشن القلب
  useEffect(() => {
    if (!likedProductId) return;
    const t = setTimeout(() => setLikedProductId(null), 1500);
    return () => clearTimeout(t);
  }, [likedProductId]);

  // تحميل بيانات المنتجات
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['home-products'],
    queryFn: async () => {
      const list = await base44.entities.Product.list({ limit: 20, sort: { created_date: -1 } });
      const norm = Array.isArray(list) ? list.map((i) => normalizeItemRating(i)) : [];
      return await attachRatingsFromReviews(norm, { itemType: 'product' });
    },
  });

  const { data: gifts = [] } = useQuery({
    queryKey: ['home-gifts'],
    queryFn: async () => {
      const list = await base44.entities.Gift.list({ limit: 12, sort: { created_date: -1 } });
      const norm = Array.isArray(list) ? list.map((i) => normalizeItemRating(i)) : [];
      return await attachRatingsFromReviews(norm, { itemType: 'gift' });
    },
  });

  const { data: packages = [] } = useQuery({
    queryKey: ['home-packages'],
    queryFn: async () => {
      const list = await base44.entities.Package.list({ limit: 12, sort: { created_date: -1 } });
      const norm = Array.isArray(list) ? list.map((i) => normalizeItemRating(i)) : [];
      return await attachRatingsFromReviews(norm, { itemType: 'package' });
    },
  });

  // الأكثر مبيعاً
  const { data: bestSelling = [] } = useQuery({
    queryKey: ['best-selling', products],
    enabled: products.length > 0,
    queryFn: async () => {
      try {
        const { data: orderItems } = await supabase.from('order_items').select('product_name, product_id, quantity, price, image_url');
        if (!orderItems?.length) return products.slice(0, 10);
        const map = {};
        orderItems.forEach((oi) => {
          const k = oi.product_name || oi.product_id;
          if (!k) return;
          if (!map[k]) map[k] = { name: k, totalQty: 0, product_id: oi.product_id, image_url: oi.image_url, price: oi.price };
          map[k].totalQty += oi.quantity || 1;
        });
        return Object.values(map).sort((a, b) => b.totalQty - a.totalQty).slice(0, 12).map((s) => {
          const match = products.find((p) => p.id === s.product_id || p.name === s.name);
          return match ? { ...match, _soldCount: s.totalQty } : { id: s.product_id || s.name, name: s.name, price: s.price, image_url: s.image_url, _soldCount: s.totalQty };
        }).filter(Boolean);
      } catch { return products.slice(0, 10); }
    },
  });

  const normalizeItem = (item, itemType) => ({
    ...normalizeItemRating(item),
    item_type: itemType,
    name: item?.name || item?.name_ar || 'منتج',
    image_url: item?.image_url || item?.image || item?.images?.[0] || '',
    price: Number(item?.price || item?.customer_price || item?.base_price || 0),
    customer_price: Number(item?.customer_price || item?.price || item?.base_price || 0),
    description: item?.description || item?.details || item?.description_ar || '',
  });

  const handleAddToCart = (product) => {
    addToCart(product);
    setAddedToCartProductId(product.id);
    setTimeout(() => setAddedToCartProductId(null), 1500);
  };

  // بيانات الأصناف
  const foodPackages = useMemo(() => packages.map((p) => normalizeItem(p, 'package')), [packages]);
  const giftItems = useMemo(() => gifts.map((g) => normalizeItem(g, 'gift')), [gifts]);

  return (
    <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-[#F8F9FA]'} min-h-screen pb-28 font-cairo`}>
      <main className="max-w-[1400px] mx-auto">

        {/* ===== Hero Banner ===== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-3 mt-3 mb-4 overflow-hidden rounded-2xl"
        >
          <img
            src="/hero/home-hero.png"
            alt=""
            className="block h-[200px] w-full object-cover object-center md:h-[350px]"
          />
        </motion.div>

        <div className="px-3">
          {/* ===== شارات الثقة ===== */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5" dir="rtl">
            {TRUST_BADGES.map((badge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-center gap-2 rounded-xl p-2.5 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E8EAED]'} shadow-sm`}
              >
                <span className="text-lg shrink-0">{badge.emoji}</span>
                <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-200' : 'text-[#0B2545]'}`}>{badge.label}</span>
              </motion.div>
            ))}
          </div>

          {/* ===== شبكة الأصناف الثابتة — 3 أعمدة موبايل، 6 ديسكتوب ===== */}
          <div className="mb-8">
            <h2 className={`font-black text-lg mb-4 ${isDarkMode ? 'text-white' : 'text-[#0B2545]'}`} dir="rtl">
              تسوّق حسب الفئة
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {SHOP_CATEGORIES.map((cat, i) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(createPageUrl(cat.link))}
                  className={`flex flex-col items-center gap-2 text-center cursor-pointer p-3 rounded-2xl border transition-all
                    ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-[#E8EAED] hover:border-[#FF7F11]/40'} shadow-sm hover:shadow-md`}
                >
                  <div className="flex h-[100px] w-[100px] items-center justify-center rounded-xl bg-white p-2">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <span className={`text-sm font-extrabold leading-tight ${isDarkMode ? 'text-gray-200' : 'text-[#0B2545]'}`}>
                    {cat.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ===== عرض ترويجي ===== */}
          <div className="grid grid-cols-2 gap-3 mb-6" dir="rtl">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => navigate(createPageUrl('Cart'))}
              className="rounded-2xl p-4 cursor-pointer shadow-md hover:shadow-lg transition-shadow text-white"
              style={{ background: 'linear-gradient(135deg, #0B2545, #134074)' }}
            >
              <p className="font-extrabold text-sm mb-1">🚀 رسوم مخفّضة</p>
              <p className="text-white/75 text-[11px]">أول 3 طلبات بتكلفة مخفّضة حصرية</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => navigate(createPageUrl('Gifts'))}
              className="rounded-2xl p-4 cursor-pointer shadow-md hover:shadow-lg transition-shadow text-white"
              style={{ background: 'linear-gradient(135deg, #FF7F11, #E16200)' }}
            >
              <p className="font-extrabold text-sm mb-1">🎁 هدايا بالبطاقة</p>
              <p className="text-white/75 text-[11px]">أرسل بطاقة تهنئة مجانية مع كل هدية</p>
            </motion.div>
          </div>

          {/* ===== الأكثر مبيعاً — صف أفقي يدوي ===== */}
          <ManualScrollRow
            items={bestSelling}
            title="الأكثر مبيعاً 🔥"
            titleColor="#E16200"
            icon={Flame}
            onAdd={handleAddToCart}
            onRemove={removeFromCart}
            onUpdate={updateQuantity}
            onOpenDetail={(item) => { setDetailItem(item); setShowDetailModal(true); }}
            getCartQty={getCartQty}
            isDarkMode={isDarkMode}
            onViewAll={() => navigate(createPageUrl('Supermarket'))}
          />

          {/* ===== السلال الغذائية — صف أفقي يدوي ===== */}
          <ManualScrollRow
            items={foodPackages}
            title="السلال الغذائية الأكثر طلباً"
            titleColor="#588157"
            icon={Package}
            onAdd={handleAddToCart}
            onRemove={removeFromCart}
            onUpdate={updateQuantity}
            onOpenDetail={(item) => { setDetailItem(item); setShowDetailModal(true); }}
            getCartQty={getCartQty}
            isDarkMode={isDarkMode}
            onViewAll={() => navigate(createPageUrl('Packages'))}
          />

          {/* ===== الهدايا — صف أفقي يدوي ===== */}
          <ManualScrollRow
            items={giftItems}
            title="هدايا مميزة لأحبائكم"
            titleColor="#E16200"
            icon={Gift}
            onAdd={handleAddToCart}
            onRemove={removeFromCart}
            onUpdate={updateQuantity}
            onOpenDetail={(item) => { setDetailItem(item); setShowDetailModal(true); }}
            getCartQty={getCartQty}
            isDarkMode={isDarkMode}
            onViewAll={() => navigate(createPageUrl('Gifts'))}
          />

          {/* ===== شبكة أحدث المنتجات ===== */}
          <div className="mt-4 mb-8">
            <h2 className={`font-black text-lg mb-4 ${isDarkMode ? 'text-white' : 'text-[#0B2545]'}`} dir="rtl">
              أحدث المنتجات
            </h2>
            {productsLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-4">
                  <SmartLottie animationPath={ANIMATION_PRESETS.pageLoading.path} width={80} height={80} trigger="never" autoplay={true} loop={true} />
                  <p className="text-gray-400 font-medium text-sm">جاري تحميل المنتجات...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3" dir="rtl">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E8EAED]'} rounded-2xl shadow-sm overflow-hidden border w-full`}
                  >
                    {/* صورة المنتج — نسبة 1:1 */}
                    <div
                      className="w-full aspect-square bg-white flex items-center justify-center cursor-pointer overflow-hidden"
                      onClick={() => { setDetailItem(product); setShowDetailModal(true); }}
                    >
                      <img
                        src={product.image_url || 'https://placehold.co/400x400/EEF4F8/0B2545?text=Wasel'}
                        alt={product.name}
                        className="w-[85%] h-[85%] object-contain hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/EEF4F8/0B2545?text=Wasel'; }}
                      />
                    </div>
                    <div className="p-3" dir="rtl">
                      <h4 className={`font-bold text-sm truncate mb-1 ${isDarkMode ? 'text-white' : 'text-[#0B2545]'}`}>{product.name}</h4>
                      <p className="text-xs text-gray-400 capitalize mb-2">{product.category}</p>
                      <div className="flex items-center gap-1 text-xs mb-2">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="font-bold text-[#0B2545]">{Number(product.avg_rating ?? product.rating ?? 0).toFixed(1)}</span>
                        <span className="text-gray-400">({Number(product.review_count ?? 0)})</span>
                      </div>
                      <PriceDisplay basePrice={product.price} />
                      <AddToCartButton
                        onClick={() => handleAddToCart(product)}
                        isLoading={addedToCartProductId === product.id}
                        label="أضف للسلة"
                        className="mt-2 h-8 text-xs w-full"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* ===== الدليل الاجتماعي — آراء العملاء ===== */}
          {(recentReviews.length > 0 || deliveredCount > 0) && (
            <div className="mb-8" dir="rtl">
              {deliveredCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center mb-4 py-4 rounded-2xl border border-[#A3B18A]/30"
                  style={{ background: 'linear-gradient(135deg, #F4F7F4, #F8F9FA)' }}
                >
                  <p className="text-lg font-black text-[#588157]">
                    📦 {deliveredCount.toLocaleString()}+ طلب تم تنفيذه بنجاح
                  </p>
                  <p className="text-sm text-gray-400 mt-1">عائلات سورية تبتسم بسببكم ❤️</p>
                </motion.div>
              )}

              {recentReviews.length > 0 && (
                <>
                  <h3 className={`font-black text-lg mb-3 ${isDarkMode ? 'text-white' : 'text-[#0B2545]'}`}>
                    ⭐ آراء عملائنا
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {recentReviews.map((review, idx) => (
                      <div
                        key={idx}
                        className={`min-w-[230px] max-w-[270px] rounded-2xl p-4 border shadow-sm shrink-0
                          ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E8EAED]'}`}
                      >
                        <div className="flex gap-0.5 mb-2">
                          {Array.from({ length: review.rating }, (_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          ))}
                        </div>
                        <p className={`text-xs leading-relaxed line-clamp-3 ${isDarkMode ? 'text-gray-300' : 'text-[#475569]'}`}>
                          {review.comment}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2">
                          {new Date(review.created_at).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===== إعلان ===== */}
          <div className="max-w-4xl mx-auto py-4">
            <AdBanner format="auto" className="rounded-xl" />
          </div>
        </div>

        {/* ===== مودال تفاصيل المنتج ===== */}
        <ProductDetailModal
          item={detailItem}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onAddToCart={handleAddToCart}
        />
      </main>
    </div>
  );
};

export default Home;
