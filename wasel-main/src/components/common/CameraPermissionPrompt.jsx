import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, QrCode, CreditCard, Wallet } from 'lucide-react';

const STORAGE_KEY = 'wasel_camera_prompt_shown';

export default function CameraPermissionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const shown = localStorage.getItem(STORAGE_KEY);
    if (shown) return;

    // Show after 8 seconds on first visit
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleAllow = async () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setShowPrompt(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      // Stop immediately - we just needed the permission
      stream.getTracks().forEach(t => t.stop());
    } catch {
      // User denied or not supported - that's ok
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 z-[60] flex items-end sm:items-center justify-center p-4"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <button onClick={handleDismiss} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <X className="w-4 h-4 text-gray-500" />
            </button>

            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#059669] flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>

            <h3 className="text-lg font-black text-gray-900 text-center mb-2">السماح باستخدام الكاميرا</h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              يحتاج تطبيق واصل إلى الكاميرا لمسح بطاقات الشحن
            </p>

            <div className="space-y-2 mb-5">
              {[
                { icon: QrCode, text: 'مسح رمز QR لبطاقات الرصيد' },
                { icon: Wallet, text: 'شحن المحفظة فوراً من البطاقة' },
                { icon: CreditCard, text: 'دفع الطلبات بسرعة من رصيدك' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-[#F0FDF4]">
                  <item.icon className="w-4 h-4 text-[#059669] shrink-0" />
                  <p className="text-sm text-[#166534]">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAllow}
                className="flex-1 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl py-3 font-bold text-sm transition"
              >
                السماح
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-3 font-bold text-sm transition"
              >
                لاحقاً
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
