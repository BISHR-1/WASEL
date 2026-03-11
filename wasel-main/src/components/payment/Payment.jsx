import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, Shield, Lock } from 'lucide-react';
import { createPayPalPayment } from '@/api/paypalClient';

export default function PayPalPayment({
  orderId,
  amount,
  currency = 'USD',
  orderDescription,
  items,
  onError
}) {
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  const handlePayment = async () => {
    setLoading(true);

    try {
      const response = await createPayPalPayment({
        orderId,
        amount,
        currency,
        orderDescription,
        items
      });

      if (response?.success && response?.approveUrl) {
        // 🔁 PayPal Redirect
        window.open(response.approveUrl, '_blank');
        setLoading(false);
      } else {
        throw new Error(response?.error || 'فشل إنشاء طلب PayPal');
      }

    } catch (err) {
      console.error('PayPal payment error:', err);
      onError?.('حدث خطأ أثناء الدفع عبر PayPal');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Security Badges */}
      <div className="flex items-center justify-center gap-6 py-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Shield className="w-5 h-5 text-green-600" />
          <span className="font-medium">محمي بـ SSL</span>
        </div>
        <div className="w-px h-6 bg-gray-300" />
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Lock className="w-5 h-5 text-blue-600" />
          <span className="font-medium">دفع آمن 100%</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-[#F5E6D3] rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-[#1B4332] text-lg">
              الدفع الإلكتروني الآمن
            </h3>
            <p className="text-sm text-[#1B4332]/60">
              عبر PayPal
            </p>
          </div>
        </div>

        <div className="bg-white/70 rounded-xl p-4 space-y-2 text-sm">
          <p className="flex items-center gap-2 text-[#1B4332]/70">
            ✓ PayPal / بطاقات ائتمانية
          </p>
          <p className="flex items-center gap-2 text-[#1B4332]/70">
            ✓ دعم العملات العالمية
          </p>
          <p className="flex items-center gap-2 text-[#1B4332]/70">
            ✓ دفع مشفر بالكامل
          </p>
        </div>
      </div>

      {/* Amount */}
      <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-2xl p-6">
        <div className="flex items-center justify-between text-white">
          <span className="text-lg font-semibold">المبلغ الإجمالي:</span>
          <span className="text-3xl font-bold">
            ${amount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Pay Button */}
      <Button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-7 rounded-2xl text-lg font-bold shadow-xl"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 ml-2 animate-spin" />
            جاري التحضير...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 ml-2" />
            ادفع عبر PayPal
          </>
        )}
      </Button>

      {/* Trust */}
      <div className="text-center space-y-2">
        <p className="text-xs text-[#1B4332]/50">
          🔒 جميع المعاملات مشفرة 256-bit SSL
        </p>
        <p className="text-xs text-[#1B4332]/50">
          لا نقوم بحفظ أي بيانات دفع
        </p>
      </div>

    </div>
  );
}
