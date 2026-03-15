
import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '../api/base44Client';

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Bell, Heart, Star, Package, Gift, Smartphone, Utensils, IceCream, Store, Sparkles, Truck, Plus } from 'lucide-react';
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

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));

const Home = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isDarkMode } = useDarkMode();
  const [isWaselPlusMember, setIsWaselPlusMember] = useState(false);
  const [favoriteProductIds, setFavoriteProductIds] = useState([]);
  const [likedProductId, setLikedProductId] = useState(null);
  const [addedToCartProductId, setAddedToCartProductId] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [recentReviews, setRecentReviews] = useState([]);
  const [deliveredCount, setDeliveredCount] = useState(0);

  // تهيئة الإشعارات عند فتح الصفحة الرئيسية
  useEffect(() => {
    initializePushNotifications();
  }, []);

  // جلب التقييمات الحقيقية وعدد الطلبات المسلّمة
  useEffect(() => {
    const loadSocialProof = async () => {
      try {
        const [reviewsRes, ordersRes] = await Promise.all([
          supabase.from('reviews').select('rating, comment, created_at').gt('rating', 3).order('created_at', { ascending: false }).limit(6),
          supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'delivered'),
        ]);
        if (reviewsRes.data) setRecentReviews(reviewsRes.data.filter(r => r.comment?.trim()));
        if (ordersRes.count) setDeliveredCount(ordersRes.count);
      } catch (_) { /* silent */ }
    };
    loadSocialProof();
  }, []);

  // Auto-hide heart burst animation
  useEffect(() => {
    if (!likedProductId) return;
    const timer = setTimeout(() => {
      setLikedProductId(null);
    }, 1500);
    return () => clearTimeout(timer);
  }, [likedProductId]);

  // Auto-hide add-to-cart animation
  useEffect(() => {
    if (!addedToCartProductId) return;
    const timer = setTimeout(() => {
      setAddedToCartProductId(null);
    }, 1500);
    return () => clearTimeout(timer);
  }, [addedToCartProductId]);

  useEffect(() => {
    const loadMembershipState = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const userEmail = user?.email;
        if (!userEmail) {
          setIsWaselPlusMember(false);
          return;
        }

        const { data, error } = await supabase
          .from('wasel_plus_memberships')
          .select('status, end_date, trial_end')
          .eq('user_email', userEmail)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !data) {
          setIsWaselPlusMember(false);
          return;
        }

        const now = Date.now();
        const activeEnd = data?.status === 'active' && data?.end_date ? Date.parse(data.end_date) : null;
        const trialEnd = data?.status === 'trialing' && data?.trial_end ? Date.parse(data.trial_end) : null;
        const isActive =
          (data.status === 'active' && (!activeEnd || activeEnd > now)) ||
          (data.status === 'trialing' && (!trialEnd || trialEnd > now));

        setIsWaselPlusMember(Boolean(isActive));
      } catch (error) {
        console.error('Failed to load Wasel+ state on home:', error);
        setIsWaselPlusMember(false);
      }
    };

    loadMembershipState();
  }, []);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['home-products'],
    queryFn: async () => {
      const list = await base44.entities.Product.list({ limit: 10, sort: { created_date: -1 } });
      const normalized = Array.isArray(list) ? list.map((item) => normalizeItemRating(item)) : [];
      return await attachRatingsFromReviews(normalized, { itemType: 'product' });
    }
  });

  useEffect(() => {
    let mounted = true;

    const loadFavoriteIds = async () => {
      try {
        const localFavorites = JSON.parse(localStorage.getItem('wasel_favorites') || '[]');
        const localIds = localFavorites.map((item) => item?.id).filter(Boolean);

        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        if (!userId) {
          if (mounted) setFavoriteProductIds(localIds);
          return;
        }

        const productIds = products.map((product) => product?.id).filter(Boolean);
        const uuidProductIds = productIds.filter((id) => isUuid(id));
        if (!uuidProductIds.length) {
          if (mounted) setFavoriteProductIds(localIds);
          return;
        }

        const { data, error } = await supabase
          .from('favorites')
          .select('item_id')
          .eq('user_id', userId)
          .eq('item_type', 'product')
          .in('item_id', uuidProductIds);

        if (error) throw error;

        const remoteIds = Array.isArray(data) ? data.map((row) => row.item_id) : [];
        const merged = [...new Set([...localIds, ...remoteIds])];
        if (mounted) setFavoriteProductIds(merged);
      } catch (error) {
        console.error('Failed to load favorites on home:', error);
      }
    };

    loadFavoriteIds();

    return () => {
      mounted = false;
    };
  }, [products]);

  const handleToggleFavorite = async (event, product) => {
    event.stopPropagation();

    const productId = product?.id;
    if (!productId) return;

    try {
      const currentlyFavorited = favoriteProductIds.includes(productId);
      const localFavorites = JSON.parse(localStorage.getItem('wasel_favorites') || '[]');

      if (currentlyFavorited) {
        const updatedLocal = localFavorites.filter((fav) => fav.id !== productId);
        localStorage.setItem('wasel_favorites', JSON.stringify(updatedLocal));
        setFavoriteProductIds((prev) => prev.filter((id) => id !== productId));

        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (userId && isUuid(productId)) {
          await supabase
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('item_type', 'product')
            .eq('item_id', productId);
        }

        toast.success('تمت الإزالة من المفضلة');
        return;
      }

      const updatedLocal = [...localFavorites, { ...product, addedAt: new Date().toISOString() }];
      localStorage.setItem('wasel_favorites', JSON.stringify(updatedLocal));
      setFavoriteProductIds((prev) => [...new Set([...prev, productId])]);
      setLikedProductId(productId); // Trigger heart animation

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId && isUuid(productId)) {
        const { data: existing } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', userId)
          .eq('item_type', 'product')
          .eq('item_id', productId)
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase
            .from('favorites')
            .insert({
              user_id: userId,
              item_type: 'product',
              item_id: productId,
            });
        }
      }

      toast.success('تمت الإضافة إلى المفضلة');
    } catch (error) {
      console.error('Failed to toggle favorite on home:', error);
      toast.error('تعذر تحديث المفضلة حالياً');
    }
  };

  const { data: gifts = [] } = useQuery({
    queryKey: ['home-gifts'],
    queryFn: async () => {
      const list = await base44.entities.Gift.list({ limit: 12, sort: { created_date: -1 } });
      const normalized = Array.isArray(list) ? list.map((item) => normalizeItemRating(item)) : [];
      return await attachRatingsFromReviews(normalized, { itemType: 'gift' });
    }
  });

  const { data: packages = [] } = useQuery({
    queryKey: ['home-packages'],
    queryFn: async () => {
      const list = await base44.entities.Package.list({ limit: 12, sort: { created_date: -1 } });
      const normalized = Array.isArray(list) ? list.map((item) => normalizeItemRating(item)) : [];
      return await attachRatingsFromReviews(normalized, { itemType: 'package' });
    }
  });

  const categories = [
    { name: 'الرئيسية', link: 'Home', active: true },
    { name: 'مطاعم', link: 'Restaurants' },
    { name: 'حلويات', link: 'Sweets' },
    { name: 'ماركت', link: 'Supermarket' },
    { name: 'إلكترونيات', link: 'Electronics' },
  ];

  const shopByCategory = [
    { name: 'السوبرماركت', icon: Store, link: 'Supermarket', image: '/categories/supermarket.jpg', fallback: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop' },
    { name: 'المطاعم', icon: Utensils, link: 'Restaurants', image: '/categories/restaurants.jpg', fallback: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000&auto=format&fit=crop' },
    { name: 'الحلويات', icon: IceCream, link: 'Sweets', image: '/categories/sweets.jpg', fallback: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=1000&auto=format&fit=crop' },
    { name: 'الإلكترونيات', icon: Smartphone, link: 'Electronics', image: '/categories/electronics.jpg', fallback: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000&auto=format&fit=crop' },
    { name: 'الهدايا', icon: Gift, link: 'Gifts', image: '/categories/gifts.jpg', fallback: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1000&auto=format&fit=crop' },
    { name: 'الباقات', icon: Package, link: 'Packages', image: '/categories/packages.jpg', fallback: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1000&auto=format&fit=crop' },
    { name: 'قصص محلية', icon: Sparkles, link: 'LocalSpotlight', image: '/categories/local-spotlight.jpg', fallback: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1000&auto=format&fit=crop' },
    { name: 'تتبع الطلب', icon: Truck, link: 'TrackOrder', image: '/categories/track-order.jpg', fallback: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=1000&auto=format&fit=crop' },
  ];

  const handleAddToCart = (product) => {
    addToCart(product);
    setAddedToCartProductId(product.id);
  };

  const normalizeShowcaseItem = (item, itemType) => ({
    ...normalizeItemRating(item),
    item_type: itemType,
    name: item?.name || item?.name_ar || (itemType === 'gift' ? 'Gift Item' : 'Package Item'),
    image_url: item?.image_url || item?.image || item?.images?.[0] || 'https://placehold.co/400x400/F8FAFC/1F2933?text=Wasel',
    price: Number(item?.price || item?.customer_price || item?.base_price || 0),
    customer_price: Number(item?.customer_price || item?.price || item?.base_price || 0),
    description: item?.description || item?.details || item?.description_ar || '',
  });

  const mixedRecommendations = useMemo(() => {
    const mixed = [
      ...products.slice(0, 15).map((item) => normalizeShowcaseItem(item, 'product')),
      ...gifts.slice(0, 12).map((item) => normalizeShowcaseItem(item, 'gift')),
      ...packages.slice(0, 12).map((item) => normalizeShowcaseItem(item, 'package')),
    ].filter((item) => item?.id && item?.name);

    const ranked = scoreItemsByBehavior(mixed);
    return interleaveByCategory(ranked, 10);
  }, [products, gifts, packages]);

  const openMixedItem = (item) => {
    const type = String(item?.item_type || '').toLowerCase();
    const search = item?.name || '';

    if (type === 'gift') {
      navigate(createPageUrl('Gifts', { search }));
      return;
    }

    if (type === 'package') {
      navigate(createPageUrl('Packages', { search }));
      return;
    }

    handleAddToCart(item);
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-[#F7F8FC]'} min-h-screen pb-24 font-['Cairo']`}>
      <main className="max-w-[1400px] mx-auto">
        {/* Search Bar - Noon/Amazon style */}
        <div className="sticky top-0 z-20 bg-gradient-to-l from-[#1B4332] to-[#2D6A4F] px-4 py-3 shadow-md">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن منتجات، هدايا، مطاعم..."
              className="w-full bg-white rounded-xl py-3 pr-11 pl-4 text-sm text-[#1F2933] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFB000] shadow-sm"
              dir="rtl"
              onFocus={() => navigate(createPageUrl('Supermarket'))}
            />
          </div>
        </div>

        <div className="p-4">
        {isWaselPlusMember && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-2xl border border-[#D1FAE5] bg-gradient-to-r from-[#ECFDF5] to-[#F0F9FF] p-4 flex items-center gap-4"
            dir="rtl"
          >
            <SmartLottie
              animationPath={ANIMATION_PRESETS.premiumCrown.path}
              width={50}
              height={50}
              trigger="immediate"
              loop={true}
            />
            <div className="flex-1">
              <p className="font-extrabold text-[#065F46]">أنت مشترك في Wasel+ ⭐</p>
              <p className="text-xs text-[#0F766E] mt-1">خصوماتك الحصرية وتوصيلك المجاني مفعلان على الحساب.</p>
            </div>
          </motion.div>
        )}

        {/* Main Hero - Clear Value Proposition */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-2xl overflow-hidden h-44 md:h-52 mb-4 shadow-lg w-full">
          <img
            src="/hero/home-hero.jpg"
            className="w-full h-full object-contain object-center bg-[#E5E7EB]"
            alt="Banner"
            onError={(event) => {
              event.currentTarget.src = 'https://placehold.co/1600x640/F1F5F9/1F2933?text=Wasel+Hero';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-4 right-4 left-4 text-center" dir="rtl">
            <p className="text-white font-black text-xl md:text-2xl drop-shadow-lg mb-1">أرسل هدية أو طلبات لعائلتك في دَرْعَا بسهولة</p>
            <p className="text-white/90 text-xs md:text-sm">اختر المنتجات، ادفع من أي مكان في العالم، ونحن نوصلها داخل دَرْعَا</p>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4" dir="rtl">
          <div className={`flex items-center gap-2 rounded-xl p-2.5 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-[#E5E7EB]'} shadow-sm`}>
            <span className="text-lg">🔒</span>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-200' : 'text-[#1F2933]'}`}>دفع آمن</span>
          </div>
          <div className={`flex items-center gap-2 rounded-xl p-2.5 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-[#E5E7EB]'} shadow-sm`}>
            <span className="text-lg">🚚</span>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-200' : 'text-[#1F2933]'}`}>توصيل سريع داخل دَرْعَا</span>
          </div>
          <div className={`flex items-center gap-2 rounded-xl p-2.5 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-[#E5E7EB]'} shadow-sm`}>
            <span className="text-lg">💬</span>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-200' : 'text-[#1F2933]'}`}>دعم عبر واتساب</span>
          </div>
          <div className={`flex items-center gap-2 rounded-xl p-2.5 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-[#E5E7EB]'} shadow-sm`}>
            <span className="text-lg">⭐</span>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-200' : 'text-[#1F2933]'}`}>خدمة موثوقة للعائلات</span>
          </div>
        </div>

        {/* Promo Banners - عروض مغرية */}
        <div className="grid grid-cols-2 gap-3 mb-4" dir="rtl">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            onClick={() => navigate(createPageUrl('Cart'))}
            className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 cursor-pointer shadow-md hover:shadow-lg transition-shadow">
            <p className="text-white font-extrabold text-sm mb-1">🚚 توصيل مجاني</p>
            <p className="text-white/80 text-[11px]">أول 3 طلبات بتوصيل مجاني لجميع المستخدمين</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            onClick={() => navigate(createPageUrl('Cart'))}
            className="rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-4 cursor-pointer shadow-md hover:shadow-lg transition-shadow">
            <p className="text-white font-extrabold text-sm mb-1">🔥 رسوم خدمة 50%</p>
            <p className="text-white/80 text-[11px]">رسوم الخدمة $3 بدلاً من $6 لفترة محدودة</p>
          </motion.div>
        </div>

        {/* Category Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {categories.map(cat => (
            <Button key={cat.name} onClick={() => navigate(createPageUrl(cat.link))} variant={cat.active ? 'default' : 'outline'} className={`rounded-full whitespace-nowrap ${cat.active ? 'bg-[#0F172A] text-white hover:bg-[#111827]' : 'border-[#D1D5DB] text-[#1F2933] hover:bg-[#EEF2FF]'}`}>
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Shop by Category - enhanced grid */}
        <div className="mb-10">
          <h3 className={`font-black text-xl mb-5 ${isDarkMode ? 'text-white' : 'text-[#1F2933]'}`} dir="rtl">تسوق حسب الفئات</h3>
          <div className="grid grid-cols-4 gap-3">
            {shopByCategory.map(cat => (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} key={cat.name} onClick={() => navigate(createPageUrl(cat.link))} className={`flex flex-col items-center gap-2 text-center cursor-pointer p-2 rounded-2xl ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-white'} hover:shadow-md transition-all`}>
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#E5E7EB] shadow-sm bg-gradient-to-br from-[#F8FAFC] to-white">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = cat.fallback;
                    }}
                  />
                </div>
                <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-200' : 'text-[#1F2933]'} leading-tight`}>{cat.name}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div>
          <h3 className={`font-black text-xl mb-3 ${isDarkMode ? 'text-white' : 'text-[#1F2933]'}`} dir="rtl">أحدث المنتجات</h3>
          {productsLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-4">
                <SmartLottie
                  animationPath={ANIMATION_PRESETS.pageLoading.path}
                  width={80}
                  height={80}
                  trigger="never"
                  autoplay={true}
                  loop={true}
                />
                <p className="text-[#1F2933] font-semibold">جاري تحميل المنتجات...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
              {products.map(product => (
                <motion.div key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E7EB]'} rounded-xl shadow-sm overflow-hidden border w-full max-w-[260px] mx-auto`}>
                  <div className="relative">
                    <img
                      src={product.image_url || 'https://placehold.co/400x400/F9FAF8/1F2933?text=Wasel'}
                      alt={product.name}
                      className="w-full h-28 md:h-24 lg:h-28 object-contain bg-[#F8FAFC] p-2 cursor-pointer"
                      loading="lazy"
                      onClick={() => { setDetailItem(product); setShowDetailModal(true); }}
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(event) => handleToggleFavorite(event, product)}
                      className={`absolute top-1 right-1 h-8 w-8 rounded-full transition-colors ${favoriteProductIds.includes(product.id) ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C]' : 'bg-[#0F172A]/50 text-white hover:bg-[#111827]'}`}
                    >
                      <Heart className={`w-4 h-4 ${favoriteProductIds.includes(product.id) ? 'fill-current' : ''}`} />
                    </Button>
                    
                    {/* Heart Burst Animation */}
                    <AnimatePresence>
                      {likedProductId === product.id && (
                        <div className="absolute top-1 right-1">
                          <SmartLottie
                            animationPath={ANIMATION_PRESETS.heartBurst.path}
                            width={100}
                            height={100}
                            trigger="immediate"
                            hideWhenDone={true}
                          />
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-sm truncate mb-1 text-[#1F2933]">{product.name}</h4>
                    <p className="text-xs text-[#475569] capitalize mb-1">{product.category}</p>
                    <p className="text-xs text-[#64748B] line-clamp-2 min-h-[2rem] mb-2">{product.description || product.description_ar || 'بدون وصف حالياً'}</p>
                    <div className="flex items-center gap-1 text-xs mb-3">
                      <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                      <span className="font-bold text-[#1F2933]">{Number(product.avg_rating ?? product.rating_avg ?? product.rating ?? 0).toFixed(1)}</span>
                      <span className="text-[#94A3B8]">({Number(product.review_count ?? product.rating_count ?? 0)})</span>
                    </div>
                    <div className="flex flex-col gap-2 relative">
                      <PriceDisplay basePrice={product.price} />
                      <AddToCartButton
                        onClick={() => handleAddToCart(product)}
                        isLoading={addedToCartProductId === product.id}
                        label="أضف للسلة"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Mixed Smart Feed */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-xl text-[#1F2933]">اقتراحات مختلطة لك</h3>
            <span className="text-xs text-[#1D4ED8] font-semibold bg-blue-50 px-3 py-1 rounded-full">حسب بحثك واهتماماتك</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {mixedRecommendations.map((item) => {
              const itemType = String(item.item_type || '').toLowerCase();
              const isGiftOrPackage = itemType === 'gift' || itemType === 'package';

              return (
                <motion.div key={`mix-${item.item_type}-${item.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E7EB]'} rounded-xl shadow-sm overflow-hidden border w-full max-w-[280px] mx-auto`}>
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-28 md:h-24 lg:h-28 object-contain bg-[#F8FAFC] p-2 cursor-pointer"
                    loading="lazy"
                    onClick={() => { setDetailItem(item); setShowDetailModal(true); }}
                  />
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-bold text-sm text-[#1F2933] line-clamp-1">{item.name}</h4>
                      <Badge className="bg-[#E0F2FE] text-[#075985] border border-[#BAE6FD]">
                        {itemType === 'gift' ? 'هدية' : itemType === 'package' ? 'باقة' : 'منتج'}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#64748B] line-clamp-2 min-h-[2rem]">{item.description || 'وصف مختصر للمنتج'}</p>
                    <div className="flex items-center justify-between mt-2">
                      <PriceDisplay basePrice={item.price} />
                      <AddToCartButton
                        onClick={() => openMixedItem(item)}
                        isLoading={addedToCartProductId === item.id && !isGiftOrPackage}
                        label={'أضف للسلة'}
                        className="w-auto px-4"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Gifts Section */}
        <div className="mt-10">
          <h3 className="font-bold text-lg mb-3 text-[#1F2933]">الهدايا</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {gifts.slice(0, 4).map((rawItem) => {
              const item = normalizeShowcaseItem(rawItem, 'gift');
              return (
              <motion.div key={`${item.id}-${item.name}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E7EB]'} rounded-xl shadow-sm overflow-hidden border w-full max-w-[280px] mx-auto`}>
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-28 md:h-24 lg:h-28 object-contain bg-[#F8FAFC] p-2 cursor-pointer"
                  loading="lazy"
                  onClick={() => { setDetailItem(item); setShowDetailModal(true); }}
                />
                <div className="p-3">
                  <h4 className="font-bold text-sm mb-1 text-[#1F2933] line-clamp-1">{item.name}</h4>
                  <p className="text-xs text-[#64748B] line-clamp-2 min-h-[2rem]">{item.description || 'بدون وصف حالياً'}</p>
                  <div className="flex flex-col gap-2 mt-2 relative">
                    <PriceDisplay basePrice={item.price} />
                    <AddToCartButton
                      onClick={() => handleAddToCart(item)}
                      isLoading={addedToCartProductId === item.id}
                      label="أضف للسلة"
                    />
                  </div>
                </div>
              </motion.div>
              );
            })}
          </div>
        </div>
        </div>

        {/* Social Proof - آراء العملاء الحقيقية */}
        {(recentReviews.length > 0 || deliveredCount > 0) && (
          <div className="mb-8 px-1" dir="rtl">
            {deliveredCount > 0 && (
              <div className={`text-center mb-4 py-3 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-[#ECFDF5]'}`}>
                <p className={`text-lg font-black ${isDarkMode ? 'text-emerald-400' : 'text-[#065F46]'}`}>
                  📦 {deliveredCount.toLocaleString()}+ طلب تم توصيله بنجاح
                </p>
              </div>
            )}
            {recentReviews.length > 0 && (
              <>
                <h3 className={`font-black text-xl mb-3 ${isDarkMode ? 'text-white' : 'text-[#1F2933]'}`}>آراء عملائنا ⭐</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {recentReviews.map((review, idx) => (
                    <div key={idx} className={`min-w-[220px] max-w-[260px] rounded-xl p-3 border shadow-sm shrink-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E7EB]'}`}>
                      <div className="flex gap-0.5 mb-1">
                        {Array.from({ length: review.rating }, (_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                        ))}
                      </div>
                      <p className={`text-xs leading-relaxed line-clamp-3 ${isDarkMode ? 'text-gray-300' : 'text-[#475569]'}`}>{review.comment}</p>
                      <p className="text-[10px] text-[#94A3B8] mt-1">
                        {new Date(review.created_at).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <ProductDetailModal
          item={detailItem}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onAddToCart={handleAddToCart}
        />

        {/* إعلان أسفل المنتجات - بعيد عن أزرار الشراء */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <AdBanner format="auto" className="rounded-xl" />
        </div>
      </main>
    </div>
  );
};

export default Home;
