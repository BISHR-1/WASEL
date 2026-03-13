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

        // Pre-ensure the payer has a public.users row (prevents FK violation on opened_by)
        try {
          await supabase.rpc('ensure_current_app_user_id');
        } catch (e) {
          console.warn('ensure_current_app_user_id pre-call skipped:', e);
        }

        const { data, error } = await supabase.rpc('claim_cart_share_link', { p_token: token.trim() });
        if (error) {
           // If already opened/claimed, check localStorage for existing session
           if (error.message?.includes('already claimed') || error.message?.includes('not active')) {
               const existingSession = localStorage.getItem('wasel_shared_cart_session');
               if (existingSession) {
                 try {
                   const parsed = JSON.parse(existingSession);
                   if (parsed.token === token.trim() && parsed.payload?.items?.length) {
                     navigate('/Cart', { replace: true });
                     return;
                   }
                 } catch {}
               }
           }

           // If token not found OR FK violation on opened_by, try direct table lookup as fallback
           const isFkViolation = error.code === '23503';
           if (error.message?.includes('Invalid cart share token') || isFkViolation) {
             const { data: directLink } = await supabase
               .from('cart_share_links')
               .select('*')
               .eq('token', token.trim())
               .maybeSingle();

             if (directLink?.payload?.items) {
               // Found via direct lookup — load items and proceed
               clearCart();
               setTimeout(() => {
                 directLink.payload.items.forEach(item => {
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

               const sessionData = {
                 token: token.trim(),
                 creator_id: directLink.created_by,
                 payload: directLink.payload,
                 recipient: directLink.payload?.recipient,
                 sender: directLink.payload?.sender,
               };
               localStorage.setItem('wasel_shared_cart_session', JSON.stringify(sessionData));
               localStorage.setItem('wasel_auth_region_locked', 'outside_syria');

               const recipientName = directLink.payload?.recipient?.name || directLink.payload?.sender?.name || '';
               const itemCount = directLink.payload?.items?.length || 0;
               setRecipientInfo({ name: recipientName, itemCount });
               setPhase('ready');
               toast.success('تم دمج السلة بنجاح!');
               setTimeout(() => navigate('/Cart', { replace: true }), 2000);
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
          creator_id: data.created_by,
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
        console.error('SharedCartPay error:', err);
        setPhase('error');
        const isTokenInvalid = err?.message?.includes('Invalid cart share token');
        toast.error(
          isTokenInvalid
            ? 'هذا الرابط غير صالح. يُرجى طلب رابط جديد من المرسل.'
            : 'عذراً، الرابط غير صالح أو منتهي الصلاحية'
        );
        setTimeout(() => navigate('/', { replace: true }), 3000);
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50/30 px-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full text-center">
          <div className="text-4xl mb-3">😞</div>
          <p className="text-red-500 font-bold text-lg mb-2">رابط غير صالح</p>
          <p className="text-gray-500 text-sm mb-3">يُرجى طلب رابط سلة مشتركة جديد من المرسل.</p>
          <p className="text-xs text-gray-400">سيتم إعادتك للصفحة الرئيسية...</p>
        </div>
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
