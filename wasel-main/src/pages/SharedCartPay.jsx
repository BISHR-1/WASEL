import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, ShoppingCart, Gift, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/components/cart/CartContext';

export default function SharedCartPay() {
  const navigate = useNavigate();
  const params = useParams();
  const { addToCart, clearCart } = useCart();
  const [loadingMsg, setLoadingMsg] = useState('جاري التحقق من حالة تسجيل الدخول...');
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [phase, setPhase] = useState('loading'); // 'loading' | 'ready' | 'error'

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
          localStorage.setItem('wasel_auth_preferred_region', 'outside_syria');
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

        const sessionData = {
          token: token.trim(),
          creator_id: data.creator_id,
          payload: data.payload,
          recipient: data.payload?.recipient,
          sender: data.payload?.sender
        };
        localStorage.setItem('wasel_shared_cart_session', JSON.stringify(sessionData));
        localStorage.setItem('wasel_auth_region_locked', 'outside_syria');

        // Show branded confirmation screen before redirecting
        const recipientName = data.payload?.recipient?.name || data.payload?.sender?.name || '';
        const itemCount = data.payload?.items?.length || 0;
        setRecipientInfo({ name: recipientName, itemCount });
        setPhase('ready');

        toast.success('تم دمج السلة بنجاح، يمكنك إضافة منتجات أخرى أو إتمام الطلب!');

        setTimeout(() => navigate('/Cart', { replace: true }), 2000);

      } catch (err) {
        console.error(err);
        setPhase('error');
        toast.error('عذراً، الرابط غير صالح أو منتهي الصلاحية');
        setTimeout(() => navigate('/', { replace: true }), 2000);
      }
    };

    processSharedCart();
  }, [navigate, params?.token, addToCart, clearCart]);

  if (phase === 'ready' && recipientInfo) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white px-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center border border-green-100">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">سلة مشتركة 🛒</h2>
          {recipientInfo.name ? (
            <p className="text-gray-600 mb-1">
              هذه السلة لـ <span className="font-semibold text-green-700">{recipientInfo.name}</span> داخل سوريا
            </p>
          ) : null}
          {recipientInfo.itemCount > 0 ? (
            <p className="text-sm text-gray-500 mb-4">
              يحتوي على {recipientInfo.itemCount} {recipientInfo.itemCount === 1 ? 'منتج' : 'منتجات'}
            </p>
          ) : null}
          <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>جاري الانتقال إلى السلة...</span>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50/30">
        <p className="text-red-500 font-medium" dir="rtl">رابط غير صالح أو منتهي الصلاحية</p>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50/30">
       <Loader2 className="w-10 h-10 animate-spin text-[#1B4332] mb-4" />
       <p className="text-gray-600 font-medium" dir="rtl">{loadingMsg}</p>
    </div>
  );
}
