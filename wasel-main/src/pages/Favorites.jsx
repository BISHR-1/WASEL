// =====================================================
// WASEL - FAVORITES PAGE (Enhanced with Trust Green + Security)
// File: src/pages/Favorites.jsx
// =====================================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, HeartOff, ShoppingCart, Trash2, 
  Search, Filter, Loader2, AlertCircle, X,
  Grid, List, ArrowLeft, Share2
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import secureApi, { trackInteraction } from '@/services/secureApi';
import ProductCard from '@/components/ProductCard';
import { toast } from 'sonner';

// =====================================================
// CONSTANTS
// =====================================================
const EXCHANGE_RATE_USD_TO_LYR = 115;

function normalizeFavoriteProduct(raw) {
  const product = raw?.product || raw || {};
  const priceUsd = Number(product.price_usd ?? product.priceUSD ?? product.price ?? 0) || 0;
  const stockQty = Number(product.stock_qty ?? product.stock ?? 1);

  const imageVal = product.image_url || product.image || product.thumbnail_url || (product.images?.[0]) || null;
  const priceSyp = Number(product.customer_price || product.price_syp || product.priceSYP || 0) || Math.round(priceUsd * EXCHANGE_RATE_USD_TO_LYR);

  return {
    ...product,
    id: product.id || raw?.product_id || raw?.id,
    name: product.name || product.name_ar || 'منتج',
    name_ar: product.name_ar || product.name || 'منتج',
    image_url: imageVal,
    image: imageVal,
    category: product.category || 'general',
    description: product.description || product.description_ar || '',
    stock: Number.isFinite(stockQty) ? stockQty : 1,
    stock_qty: Number.isFinite(stockQty) ? stockQty : 1,
    customer_price: priceSyp,
    price_usd: priceUsd,
    price: priceUsd,
  };
}

