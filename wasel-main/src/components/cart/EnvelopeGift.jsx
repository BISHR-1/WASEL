import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Plus, DollarSign, PoundSterling } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SmartLottie from '@/components/animations/SmartLottie';
import { ANIMATION_PRESETS } from '@/components/animations/animationPresets';

/**
 * EnvelopeGift - مكون هدية نقدية/ظرف
 * يسمح بإضافة مبلغ كهدية بالدولار أو الليرة السورية
 * ملاحظة: السعر يتم حفظه بالليرة السورية (SYP) لمطابقة نظام السلة
 */
export default function EnvelopeGift({ onAddToCart, language = 'ar', exchangeRate = 150 }) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD'); // USD or SYP
  const [isAdding, setIsAdding] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleAddGift = () => {
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    setShowAnimation(true);
    setIsAdding(true);

    // تحويل المبلغ إلى الليرة السورية (SYP) - نفس ما تتوقعه السلة
    let amountInSYP = parseFloat(amount);
    if (currency === 'USD') {
      amountInSYP = parseFloat(amount) * exchangeRate; // مثال: $2 = 2 * 150 = 300 ل.س
    }

    const giftData = {
      id: `gift-${Date.now()}`,
      name: `🎁 هدية نقدية ${parseFloat(amount).toFixed(2)} ${currency === 'USD' ? '$' : 'ل.س'}`,
      price: amountInSYP,
      customer_price: amountInSYP,
      quantity: 1,
      item_type: 'cash_gift',
      currency: currency,
      original_amount: parseFloat(amount),
      original_currency: currency,  // تخزين العملة الأصلية
      image_url: '/images/envelope-gift.png',  // صورة هدية محلية بدون خلفية
      description: language === 'ar' 
        ? 'هدية نقدية'
        : 'Cash Gift'
    };

    onAddToCart?.(giftData);

    // إعادة تعيين النموذج
    setTimeout(() => {
      setAmount('');
      setCurrency('USD');
      setIsAdding(false);
      setShowAnimation(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddGift();
    }
  };

  const displayAmount = amount ? (currency === 'USD' ? `$${amount}` : `${amount} ل.س`) : '';
  const equivalentAmount = amount 
    ? currency === 'USD'
      ? (parseFloat(amount) * exchangeRate).toFixed(0)
      : (parseFloat(amount) / exchangeRate).toFixed(2)
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-6 relative overflow-hidden"
    >
      {/* الخلفية المتحركة */}
      <motion.div
        className="absolute inset-0 opacity-5"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <Mail className="w-48 h-48 text-purple-600" />
      </motion.div>

      <div className="relative z-10">
        {/* عنوان محسّن */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Mail className="w-7 h-7 text-purple-600" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-800">
              {language === 'ar' ? '🎁 أضف هدية نقدية' : '🎁 Add Cash Gift'}
            </h3>
          </div>
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="text-2xl"
          >
            ✨
          </motion.span>
        </div>

        {/* وصف */}
        <p className="text-sm text-gray-600 mb-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {language === 'ar'
            ? 'أرسل هدية نقدية ضمن طلبك. يمكنك الدفع بالدولار أو الليرة السورية.'
            : 'Send a cash gift with your order. You can pay in USD or SYP.'}
        </p>

        {/* حقول الإدخال */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {/* حقل المبلغ */}
          <div className="relative">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === 'ar' ? 'المبلغ' : 'Amount'}
              className="h-12 text-center font-bold bg-white border-2 border-purple-300 focus:border-purple-600"
              disabled={isAdding}
              step="0.01"
              min="0"
            />
          </div>

          {/* انتقاء العملة */}
          <div className="flex gap-2">
            {['USD', 'SYP'].map((curr) => (
              <motion.button
                key={curr}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrency(curr)}
                disabled={isAdding}
                className={`
                  flex-1 h-12 rounded-lg font-bold text-sm transition-all
                  ${currency === curr
                    ? 'bg-purple-600 text-white border-2 border-purple-600'
                    : 'bg-white text-purple-600 border-2 border-purple-300 hover:border-purple-600'
                  }
                  ${isAdding ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {curr === 'USD' ? '$' : 'ل.س'}
              </motion.button>
            ))}
          </div>

          {/* زر الإضافة */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddGift}
            disabled={!amount || parseFloat(amount) <= 0 || isAdding}
            className="h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-sm hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isAdding ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                <Plus className="w-5 h-5" />
              </motion.div>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>{language === 'ar' ? 'أضف' : 'Add'}</span>
              </>
            )}
          </motion.button>
        </div>

        {/* معلومات سعر الصرف */}
        {amount && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg p-3 border-l-4 border-purple-600 text-sm"
          >
            <div className="flex justify-between items-center gap-4" dir="rtl">
              <span className="text-gray-700 font-semibold">{displayAmount}</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="text-gray-400 text-lg"
              >
                ↔
              </motion.div>
              <span className="text-gray-600">
                {equivalentAmount} {currency === 'USD' ? 'ل.س' : '$'}
              </span>

              {/* سعر الصرف */}
              <div className="text-xs text-gray-500 ml-auto">
                {language === 'ar'
                  ? `(سعر الصرف: ${exchangeRate} ل.س/$)`
                  : `(Rate: ${exchangeRate} SYP/USD)`}
              </div>
            </div>
          </motion.div>
        )}

        {/* الانيميشن عند الإضافة */}
        {showAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <SmartLottie
              animationPath={ANIMATION_PRESETS.addToCartSuccess.path}
              width={120}
              height={120}
              trigger="never"
              autoplay={true}
              loop={false}
              hideWhenDone={true}
            />
          </motion.div>
        )}

        {/* نصائح */}
        <div className="mt-4 text-xs text-gray-600 bg-white/60 rounded-lg p-3">
          <span className="font-semibold block mb-1">💡 {language === 'ar' ? 'نصيحة:' : 'Tip:'}</span>
          <ul className="list-disc list-inside space-y-1">
            <li>{language === 'ar' 
              ? 'يمكن إرسال هدية نقدية بأي مبلغ'
              : 'You can send any amount as a gift'}</li>
            <li>{language === 'ar'
              ? 'الدولار والليرة السورية مدعومة'
              : 'USD and SYP are supported'}</li>
            <li>{language === 'ar'
              ? 'ستُضاف الهدية إلى سلتك'
              : 'The gift will be added to your cart'}</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
