import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PayPalPayment from './PayPalPayment';

/**
 * PayPalModal - Modal wrapper لـ PayPal payment
 * يحل مشكلة الـ redirect على الموبايل
 */
export default function PayPalModal({ 
  isOpen, 
  onClose, 
  amount, 
  onSuccess, 
  onError,
  language = 'ar'
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSuccess = (details) => {
    setIsProcessing(false);
    onSuccess?.(details);
    setTimeout(() => {
      onClose?.();
    }, 1000);
  };

  const handleError = (err) => {
    setIsProcessing(false);
    onError?.(err);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* الخلفية المعتمة */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />

          {/* الـ Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto relative">
              {/* الرأس */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-3xl flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {language === 'ar' ? '💳 الدفع عبر PayPal' : '💳 PayPal Payment'}
                  </h2>
                  <p className="text-sm text-blue-100 mt-1">
                    {language === 'ar' 
                      ? 'دفع آمن وموثوق'
                      : 'Secure payment'}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>
              </div>

              {/* المحتوى */}
              <div className="p-6">
                {/* المبلغ */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">
                    {language === 'ar' ? 'المبلغ المطلوب' : 'Amount Due'}
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    ${Number(amount).toFixed(2)}
                  </p>
                </div>

                {/* مكون الدفع */}
                <div className="mb-6">
                  <PayPalPayment
                    amount={amount}
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                </div>

                {/* معلومات الأمان */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                  <p className="font-semibold mb-1">🔒 {language === 'ar' ? 'دفع آمن' : 'Secure Payment'}</p>
                  <ul className="text-xs space-y-1 text-green-600">
                    <li>✓ {language === 'ar' ? 'بيانات محمية بـ SSL' : 'SSL Protected'}</li>
                    <li>✓ {language === 'ar' ? 'معايير PCI DSS' : 'PCI DSS Compliant'}</li>
                    <li>✓ {language === 'ar' ? 'حماية المشتري' : 'Buyer Protection'}</li>
                  </ul>
                </div>

                {/* زر الإغلاق */}
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full mt-4 h-10 rounded-lg"
                >
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </Button>
              </div>

              {/* شريط التحميل */}
              {isProcessing && (
                <motion.div
                  layoutId="progress"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-blue-400"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 2 }}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