// =====================================================
// EMPTY STATE COMPONENT
// =====================================================
function EmptyFavorites() {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-24 h-24 rounded-full bg-[#1F7A63]/10 flex items-center justify-center mb-6">
        <HeartOff className="w-12 h-12 text-[#1F7A63]/50" />
      </div>
      <h2 className="text-xl font-bold text-[#1F2933] mb-2" dir="rtl">
        لا توجد مفضلات بعد
      </h2>
      <p className="text-[#1F2933]/60 text-center max-w-xs mb-6" dir="rtl">
        اضغط على أيقونة القلب في أي منتج لإضافته إلى المفضلة
      </p>
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#1F7A63] text-white rounded-xl hover:bg-[#1F7A63]/90 transition-colors"
      >
        تصفح المنتجات
        <ArrowLeft className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// =====================================================
// FAVORITE ITEM CARD (List View)
// =====================================================
function FavoriteListItem({ product, onRemove, onAddToCart, isRemoving }) {
  const navigate = useNavigate();
  const normalized = normalizeFavoriteProduct(product);
  const priceLYR = Math.round(normalized.price_usd * EXCHANGE_RATE_USD_TO_LYR);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex gap-4"
    >
      {/* Image */}
      <div 
        className="w-24 h-24 rounded-lg bg-[#F9FAF8] shrink-0 overflow-hidden cursor-pointer"
        onClick={() => navigate(`/product/${normalized.id}`)}
      >
        {normalized.image_url ? (
          <img 
            src={normalized.image_url} 
            alt={normalized.name_ar || normalized.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-[#1F2933]/20" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 
          className="font-bold text-[#1F2933] truncate cursor-pointer hover:text-[#1F7A63]" 
          dir="rtl"
          onClick={() => navigate(`/product/${normalized.id}`)}
        >
          {normalized.name_ar || normalized.name}
        </h3>
        
        {normalized.category && (
          <p className="text-xs text-[#1F2933]/50 mt-0.5" dir="rtl">
            {normalized.category}
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-lg font-bold text-[#1F7A63]">
            ${normalized.price_usd?.toFixed(2)}
          </span>
          <span className="text-xs text-[#1F2933]/40">
            ≈ {priceLYR.toLocaleString()} LYR
          </span>
        </div>

        {/* Stock Status */}
        {normalized.stock_qty !== undefined && (
          <p className={`text-xs mt-1 ${
            normalized.stock_qty === 0 
              ? 'text-red-500' 
              : normalized.stock_qty < 10 
                ? 'text-amber-500' 
                : 'text-[#2FA36B]'
          }`}>
            {normalized.stock_qty === 0 
              ? 'غير متوفر'
              : normalized.stock_qty < 10
                ? `متبقي ${normalized.stock_qty} فقط`
                : 'متوفر'}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 shrink-0">
        <motion.button
          onClick={onAddToCart}
          disabled={normalized.stock_qty === 0}
          className="w-10 h-10 rounded-lg bg-[#1F7A63] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ShoppingCart className="w-5 h-5" />
        </motion.button>
        
        <motion.button
          onClick={onRemove}
          disabled={isRemoving}
          className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isRemoving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Trash2 className="w-5 h-5" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

// =====================================================
// MAIN FAVORITES PAGE
// =====================================================
export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [removingIds, setRemovingIds] = useState(new Set());
  const [sortBy, setSortBy] = useState('added');

  // Load favorites (try API first, fallback to localStorage)
  useEffect(() => {
    const loadFavorites = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const session = await supabase.auth.getSession();
        
        if (session.data?.session) {
          // User is logged in - fetch from API
          const data = await secureApi.getFavorites();
          setFavorites(data || []);
        } else {
          // Fallback to localStorage for guests
          const savedFavorites = JSON.parse(localStorage.getItem('wasel_favorites') || '[]');
          setFavorites(savedFavorites.map(p => ({ product: p, product_id: p.id })));
        }
      } catch (err) {
        console.error('Failed to load favorites:', err);
        // Fallback to localStorage
        const savedFavorites = JSON.parse(localStorage.getItem('wasel_favorites') || '[]');
        setFavorites(savedFavorites.map(p => ({ product: p, product_id: p.id })));
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, []);

  // Remove from favorites
  const handleRemove = useCallback(async (productId) => {
    setRemovingIds(prev => new Set([...prev, productId]));

    try {
      const session = await supabase.auth.getSession();
      
      if (session.data?.session) {
        await secureApi.toggleFavorite(productId);
      } else {
        // localStorage fallback
        const savedFavorites = JSON.parse(localStorage.getItem('wasel_favorites') || '[]');
        const newFavorites = savedFavorites.filter(item => item.id !== productId);
        localStorage.setItem('wasel_favorites', JSON.stringify(newFavorites));
      }
      
      setFavorites(prev => prev.filter(f => (f.product_id || f.product?.id || f.id) !== productId));
      trackInteraction(productId, 'unfavorite');
      toast.success('تمت الإزالة من المفضلة');
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      toast.error('فشل في إزالة المنتج من المفضلات');
    } finally {
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  }, []);

  // Add to cart
  const handleAddToCart = useCallback(async (product) => {
    try {
      const normalized = normalizeFavoriteProduct(product);
      const session = await supabase.auth.getSession();
      
      if (session.data?.session) {
        await secureApi.addToCart(normalized.id, 1, normalized.price_usd);
      }
      
      trackInteraction(normalized.id, 'add_to_cart');
      const currentCount = parseInt(localStorage.getItem('cart_count') || '0');
      localStorage.setItem('cart_count', String(currentCount + 1));
      toast.success('تمت الإضافة إلى السلة!');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      toast.error('فشل في إضافة المنتج إلى السلة');
    }
  }, []);

  // Clear all favorites
  const clearAllFavorites = () => {
    if (window.confirm('هل تريد حذف جميع المفضلة؟')) {
      setFavorites([]);
      localStorage.removeItem('wasel_favorites');
      toast.success('تم حذف جميع المفضلة');
    }
  };

  // Filter and sort favorites
  const filteredFavorites = favorites
    .filter(f => {
      if (!searchQuery) return true;
      const product = normalizeFavoriteProduct(f.product || f);
      const name = (product.name_ar || product.name || '').toLowerCase();
      return name.includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      const productA = normalizeFavoriteProduct(a.product || a);
      const productB = normalizeFavoriteProduct(b.product || b);
      
      switch (sortBy) {
        case 'price_asc':
          return (productA.price_usd || 0) - (productB.price_usd || 0);
        case 'price_desc':
          return (productB.price_usd || 0) - (productA.price_usd || 0);
        case 'name':
          return (productA.name_ar || productA.name || '').localeCompare(
            productB.name_ar || productB.name || ''
          );
        default:
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
    });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAF8] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#1F7A63] mx-auto mb-4" />
          <p className="text-[#1F2933]/60">جاري تحميل المفضلات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAF8] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-[#F9FAF8] flex items-center justify-center hover:bg-[#1F7A63]/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#1F2933]" />
            </button>
            
            <h1 className="text-xl font-bold text-[#1F2933] flex items-center gap-2" dir="rtl">
              <Heart className="w-6 h-6 text-[#1F7A63] fill-[#1F7A63]" />
              المفضلات ({favorites.length})
            </h1>

            {favorites.length > 0 ? (
              <button
                onClick={clearAllFavorites}
                className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            ) : (
              <div className="w-10" />
            )}
          </div>

          {/* Search and Filters */}
          {favorites.length > 0 && (
            <div className="flex gap-2">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F2933]/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث في المفضلات..."
                  className="w-full bg-[#F9FAF8] border border-[#E5E7EB] rounded-lg px-4 py-2 pr-10 text-sm text-[#1F2933] placeholder:text-[#1F2933]/40 focus:outline-none focus:border-[#1F7A63]"
                  dir="rtl"
                />
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#F9FAF8] border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#1F2933] focus:outline-none focus:border-[#1F7A63]"
                dir="rtl"
              >
                <option value="added">الأحدث</option>
                <option value="price_asc">السعر: من الأقل</option>
                <option value="price_desc">السعر: من الأعلى</option>
                <option value="name">الاسم</option>
              </select>

              {/* View Toggle */}
              <div className="flex bg-[#F9FAF8] border border-[#E5E7EB] rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-[#1F7A63] text-white' : 'text-[#1F2933] hover:bg-[#1F7A63]/10'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-[#1F7A63] text-white' : 'text-[#1F2933] hover:bg-[#1F7A63]/10'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700" dir="rtl">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mr-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-4">
        {favorites.length === 0 ? (
          <EmptyFavorites />
        ) : filteredFavorites.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-[#1F2933]/20 mx-auto mb-3" />
            <p className="text-[#1F2933]/60" dir="rtl">
              لا توجد نتائج لـ "{searchQuery}"
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredFavorites.map((fav) => {
                const product = normalizeFavoriteProduct(fav.product || fav);
                return (
                  <motion.div
                    key={fav.product_id || product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative"
                  >
                    <ProductCard
                      product={product}
                      size="small"
                      isFavorited={true}
                      onFavoriteChange={() => handleRemove(product.id)}
                      onCartAdd={() => handleAddToCart(product)}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredFavorites.map((fav) => {
                const product = normalizeFavoriteProduct(fav.product || fav);
                return (
                  <FavoriteListItem
                    key={fav.product_id || product.id}
                    product={product}
                    onRemove={() => handleRemove(product.id)}
                    onAddToCart={() => handleAddToCart(product)}
                    isRemoving={removingIds.has(product.id)}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Floating Action: Add All to Cart */}
      {filteredFavorites.length > 0 && (
        <div className="fixed bottom-24 left-4 right-4 z-30">
          <motion.button
            onClick={() => {
              filteredFavorites.forEach(fav => {
                const product = normalizeFavoriteProduct(fav.product || fav);
                if (product.stock_qty !== 0) {
                  handleAddToCart(product);
                }
              });
            }}
            className="w-full bg-[#2FA36B] text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-[#2FA36B]/90 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ShoppingCart className="w-5 h-5" />
            إضافة الكل إلى السلة ({filteredFavorites.filter(f => normalizeFavoriteProduct(f.product || f).stock_qty !== 0).length})
          </motion.button>
        </div>
      )}

      {/* Floating decorations with Trust Green */}
      <div className="fixed top-20 right-10 w-20 h-20 bg-[#1F7A63]/10 rounded-full blur-2xl pointer-events-none" />
      <div className="fixed bottom-40 left-10 w-32 h-32 bg-[#2FA36B]/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
