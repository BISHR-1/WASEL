import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { notifyProductAddedToFavorites } from '@/lib/notificationHelpers';
import { supabase } from '@/lib/supabase';
import { useUsdToSypRate } from '@/lib/exchangeRate';

// =====================================================
// CONSTANTS - نفس الثوابت في Cart.jsx
// =====================================================
const EXCHANGE_RATE = 150; // 1 USD = 150 SYP
const MARKUP_FACTOR = 1.20; // 20% زيادة وهمية
const FAKE_DOUBLE_FACTOR = 2.0; // السعر المضاعف المشطوب

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onClick, 
  showDiscount = true,
  language = 'ar',
  badges = []
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const exchangeRate = useUsdToSypRate() || EXCHANGE_RATE;
  
  useEffect(() => {
    let mounted = true;

    const loadFavoriteState = async () => {
      const favorites = JSON.parse(localStorage.getItem('wasel_favorites') || '[]');
      const foundLocal = favorites.some((fav) => fav.id === product.id);
      if (mounted) setIsFavorite(foundLocal);

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('item_type', 'product')
        .eq('item_id', product.id)
        .limit(1);

      if (!error && Array.isArray(data) && data.length > 0 && mounted) {
        setIsFavorite(true);
      }
    };

    loadFavoriteState();
    return () => {
      mounted = false;
    };
  }, [product.id]);
  
  // السعر الأصلي من Base44 (بالليرة السورية)
  const calculateOriginalPrice = () => {
    let price = 0;
    if (product.price_syp) {
      price = Number(product.price_syp);
    } else if (product.customer_price) {
      price = Number(product.customer_price);
    } else if (product.price) {
      price = Number(product.price);
    } else if (product.cost) {
      price = Number(product.cost);
    }
    return Math.round(price);
  };

  const originalPriceSYP = calculateOriginalPrice();
  
  // السعر الظاهر (الذي يدفعه العميل) = السعر الأصلي × 1.20
  const displayedPriceSYP = Math.round(originalPriceSYP * MARKUP_FACTOR);
  const displayedPriceUSD = displayedPriceSYP / exchangeRate;
  
  // السعر المضاعف (للعرض مشطوب) = السعر المعروض × 2 (ليكون الخصم 50% صحيح)
  const doublePriceSYP = displayedPriceSYP * 2;
  const doublePriceUSD = doublePriceSYP / exchangeRate;
  
  // خصم 50% دائماً
  const discountPercentage = 50;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(product);
    }
  };
  
  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    
    const favorites = JSON.parse(localStorage.getItem('wasel_favorites') || '[]');
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (isFavorite) {
      const updated = favorites.filter(fav => fav.id !== product.id);
      localStorage.setItem('wasel_favorites', JSON.stringify(updated));

      if (userId) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('item_type', 'product')
          .eq('item_id', product.id);
      }

      setIsFavorite(false);
      toast.success(language === 'ar' ? 'تمت الإزالة من المفضلة' : 'Removed from favorites');
    } else {
      favorites.push({
        ...product,
        addedAt: new Date().toISOString()
      });
      localStorage.setItem('wasel_favorites', JSON.stringify(favorites));

      if (userId) {
        const { data: existing } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', userId)
          .eq('item_type', 'product')
          .eq('item_id', product.id)
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase
            .from('favorites')
            .insert({
              user_id: userId,
              item_type: 'product',
              item_id: product.id,
            });
        }
      }

      setIsFavorite(true);
      toast.success(language === 'ar' ? 'تمت الإضافة للمفضلة ❤️' : 'Added to favorites ❤️');
      
      notifyProductAddedToFavorites(productName);
    }
  };

  const productName = language === 'en' && product.name_en ? product.name_en : product.name;
  const rating = Number(product.avg_rating ?? product.rating_avg ?? product.rating ?? 0);
  const category = product.category || product.type || '';
  const reviewCount = Number(product.review_count ?? product.rating_count ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={product.image_url || product.image || 'https://placehold.co/400x400?text=No+Image'}
          alt={productName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://placehold.co/400x400?text=No+Image';
          }}
        />
        
        <button
          onClick={handleToggleFavorite}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all ${
            isFavorite 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-white hover:bg-red-50'
          }`}
        >
          <Heart 
            className={`w-5 h-5 transition-colors ${
              isFavorite 
                ? 'text-white fill-white' 
                : 'text-gray-400 group-hover:text-red-500'
            }`} 
          />
        </button>

        {/* Discount Badge - خصم 50% دائماً */}
        <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
          خصم {discountPercentage}%
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-base font-bold text-gray-800 mb-1 line-clamp-2 min-h-[3rem]">
          {productName}
        </h3>

        {category && (
          <p className="text-xs text-gray-500 mb-2">{category}</p>
        )}

        <div className="flex items-center gap-1 mb-3">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-bold text-gray-700">{rating.toFixed(1)}</span>
          <span className="text-xs text-gray-400">({reviewCount})</span>
        </div>

        <div className="space-y-3">
          <div>
            {/* السعر المضاعف مشطوب */}
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-400 line-through">{doublePriceSYP.toLocaleString()}</span>
              <span className="text-xs text-gray-300 line-through">${doublePriceUSD.toFixed(2)}</span>
            </div>
            {/* السعر الظاهر */}
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#C2185B]">{displayedPriceSYP.toLocaleString()}</span>
              <span className="text-sm text-gray-500">ل.س</span>
              <span className="text-xs text-gray-400">| ${displayedPriceUSD.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full h-10 bg-gradient-to-r from-[#111827] to-[#1F2937] text-white rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-md font-bold text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            {language === 'ar' ? 'أضف إلى السلة' : 'Add to cart'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
