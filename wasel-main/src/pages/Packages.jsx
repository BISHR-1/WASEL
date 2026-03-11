import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AppFooter from '@/components/common/AppFooter';
import { Package, X, ArrowRight, ShoppingBag, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCart } from '../components/cart/CartContext';
import PriceDisplay from '../components/common/PriceDisplay';
import { useLanguage } from '../components/common/LanguageContext';
import { toast } from 'sonner';
import SmartLottie from '@/components/animations/SmartLottie';
import { ANIMATION_PRESETS } from '@/components/animations/animationPresets';

export default function Packages() {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [addedToCartPackageId, setAddedToCartPackageId] = useState(null);
  const { language = 'ar', t = (key) => key, dir = 'rtl' } = useLanguage?.() || {};
  const { addToCart = () => {} } = useCart?.() || {};

  // Auto-hide add-to-cart animation
  useEffect(() => {
    if (!addedToCartPackageId) return;
    const timer = setTimeout(() => {
      setAddedToCartPackageId(null);
    }, 1500);
    return () => clearTimeout(timer);
  }, [addedToCartPackageId]);

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      try {
        const list = await base44.entities.Package.list();
        return Array.isArray(list) ? list : [];
      } catch (error) {
        console.error('Failed to fetch packages:', error);
        return [];
      }
    },
  });

  const rawPackages = Array.isArray(packages) ? packages : [];

  const displayPackages = rawPackages.map(pkg => ({
    ...pkg,
    id: pkg.id,
    name: language === 'en' ? (pkg.name_en || pkg.name) : pkg.name,
    type: language === 'en' ? (pkg.type_en || pkg.type) : pkg.type,
    description: language === 'en' ? (pkg.description_en || pkg.description) : pkg.description,
    contents: language === 'en' ? (pkg.contents_en || pkg.contents) : pkg.contents,
    delivery_time: language === 'en' ? (pkg.delivery_time_en || pkg.delivery_time) : pkg.delivery_time,
    image_url: pkg.image_url || '',
    price: pkg.price || 0
  }));

  const handleAddToCart = (pkg) => {
    let basePrice = pkg.price || 0;
    let finalName = pkg.name || '';

    const customerPrice = Math.round(basePrice * 1.1);

    addToCart({
      id: pkg.id,
      name: finalName,
      base_price: Math.max(0, basePrice),
      customer_price: Math.max(0, customerPrice),
      image_url: pkg.image_url,
      type: 'package',
      item_type: 'package',
      quantity: 1
    });
    
    // Trigger animation
    setAddedToCartPackageId(pkg.id);
    toast.success(language === 'en' ? 'Added to cart' : 'تمت الإضافة للسلة');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Cairo'] pb-8">
      <div className="max-w-4xl mx-auto px-4">
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
            <p className="text-gray-600 mt-4">{language === 'en' ? 'Loading packages...' : 'جاري تحميل الباقات...'}</p>
          </motion.div>
        ) : (
        <div className="space-y-6">
          {displayPackages.map((pkg, index) => (
            <motion.div 
              key={pkg.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 relative"
            >
              <div className="relative">
                <img 
                  src={pkg.image_url} 
                  alt={pkg.name} 
                  className="w-full h-56 object-cover"
                  onError={(e) => { e.target.src = 'https://placehold.co/600x400/f0f0f0/333?text=Wasel'; }}
                />
                
                {/* Add-to-Cart Animation */}
                <AnimatePresence>
                  {addedToCartPackageId === pkg.id && (
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
                <Badge className="absolute top-3 right-3 bg-white text-black">{pkg.type}</Badge>
              </div>

              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{pkg.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                
                <div className="bg-gray-100 p-3 rounded-lg mb-4 text-sm text-gray-700">
                  <p>🎁 {pkg.contents}</p>
                  <p>🕒 {pkg.delivery_time}</p>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <PriceDisplay basePrice={pkg.price} discount={0.5} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                   <Button 
                      variant="outline"
                      onClick={() => setSelectedPackage(pkg)}
                      className="w-full"
                   >
                      <Eye className="w-4 h-4 ml-1" />
                      عرض المزيد
                   </Button>
                   <Button 
                      onClick={() => handleAddToCart(pkg)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                   >
                      <ShoppingBag className="w-4 h-4 ml-1" />
                      أضف للسلة
                   </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </div>

      {/* Details Modal */}
      <Dialog open={!!selectedPackage} onOpenChange={() => setSelectedPackage(null)}>
        <DialogContent className="max-w-lg" dir={dir}>
          {selectedPackage && (
            <div className="space-y-4">
               <div className="aspect-video relative rounded-lg overflow-hidden">
                   <img src={selectedPackage.image_url} className="w-full h-full object-cover" />
               </div>
               <h2 className="text-2xl font-bold text-[#1B4332]">{selectedPackage.name}</h2>
               <p className="text-gray-600">{selectedPackage.details || selectedPackage.description}</p>
               <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                  <p className="flex justify-between">
                     <span className="font-bold">{language === 'en' ? 'Contents:' : 'المحتويات:'}</span>
                     <span>{selectedPackage.contents}</span>
                  </p>
                  <p className="flex justify-between">
                     <span className="font-bold">{language === 'en' ? 'Delivery Time:' : 'وقت التوصيل:'}</span>
                     <span>{selectedPackage.delivery_time}</span>
                  </p>
               </div>
               <Button onClick={() => { handleAddToCart(selectedPackage); setSelectedPackage(null); }} className="w-full bg-[#1B4332] text-white">
                   <ShoppingBag className="w-4 h-4 ml-2" />
                   {t('addToCart')}
               </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AppFooter />
    </div>
  );
}
