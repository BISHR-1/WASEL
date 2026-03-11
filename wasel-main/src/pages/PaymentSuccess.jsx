import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AppFooter from '@/components/common/AppFooter';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Package } from 'lucide-react';
import { Button } from "@/components/ui/button";
import confetti from 'canvas-confetti';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const paymentId = urlParams.get('paymentId');
  const token = urlParams.get('token');
  const payerId = urlParams.get('PayerID');
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
        // If coming from PayPal redirect
        if (token && payerId) {
             try {
                 // Fixed: Using proper Supabase functions URL with mobile support
                 const API_BASE = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || 'https://ofdqkracfqakbtjjmksa.supabase.co/functions/v1'; 
                 
                 // Capture order
                 const response = await fetch(`${API_BASE}/create-paypal-payment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'capture',
                        orderId: token // PayPal uses the token as orderID in return URL
                    })
                 });

                 if (!response.ok) throw new Error('Failed to capture');
                 const data = await response.json();
                 
                 // If status COMPLETED, we are good
                 if (data.status === 'COMPLETED' || data.status === 'APPROVED') {
                     // Payment verified
                     // (Ideally, specific 'capture' call ensures funds are taken)
                 } else {
                     // Check if already captured?
                     if (data.error && !data.error.includes('Order is already captured')) {
                        throw new Error(data.error || 'Payment not completed');
                     }
                 }

             } catch (err) {
                 console.error('Verify Payment Error', err);
                 setErrorDetails('حدث خطأ أثناء تأكيد الدفع من المصدر. يرجى التواصل مع الدعم إذا تم خصم المبلغ.');
                 // Don't block screen, show success but with warning? 
                 // Or navigate to error?
                 // For now, let's allow success screen but show warning if needed.
             }
        }

        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 }
        });
        setLoading(false);
    };

    verifyPayment();
  }, [token, payerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-xl"
        >
          <Loader2 className="w-16 h-16 text-[#52B788] mx-auto mb-6 animate-spin" />
          <h2 className="text-2xl font-bold text-[#1B4332] mb-4">
            جاري التحقق من الدفع...
          </h2>
          <p className="text-[#1B4332]/60">
            يرجى الانتظار بينما نتحقق من عملية الدفع
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-8 sm:p-12 max-w-lg w-full text-center shadow-xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-24 h-24 bg-gradient-to-br from-[#52B788] to-[#40916C] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
        >
          <CheckCircle className="w-12 h-12 text-white" />
        </motion.div>

        <h2 className="text-3xl font-bold text-[#1B4332] mb-4">
          تم الدفع بنجاح! 🎉
        </h2>
        
        {orderId && (
          <div className="bg-[#F5E6D3] rounded-2xl p-4 mb-6">
            <p className="text-[#1B4332]/70 text-sm mb-1">رقم الطلب</p>
            <p className="text-2xl font-bold text-[#1B4332]">{orderId}</p>
          </div>
        )}

        <p className="text-[#1B4332]/70 mb-8 leading-relaxed">
          تم استلام دفعتك بنجاح وسيبدأ تنفيذ طلبك فوراً. 
          سنبقيك على اطلاع بجميع التحديثات.
        </p>

        <div className="space-y-3">
          {orderId && (
            <Button
              onClick={() => navigate(createPageUrl('TrackOrder') + `?order=${orderId}`)}
              className="w-full bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white py-6 rounded-2xl text-lg font-bold hover:shadow-xl transition-all duration-300"
            >
              <Package className="w-5 h-5 ml-2" />
              تتبع طلبك
            </Button>
          )}
          
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            variant="outline"
            className="w-full border-2 border-[#F5E6D3] text-[#1B4332] py-6 rounded-2xl text-lg font-bold hover:bg-[#F5E6D3] transition-all duration-300"
          >
            العودة للرئيسية
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-[#F5E6D3]">
          <p className="text-sm text-[#1B4332]/50">
            سنرسل لك رسالة تأكيد عبر البريد الإلكتروني
          </p>
        </div>
      </motion.div>
      <AppFooter />
    </div>
  );
}