import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShoppingCart, Filter, Search, Plus, Info, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from '../components/cart/CartContext';
import BackButton from '../components/common/BackButton';
import PriceDisplay from '../components/common/PriceDisplay';
import { toast } from 'sonner';
import { useLanguage } from '../components/common/LanguageContext';
import OffersCarousel from '../components/common/OffersCarousel';
import SmartLottie from '@/components/animations/SmartLottie';
import { ANIMATION_PRESETS } from '@/components/animations/animationPresets';
import AddToCartButton from '@/components/buttons/AddToCartButton';
import ProductDetailModal from '@/components/common/ProductDetailModal';
import { attachRatingsFromReviews } from '@/lib/itemRatings';

export default function Supermarket() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addedToCartProductId, setAddedToCartProductId] = useState(null);
  const { addToCart } = useCart();
  const { language, t, dir } = useLanguage();

  // Auto-hide add-to-cart animation
  useEffect(() => {
    if (!addedToCartProductId) return;
    const timer = setTimeout(() => {
      setAddedToCartProductId(null);
    }, 1500);
    return () => clearTimeout(timer);
  }, [addedToCartProductId]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'supermarket'],
    queryFn: async () => {
      try {
        const data = await base44.entities.Product.list();
        const items = Array.isArray(data) ? data : [];
        const supermarketItems = items.filter(p => p.category === 'supermarket' || p.category === 'سوبر ماركت');
        return await attachRatingsFromReviews(supermarketItems, { itemType: 'product' });
      } catch {
        return [];
      }
    },
  });

  const offers = [
    {
      title: language === 'en' ? 'Weekly Grocery Deals' : 'عروض البقالة الأسبوعية',
      description: language === 'en' ? 'Fresh items at best prices' : 'منتجات طازجة بأفضل الأسعار',
      discount: '20%',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200',
      link: '#'
    },
    {
      title: language === 'en' ? 'Bulk Savings' : 'توفير الجملة',
      description: language === 'en' ? 'Buy more, save more' : 'اشتري أكثر، وفر أكثر',
      discount: '15%',
      image: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=1200',
      link: '#'
    }
  ];

  const categories = useMemo(() => {
    const subs = Array.isArray(products) ? products.map(p => p?.subcategory).filter(Boolean) : [];
    return ['all', ...new Set(subs)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return (Array.isArray(products) ? products : []).filter(product => {
      if (!product) return false;
      const matchesCategory = selectedCategory === 'all' || product?.subcategory === selectedCategory;
      const searchLower = (typeof searchQuery === 'string' ? searchQuery : '').toLowerCase();
      const matchesSearch = (typeof product?.name === 'string' && product.name.toLowerCase().includes(searchLower)) || 
                            (typeof product?.name_en === 'string' && product.name_en.toLowerCase().includes(searchLower));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleAddToCart = (product) => {
    const price = Number(product?.price) || 0;
    addToCart({
      ...product,
      customer_price: Math.round(price * 1.1),
      base_price: price,
      item_type: 'supermarket'
    });
    setAddedToCartProductId(product?.id);
    toast.success(language === 'en' ? 'Added to cart' : 'تمت الإضافة للسلة');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20">
      <BackButton />

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500 to-red-600 py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="max-w-7xl mx-auto relative z-10 text-center text-white">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-2">{language === 'en' ? 'Supermarket' : 'سوبر ماركت واصل ستور'}</h1>
          <p className="text-white/90 text-lg">{language === 'en' ? 'Groceries delivered to your door' : 'مقاضي البيت توصلك لباب البيت'}</p>
        </div>
      </section>

      {/* Offers */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-20 mb-8">
        <OffersCarousel offers={offers} />
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 mb-8 sticky top-20 z-30">
        <div className="bg-white p-4 rounded-xl shadow-lg border border-[#F5E6D3] flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input 
              placeholder={language === 'en' ? "Search products..." : "ابحث عن منتج..."}
              className="pr-10 h-12 text-lg border-[#F5E6D3] focus:border-orange-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {(Array.isArray(categories) ? categories : []).map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap ${selectedCategory === cat ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
              >
                {cat === 'all' ? (language === 'en' ? 'All' : 'الكل') : cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4">
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <SmartLottie
              animationPath={ANIMATION_PRESETS.pageLoading.path}
              width={80}
              height={80}
              trigger="never"
              autoplay={true}
              loop={true}
            />
            <p className="text-gray-600 mt-4">{language === 'en' ? 'Loading products...' : 'جاري تحميل المنتجات...'}</p>
          </motion.div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#F5E6D3]">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{language === 'en' ? 'No products found' : 'لا توجد منتجات'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(Array.isArray(filteredProducts) ? filteredProducts : []).map((product, index) => (
              <motion.div
                key={product?.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#F5E6D3] hover:shadow-lg transition-all group flex flex-col"
              >
                <div 
                  className="relative h-40 bg-gray-50 cursor-pointer overflow-hidden"
                  onClick={() => setSelectedProduct(product)}
                >
                  {product?.image_url ? (
                    <img src={product.image_url} alt={product.name || 'product'} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ShoppingCart className="w-12 h-12" />
                    </div>
                  )}
                  {/* Add to Cart Animation */}
                  <AnimatePresence>
                    {addedToCartProductId === product?.id && (
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
                  {!product?.available && !addedToCartProductId && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        {language === 'en' ? 'Out of Stock' : 'غير متوفر'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-[#1B4332] line-clamp-2 mb-1 min-h-[40px] text-sm md:text-base">
                    {language === 'en' ? (product.name_en || product.name) : product.name}
                  </h3>
                  
                  {product?.brand && (
                    <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
                  )}

                  {Number(product?.review_count ?? product?.rating_count ?? 0) > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                      <span className="text-xs text-[#374151] font-semibold">
                        {Number(product?.avg_rating ?? product?.rating_avg ?? product?.rating ?? 0).toFixed(1)}
                      </span>
                      <span className="text-xs text-[#9CA3AF]">({Number(product?.review_count ?? product?.rating_count ?? 0)})</span>
                    </div>
                  )}
                  
                  <div className="mt-auto pt-2">
                    <PriceDisplay basePrice={Number(product?.price) || 0} size="small" />
                  </div>
                  
                  <AddToCartButton
                    onClick={() => handleAddToCart(product)}
                    disabled={!product?.available}
                    isLoading={addedToCartProductId === product?.id}
                    label={t('addToCart')}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      <ProductDetailModal
        item={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(product) => {
          handleAddToCart(product);
        }}
        addToCartLabel={t('addToCart')}
      />
    </div>
  );
}