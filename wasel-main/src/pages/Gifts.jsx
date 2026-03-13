import React, { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';

import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, ShoppingBag, Eye, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart/CartContext';
import PriceDisplay from '@/components/common/PriceDisplay';
import { toast } from 'sonner';
import ProductDetailModal from '@/components/common/ProductDetailModal';
import SmartLottie from '@/components/animations/SmartLottie';
import { ANIMATION_PRESETS } from '@/components/animations/animationPresets';
import AddToCartButton from '@/components/buttons/AddToCartButton';
import { attachRatingsFromReviews, normalizeItemRating } from '@/lib/itemRatings';

const Gifts = () => {
  const { addToCart } = useCart();
  const [selectedGift, setSelectedGift] = useState(null);
  const [addedToCartGiftId, setAddedToCartGiftId] = useState(null);

  const { data: gifts = [], isLoading } = useQuery({
    queryKey: ['gifts'],
    queryFn: async () => {
      const list = await base44.entities.Gift.list();
      const normalized = Array.isArray(list) ? list.map((gift) => normalizeItemRating(gift)) : [];
      return await attachRatingsFromReviews(normalized, { itemType: 'gift' });
    },
  });

  // Auto-hide add-to-cart animation
  useEffect(() => {
    if (!addedToCartGiftId) return;
    const timer = setTimeout(() => {
      setAddedToCartGiftId(null);
    }, 1500);
    return () => clearTimeout(timer);
  }, [addedToCartGiftId]);

  const handleAddToCart = (gift) => {
    const basePrice = Number(gift?.price || 0);

    addToCart({
      ...gift,
      name: gift.name,
      customer_price: Math.max(0, basePrice),
      price: Math.max(0, basePrice),
      item_type: 'gift'
    });
    
    // Trigger animation
    setAddedToCartGiftId(gift.id);
    toast.success(`${gift.name} أضيف إلى السلة`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Cairo'] pb-8">
      <header className="bg-gradient-to-br from-pink-500 to-rose-500 py-12 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Gift className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h1 className="text-4xl font-bold mb-2">قسم الهدايا</h1>
          <p className="text-lg opacity-90">عبر عن مشاعرك بهدية مميزة</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 -mt-8">
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <SmartLottie
              animationPath={ANIMATION_PRESETS.pageLoading.path}
              width={80}
              height={80}
              trigger="never"
              autoplay={true}
              loop={true}
            />
            <p className="text-gray-600 mt-4">جاري تحميل الهدايا...</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {gifts.map((gift, index) => (
              <motion.div
                key={gift.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 relative"
              >
                <div className="relative">
                  <img 
                    src={gift.image_url || 'https://placehold.co/600x400/f472b6/ffffff?text=Wasel'}
                    alt={gift.name}
                    className="w-full h-56 object-cover cursor-pointer"
                    onClick={() => setSelectedGift(gift)}
                  />
                  
                  {/* Add-to-Cart Animation */}
                  <AnimatePresence>
                    {addedToCartGiftId === gift.id && (
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
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{gift.name}</h3>
                  {Number(gift?.review_count ?? gift?.rating_count ?? 0) > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                      <span className="text-sm font-bold text-gray-700">
                        {Number(gift?.avg_rating ?? gift?.rating_avg ?? gift?.rating ?? 0).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">({Number(gift?.review_count ?? gift?.rating_count ?? 0)})</span>
                    </div>
                  )}
                  <p className="text-gray-600 text-sm mb-4">{gift.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <PriceDisplay basePrice={gift.price} discount={0.1} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Button variant="outline" onClick={() => setSelectedGift(gift)}>
                        <Eye className="w-4 h-4 ml-1" />
                        عرض التفاصيل
                     </Button>
                    <AddToCartButton
                      onClick={() => handleAddToCart(gift)}
                      isLoading={addedToCartGiftId === gift.id}
                      label="أضف للسلة"
                      className="py-2"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <ProductDetailModal
        item={selectedGift}
        isOpen={!!selectedGift}
        onClose={() => setSelectedGift(null)}
        onAddToCart={handleAddToCart}
        addToCartLabel="أضف للسلة"
      />
    </div>
  );
};

export default Gifts;