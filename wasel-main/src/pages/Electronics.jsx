import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AppFooter from '@/components/common/AppFooter';
import { Smartphone, Search, Plus, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from '../components/cart/CartContext';
import BackButton from '../components/common/BackButton';
import PriceDisplay from '../components/common/PriceDisplay';
import { toast } from 'sonner';
import { useLanguage } from '../components/common/LanguageContext';
import OffersCarousel from '../components/common/OffersCarousel';
import SmartLottie from '@/components/animations/SmartLottie';
import { ANIMATION_PRESETS } from '@/components/animations/animationPresets';
import AddToCartButton from '@/components/buttons/AddToCartButton';

export default function Electronics() {
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
    queryKey: ['products', 'electronics'],
    queryFn: async () => {
      try {
        const data = await base44.entities.Product.list();
        const items = Array.isArray(data) ? data : [];
        return items.filter(p => p.category === 'electronics' || p.category === 'الكترونيات');
      } catch {
        return [];
      }
    },
  });

  const offers = [
    {
      title: language === 'en' ? 'Latest Smartphones' : 'أحدث الهواتف الذكية',
      description: language === 'en' ? 'Upgrade your device today' : 'جدد موبايلك اليوم',
      discount: 'Special',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200',
      link: '#'
    },
    {
      title: language === 'en' ? 'Accessories & Gadgets' : 'إكسسوارات وملحقات',
      description: language === 'en' ? 'Essentials for your tech' : 'أساسيات لأجهزتك الذكية',
      discount: '30%',
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=1200',
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
      item_type: 'electronics'
    });
    setAddedToCartProductId(product?.id);
    toast.success(language === 'en' ? 'Added to cart' : 'تمت الإضافة للسلة');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20">
      <BackButton />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05]" />
        <div className="max-w-7xl mx-auto relative z-10 text-center text-white">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-2">{language === 'en' ? 'Mobile & Electronics' : 'موبايلات وإلكترونيات'}</h1>
          <p className="text-white/90 text-lg">{language === 'en' ? 'Latest tech at best prices' : 'أحدث التقنيات بأفضل الأسعار'}</p>
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
              placeholder={language === 'en' ? "Search devices..." : "ابحث عن جهاز..."}
              className="pr-10 h-12 text-lg border-[#F5E6D3] focus:border-blue-500"
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
                className={`whitespace-nowrap ${selectedCategory === cat ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
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
            <p className="text-[#1B4332] font-semibold mt-4">{language === 'en' ? 'Loading products...' : 'جاري تحميل المنتجات...'}</p>
          </motion.div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#F5E6D3]">
            <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{language === 'en' ? 'No products found' : 'لا توجد منتجات'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
            {(Array.isArray(filteredProducts) ? filteredProducts : []).map((product, index) => (
              <motion.div
                key={product?.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#F5E6D3] hover:shadow-xl transition-all group flex flex-col"
              >
                <div 
                  className="relative h-28 md:h-40 bg-gray-50 cursor-pointer overflow-hidden p-2 md:p-4"
                  onClick={() => setSelectedProduct(product)}
                >
                  {product?.image_url ? (
                    <img src={product.image_url} alt={product.name || 'product'} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Smartphone className="w-16 h-16" />
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
                          width={80}
                          height={80}
                          trigger="never"
                          autoplay={true}
                          loop={false}
                          hideWhenDone={true}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {product?.brand && (
                    <span className="absolute top-2 right-2 bg-white/90 backdrop-blur shadow-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-700">
                        {product.brand}
                    </span>
                  )}
                </div>
                
                <div className="p-3 md:p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-[#1B4332] text-sm md:text-base mb-1 line-clamp-1">
                    {language === 'en' ? (product?.name_en || product?.name) : product?.name}
                  </h3>

                  <p className="text-xs text-[#475569] line-clamp-2 min-h-[2rem]">
                    {language === 'en' ? (product?.description_en || product?.description || 'No description available') : (product?.description || 'لا يوجد وصف حالياً')}
                  </p>
                  
                  <div className="mt-auto pt-3">
                    <PriceDisplay basePrice={Number(product?.price) || 0} size="small" />
                  </div>
                  
                  <AddToCartButton
                    onClick={() => handleAddToCart(product)}
                    disabled={!product?.available}
                    isLoading={addedToCartProductId === product?.id}
                    label={language === 'en' ? 'Add to cart' : 'أضف إلى السلة'}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none"
              dir={dir}
            >
              <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl flex flex-col md:flex-row">
                 <div className="w-full md:w-1/2 bg-gray-50 h-64 md:h-auto p-8 flex items-center justify-center relative overflow-hidden group">
                    <img 
                      src={selectedProduct?.image_url || ''} 
                      alt={selectedProduct?.name || 'product'} 
                      className="w-full h-full object-contain transition-transform duration-500 hover:scale-150 cursor-zoom-in" 
                    />
                    <button 
                      onClick={() => setSelectedProduct(null)}
                      className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 shadow-sm md:hidden"
                    >
                      <span className="text-xl">&times;</span>
                    </button>
                 </div>
                 <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
                    <button 
                      onClick={() => setSelectedProduct(null)}
                      className="self-end w-8 h-8 bg-gray-100 rounded-full md:flex items-center justify-center hover:bg-gray-200 hidden mb-2"
                    >
                      <span className="text-xl">&times;</span>
                    </button>
                    
                    <h2 className="text-2xl font-bold text-[#1B4332] mb-1">
                        {language === 'en' ? (selectedProduct?.name_en || selectedProduct?.name) : selectedProduct?.name}
                    </h2>
                    <p className="text-sm text-gray-500 mb-4 font-medium uppercase tracking-wider">{selectedProduct?.brand || ''}</p>
                    
                    <div className="mb-6">
                        <PriceDisplay basePrice={Number(selectedProduct?.price) || 0} size="large" />
                    </div>

                    <div className="space-y-4 mb-8 flex-1">
                        <p className="text-gray-600 leading-relaxed">
                            {language === 'en' ? (selectedProduct?.description_en || selectedProduct?.description || '') : selectedProduct?.description || ''}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-gray-50 p-2 rounded-lg flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>{language === 'en' ? 'Original' : 'أصلي 100%'}</span>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>{language === 'en' ? 'Warranty' : 'كفالة حقيقية'}</span>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={() => {
                            handleAddToCart(selectedProduct);
                            setSelectedProduct(null);
                        }}
                        disabled={!selectedProduct?.available}
                        className="w-full h-14 text-lg bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl font-bold mt-auto shadow-xl shadow-green-900/10"
                    >
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