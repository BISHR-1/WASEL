import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus } from 'lucide-react';
import { useCart } from './CartContext';
import { Button } from "@/components/ui/button";
import { useLanguage } from '../common/LanguageContext';

export default function UpsellSection() {
  const { addToCart } = useCart();
  const { language, t } = useLanguage();

  // Fetch some low-cost items (e.g. chocolates/gifts)
  const { data: products = [] } = useQuery({
    queryKey: ['upsell', 'gifts'],
    queryFn: async () => {
      try {
        const result = await base44?.entities?.Gift?.filter?.({ category: 'chocolate' });
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Failed to fetch upsell gifts:', error);
        return [];
      }
    },
    initialData: []
  });

  const safeProducts = Array.isArray(products) ? products : [];
  if (safeProducts.length === 0) return null;

  const handleAdd = (product) => {
    const customerPrice = Math.round(product.price * 1.1);
    addToCart({
      ...product,
      customer_price: customerPrice,
      base_price: product.price,
      item_type: 'gift'
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#F5E6D3] mt-8">
      <h3 className="font-bold text-xl text-[#1B4332] mb-4">
        {language === 'en' ? 'Complete your order with...' : 'كمل طلبيتك بـ...'}
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {safeProducts.slice(0, 5).map((product) => (
          <div key={product.id} className="min-w-[160px] w-[160px] bg-gray-50 rounded-xl p-3 flex flex-col border border-transparent hover:border-[#1B4332]/20 transition-all">
            <div className="h-24 bg-white rounded-lg mb-3 overflow-hidden">
               <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
            </div>
            <h4 className="font-bold text-sm text-[#1B4332] line-clamp-1 mb-1">{language === 'en' ? (product.name_en || product.name) : product.name}</h4>
            <p className="text-[#52B788] font-bold text-sm mb-3">{Math.round(product.price * 1.1).toLocaleString()} ل.س</p>
            <Button 
              size="sm" 
              onClick={() => handleAdd(product)}
              className="mt-auto w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs h-8"
            >
              <Plus className="w-3 h-3 ml-1" /> {t('add')}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}