import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/components/cart/CartContext';

export default function SharedCartPay() {
  const navigate = useNavigate();
  const params = useParams();
  const { addToCart, clearCart } = useCart();
  const [loadingMsg, setLoadingMsg] = useState('جاري التحقق من حالة تسجيل الدخول...');

  useEffect(() => {
    const query = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const token = params?.token || query.get('token') || '';

    if (!token.trim()) {
      toast.error('رابط غير صالح');
      navigate('/', { replace: true });
      return;
    }

    const processSharedCart = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          localStorage.setItem('wasel_auth_preferred_mode', 'login');
          localStorage.setItem('wasel_auth_region_locked', 'outside_syria');
          localStorage.setItem('wasel_post_login_redirect', window.location.pathname);
          navigate('/?login=true', { replace: true });
          return;
        }

        setLoadingMsg('جاري تجهيز سلتك المشتركة...');

        const { data, error } = await supabase.rpc('claim_cart_share_link', { p_token: token.trim() });
        if (error) {
           if (error.message?.includes('already claimed') || error.message?.includes('Invalid or expired')) {
               const existingSession = localStorage.getItem('wasel_shared_cart_session');
               if (existingSession && JSON.parse(existingSession).token === token.trim()) {
                   navigate('/Cart', { replace: true });
                   return;
               }
           }
           throw error;
        }

        if (data?.payload?.items && Array.isArray(data.payload.items)) {
           clearCart();
           setTimeout(() => {
               data.payload.items.forEach(item => {
                 const priceSYP = Number(item.customer_price || item.price_syp || item.priceSYP || 0);
                 const priceUSD = Number(item.price_usd || item.priceUSD || item.price || 0);
                 const resolvedPrice = priceSYP > 0 ? priceSYP : (priceUSD > 0 ? priceUSD : 0);
                 addToCart({
                    ...item,
                    id: item.id || item.product_id,
                    product_id: item.id || item.product_id,
                    customer_price: resolvedPrice,
                    price: resolvedPrice,
                    name: item.name || item.name_ar || item.product_name || '',
                    name_ar: item.name_ar || item.name || item.product_name || '',
                    image_url: item.image_url || item.image || '',
                    quantity: item.quantity || 1,
                 });
               });
           }, 100);
        }

        localStorage.setItem('wasel_shared_cart_session', JSON.stringify({
          token: token.trim(),
          creator_id: data.creator_id,
          payload: data.payload,
          recipient: data.payload?.recipient,
          sender: data.payload?.sender
        }));

        toast.success('تم دمج السلة بنجاح، يمكنك إضافة منتجات أخرى أو إتمام الطلب!');
        
        setTimeout(() => navigate('/Cart', { replace: true }), 400);

      } catch (err) {
        console.error(err);
        toast.error('عذراً، الرابط غير صالح أو منتهي الصلاحية');
        navigate('/', { replace: true });
      }
    };

    processSharedCart();
  }, [navigate, params?.token, addToCart, clearCart]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50/30">
       <Loader2 className="w-10 h-10 animate-spin text-[#1B4332] mb-4" />
       <p className="text-gray-600 font-medium" dir="rtl">{loadingMsg}</p>
    </div>
  );
}
