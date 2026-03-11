import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AppFooter from '@/components/common/AppFooter';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowRight, Clock, Info, ShoppingBag, MessageCircle, Plus, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from '../components/cart/CartContext';
import BackButton from '../components/common/BackButton';
import { toast } from 'sonner';
import OffersCarousel from '../components/common/OffersCarousel';
import PriceDisplay from '../components/common/PriceDisplay';
import { useLanguage } from '../components/common/LanguageContext';
import SmartLottie from '@/components/animations/SmartLottie';
import { ANIMATION_PRESETS } from '@/components/animations/animationPresets';

export default function RestaurantDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantId = urlParams.get('id');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const { addToCart } = useCart();
  const { language, t, dir } = useLanguage();
  const [addedToCartItemId, setAddedToCartItemId] = useState(null);

  // Auto-hide add-to-cart animation
  useEffect(() => {
    if (!addedToCartItemId) return;
    const timer = setTimeout(() => {
      setAddedToCartItemId(null);
    }, 1500);
    return () => clearTimeout(timer);
  }, [addedToCartItemId]);

  // Handle mobile back button
  useEffect(() => {
    const handlePopState = (e) => {
      if (selectedItem) {
        e.preventDefault();
        setSelectedItem(null);
        window.history.pushState(null, '', window.location.href);
      } else {
        navigate(createPageUrl('Restaurants'));
      }
    };

    // Add initial state
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedItem, navigate]);

  const { data: restaurant, isLoading: isLoadingRestaurant, isError: isRestaurantError } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => base44.entities.Restaurant.get(restaurantId),
    enabled: !!restaurantId,
  });

  const { data: menuItems, isLoading: isLoadingMenu } = useQuery({
    queryKey: ['menuItems', restaurantId],
    queryFn: async () => {
      try {
        console.log('[RestaurantDetail] Fetching menu items for restaurant:', restaurantId);
        const result = await base44.entities.MenuItem.list();
        const items = Array.isArray(result) ? result : [];
        console.log('[RestaurantDetail] All menu items:', items.length);
        // Filter by restaurant_id
        const filtered = items.filter(item => item.restaurant_id === restaurantId);
        console.log('[RestaurantDetail] Filtered menu items:', filtered.length);
        return filtered;
      } catch (error) {
        console.error('[RestaurantDetail] Failed to fetch menu items:', error);
        return [];
      }
    },
    enabled: !!restaurantId,
  });

  // Localize Menu Items (must be before early returns)
  const localizedMenuItems = useMemo(() => {
    return (Array.isArray(menuItems) ? menuItems : []).map(item => ({
      ...item,
      name: (language === 'en' && item?.name_en) ? item.name_en : item?.name,
      description: (language === 'en' && item?.description_en) ? item.description_en : item?.description,
      category: (language === 'en' && item?.category_en) ? item.category_en : item?.category
    }));
  }, [menuItems, language]);

  // Localize Restaurant (must be before early returns)
  const localizedRestaurant = useMemo(() => {
    if (!restaurant) return null;
    return {
      ...restaurant,
      name: (language === 'en' && restaurant.name_en) ? restaurant.name_en : restaurant.name,
      description: (language === 'en' && restaurant.description_en) ? restaurant.description_en : restaurant.description,
      cuisine_type: (language === 'en' && restaurant.cuisine_type_en) ? restaurant.cuisine_type_en : restaurant.cuisine_type
    };
  }, [restaurant, language]);

  // Restaurant item offers (must be before early returns)
  const restaurantItemOffers = useMemo(() => {
    if (!restaurant) return [];
    const safeItems = Array.isArray(localizedMenuItems) ? localizedMenuItems : [];
    return safeItems.slice(0, 3).map(item => ({
      title: `${restaurant.name} - ${item.name}`,
      description: `${item.description || (language === 'en' ? 'Delicious dish' : 'طبق شهي')} - ${language === 'en' ? 'Order with special discount' : 'اطلب الآن بخصم خاص'}`,
      discount: '50%',
      image: item.image_url || restaurant.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200',
      link: createPageUrl('RestaurantDetail') + `?id=${restaurantId}`
    }));
  }, [localizedMenuItems, restaurant, restaurantId, language]);

  // Show loading state
  if (isLoadingRestaurant || isLoadingMenu) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#1B4332]/60">{language === 'en' ? 'Loading...' : 'جاري التحميل...'}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (!restaurant || isRestaurantError) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-[#1B4332]/60 mb-4">{language === 'en' ? 'Restaurant not found' : 'المطعم غير موجود'}</p>
          <Button onClick={() => navigate(createPageUrl('Restaurants'))} className="bg-[#1B4332]">
            {language === 'en' ? 'Back to Restaurants' : 'العودة للمطاعم'}
          </Button>
        </div>
      </div>
    );
  }

  // Use localizedRestaurant for display
  const displayRestaurant = localizedRestaurant;

  const categories = [...new Set(localizedMenuItems.map(item => item.category))];
  const filteredItems = selectedCategory === 'all' 
    ? localizedMenuItems 
    : localizedMenuItems.filter(item => item.category === selectedCategory);

  const handleAddToCart = (item) => {
    const customerPrice = item.customer_price || Math.round((item.base_price || 0) * 1.1);
    addToCart({ ...item, customer_price: customerPrice, restaurant_name: restaurant.name, restaurant_id: restaurantId });
    setAddedToCartItemId(item.id);
    toast.success(language === 'en' ? 'Added to cart' : 'تمت الإضافة للسلة');
  };

  const handleCheckout = () => {
    navigate(createPageUrl('Order') + `?type=food&from=cart&restaurant=${encodeURIComponent(restaurant.name)}`);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <BackButton />
      {/* Restaurant Header */}
      <section className="relative overflow-hidden">
        {/* Cover Image */}
        {restaurant.cover_image_url && (
          <div className="absolute inset-0 w-full h-full">
            <img 
              src={restaurant.cover_image_url} 
              alt={`${restaurant.name} cover`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#1B4332]/65 to-[#2D6A4F]/60" />
          </div>
        )}
        
        <div className={`relative ${restaurant.cover_image_url ? '' : 'bg-gradient-to-br from-[#1B4332] to-[#2D6A4F]'} py-7`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Link to={createPageUrl('Restaurants')} className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
              <ArrowRight className={`w-5 h-5 ${language === 'en' ? 'rotate-180' : ''}`} />
              {language === 'en' ? 'Back to Restaurants' : 'العودة للمطاعم'}
            </Link>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              {restaurant.image_url && (
                <img 
                  src={restaurant.image_url} 
                  alt={restaurant.name}
                  className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-2xl bg-white p-1.5 shadow-xl border border-white/60"
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1.5">{restaurant.name}</h1>
                <p className="text-white/95 text-sm md:text-base mb-3 line-clamp-2">{restaurant.description}</p>
                <div className="flex flex-wrap gap-3">
                  {restaurant.cuisine_type && (
                    <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                      {restaurant.cuisine_type}
                    </Badge>
                  )}
                  <Badge className="bg-white/20 text-white border-0 gap-2 backdrop-blur-sm">
                    <Clock className="w-4 h-4" />
                    {language === 'en' ? 'Available to order' : 'متاح للطلب'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Offers Carousel */}
      {restaurantItemOffers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
          <OffersCarousel offers={restaurantItemOffers} />
        </section>
      )}

      {/* Loading State */}
      {(isLoadingRestaurant || isLoadingMenu) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <SmartLottie
              animationPath={ANIMATION_PRESETS.pageLoading.path}
              width={80}
              height={80}
              trigger="never"
              autoplay={true}
              loop={true}
            />
            <p className="text-[#1B4332] font-semibold">{language === 'en' ? 'Loading menu...' : 'جاري تحميل القائمة...'}</p>
          </motion.div>
        </section>
      )}

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            className={selectedCategory === 'all' ? 'bg-[#1B4332]' : ''}
          >
            {language === 'en' ? 'All' : 'الكل'}
          </Button>
          {(Array.isArray(categories) ? categories : []).map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? 'bg-[#1B4332]' : ''}
            >
              {category}
            </Button>
          ))}
        </div>
      </section>

      {/* Menu Items */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
          {(Array.isArray(filteredItems) ? filteredItems : []).map((item, index) => (
            <motion.div
              key={item.id || index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white rounded-2xl border border-[#E7ECEF] overflow-hidden shadow-sm relative"
            >
              <button
                type="button"
                className="block w-full text-right"
                onClick={() => setSelectedItem(item)}
              >
                <div className="h-24 md:h-32 bg-[#F8FAFC] p-2 relative">
                  <img
                    src={item.image_url || 'https://placehold.co/400x300/F8FAFC/1F2933?text=Wasel'}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  {/* Add to Cart Animation Overlay */}
                  <AnimatePresence>
                    {addedToCartItemId === item.id && (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <SmartLottie
                          animationPath={ANIMATION_PRESETS.addToCartSuccess.path}
                          width={100}
                          height={100}
                          trigger="never"
                          autoplay={true}
                          loop={false}
                          hideWhenDone={true}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="px-3 pt-2">
                  <h3 className="font-bold text-[#1B4332] text-sm md:text-base line-clamp-1" dir="rtl">{item.name}</h3>
                  <p className="text-xs text-[#475569] mt-1 line-clamp-2 min-h-[2rem]" dir="rtl">
                    {item.description || (language === 'en' ? 'No description available' : 'لا يوجد وصف حالياً')}
                  </p>
                </div>
              </button>
              <div className="px-3 pb-3 pt-2 flex items-end justify-between gap-2">
                <PriceDisplay basePrice={item.customer_price || item.base_price || item.price} size="small" />
                <Button
                  onClick={() => handleAddToCart(item)}
                  className="h-9 px-3 rounded-xl bg-[#1B4332] hover:bg-[#163426] text-white text-xs md:text-sm font-bold"
                >
                  <Plus className="w-4 h-4 ml-1" />
                  {language === 'en' ? 'Add to cart' : 'أضف إلى السلة'}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/971502406519"
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed bottom-6 ${language === 'ar' ? 'right-6' : 'left-6'} bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-40`}
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none"
              dir={dir}
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto flex flex-col">
                {/* Image */}
                <div className="relative h-80 bg-gray-100 shrink-0">
                  {selectedItem.image_url && (
                    <img 
                      src={selectedItem.image_url} 
                      alt={selectedItem.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    onClick={() => setSelectedItem(null)}
                    className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all shadow-lg`}
                  >
                    ✕
                  </button>
                  <div className={`absolute top-4 ${language === 'ar' ? 'right-4' : 'left-4'}`}>
                    <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                      {language === 'en' ? '50% OFF' : 'خصم 50%'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-2xl font-bold text-[#1B4332]">{selectedItem.name}</h2>
                    {selectedItem.available && (
                      <Badge className="bg-[#52B788]/10 text-[#52B788] border-0">{language === 'en' ? 'Available' : 'متوفر'}</Badge>
                    )}
                  </div>

                  {selectedItem.description && (
                    <p className="text-[#1B4332]/70 mb-6 leading-relaxed">{selectedItem.description}</p>
                  )}

                  <div className="mb-6">
                    <PriceDisplay basePrice={selectedItem.base_price || selectedItem.customer_price / 1.1} size="medium" />
                  </div>

                  <Button
                    onClick={() => {
                      handleAddToCart(selectedItem);
                      setSelectedItem(null);
                    }}
                    className="w-full bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white py-4 rounded-xl text-lg font-bold"
                    disabled={!selectedItem.available}
                  >
                    <Plus className="w-5 h-5 ml-2" />
                    {t('addToCart')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AppFooter />
    </div>
  );
}