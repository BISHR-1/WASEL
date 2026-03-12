import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { CheckCircle, Copy, CreditCard, Loader2, Link2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PayPalPayment from '@/components/payment/PayPalPayment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { notifyOrderUsers } from '@/services/firebaseOrderNotifications';

export default function SharedPay() {
  const navigate = useNavigate();
  const params = useParams();
  const query = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const initialToken = params?.token || query.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [order, setOrder] = useState(null);
  const [manualRef, setManualRef] = useState('');

  const amountUsd = useMemo(() => {
    if (!order) return 0;
    const raw = order.total_usd ?? order.total_amount ?? 0;
    return Number(raw) || 0;
  }, [order]);

  const claimLink = async () => {
    if (!token?.trim()) {
      toast.error('الرجاء إدخال كود/توكن الرابط');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('claim_order_share_link', { p_token: token.trim() });
      if (error) throw error;

      setShareData(data);

      const { data: orderRow, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', data.order_id)
        .single();

      if (orderErr) throw orderErr;
      setOrder(orderRow);
      toast.success('تم فتح رابط الدفع بنجاح');
    } catch (err) {
      console.error('claim link error', err);
      toast.error(err?.message || 'تعذر فتح رابط الدفع');
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (provider, payload = {}) => {
    try {
      setProcessingPayment(true);
      const { data, error } = await supabase.rpc('mark_shared_order_paid', {
        p_token: token.trim(),
        p_payment_provider: provider,
        p_payment_reference: manualRef || payload?.id || payload?.orderID || null,
        p_payment_payload: payload,
      });
      if (error) throw error;
      setOrder(data);

      await notifyOrderUsers('shared_payment_success', data, {
        provider,
        reference: manualRef || payload?.id || payload?.orderID || null,
      });

      toast.success('تم تسجيل الدفع بنجاح');
    } catch (err) {
      console.error('mark paid error', err);
      toast.error(err?.message || 'فشل تأكيد الدفع');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-[#E5E7EB] p-5"
        >
          <h1 className="text-2xl font-bold text-[#1B4332] mb-2" dir="rtl">دفع طلب مشترك</h1>
          <p className="text-sm text-gray-600 mb-4" dir="rtl">استخدم رابط الدفع الذي وصلك من داخل التطبيق لإتمام دفع الطلب.</p>

          <div className="flex gap-2">
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="token"
              className="font-mono"
            />
            <Button onClick={claimLink} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4"
          >
            <div className="flex justify-between items-start gap-3" dir="rtl">
              <div>
                <p className="text-xs text-gray-500">رقم الطلب</p>
                <p className="font-bold text-[#1B4332]">{order.order_number || order.id}</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-500">المبلغ</p>
                <p className="font-bold text-[#1B4332]">${amountUsd.toFixed(2)}</p>
              </div>
            </div>

            <div className="text-sm text-gray-700" dir="rtl">
              الحالة الحالية: <span className="font-bold">{order.payment_status || order.status || 'pending'}</span>
            </div>

            <div className="rounded-xl border border-[#E5E7EB] p-3" dir="rtl">
              <div className="font-bold mb-2">الدفع عبر PayPal / Card</div>
              <PayPalPayment
                amount={amountUsd > 0 ? amountUsd : 1}
                onSuccess={(details) => markAsPaid('paypal', details)}
                onError={(error) => {
                  console.error('paypal shared payment error', error);
                  toast.error('فشل الدفع عبر PayPal');
                }}
              />
            </div>

            <div className="rounded-xl border border-[#E5E7EB] p-3 space-y-2" dir="rtl">
              <div className="font-bold">تأكيد يدوي (تحويل/واتساب)</div>
              <Input
                value={manualRef}
                onChange={(e) => setManualRef(e.target.value)}
                placeholder="رقم العملية أو المرجع"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => markAsPaid('bank_transfer', { reference: manualRef })}
                  disabled={processingPayment}
                  variant="outline"
                  className="flex-1"
                >
                  <CreditCard className="w-4 h-4 ml-1" />
                  تحويل بنكي
                </Button>
                <Button
                  onClick={() => markAsPaid('cash_on_delivery', { reference: manualRef || 'manual' })}
                  disabled={processingPayment}
                  variant="outline"
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 ml-1" />
                  تأكيد يدوي
                </Button>
              </div>
            </div>

            {shareData?.short_code && (
              <div className="p-3 bg-[#ECFDF5] rounded-xl text-sm text-[#1B4332]" dir="rtl">
                الكود: <span className="font-bold">{shareData.short_code}</span>
                <button
                  type="button"
                  className="mr-2 underline inline-flex items-center gap-1"
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareData.short_code);
                    toast.success('تم نسخ الكود');
                  }}
                >
                  <Copy className="w-3 h-3" /> نسخ
                </button>
              </div>
            )}

            <Button className="w-full" onClick={() => navigate('/MyOrders')}>
              العودة إلى طلباتي
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
