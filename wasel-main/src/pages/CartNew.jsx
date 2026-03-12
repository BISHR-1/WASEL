// =====================================================
// WASEL - NEW CART PAGE (Noon-Style High Conversion)
// File: src/pages/CartNew.jsx
// =====================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/components/cart/CartContext';
import { 
  Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag,
  Truck, Gift, CreditCard, Banknote, ChevronLeft,
  Heart, Sparkles, CheckCircle, X, Loader2, Edit3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// =====================================================
// CONSTANTS
// =====================================================
const PRIMARY_COLOR = '#C2185B';
const EXCHANGE_RATE = 4500; // 1 USD = 4500 SYP
const FREE_DELIVERY_THRESHOLD = 15; // USD
const MARKUP_FACTOR = 1.20; // 20% markup for phantom discount
const FAKE_DELIVERY_FEE = 2.00; // USD

// Suggested Add-ons (Upsell Items)
const UPSELL_ITEMS = [
  { id: 'upsell-1', name_ar: 'بيبسي', image: '/images/pepsi.png', price_usd: 1.00 },
  { id: 'upsell-2', name_ar: 'سندويش شاورما صغيرة', image: '/images/shawarma-small.png', price_usd: 2.50 },
  { id: 'upsell-3', name_ar: 'وجبة شاورما عربي', image: '/images/shawarma-meal.png', price_usd: 5.50 },
  { id: 'upsell-4', name_ar: 'وجبة خراطيش السعادة', image: '/images/happiness-meal.png', price_usd: 9.50 },
];

// Tip Options
const TIP_OPTIONS = [
  { value: 0.50, label: '2', emoji: '🥤' },
  { value: 1.00, label: '4', emoji: '😊' },
  { value: 1.50, label: '6', emoji: '🎉', popular: true },
  { value: 'custom', label: 'تخصيص', emoji: '✏️' },
];

// =====================================================
// EMPTY CART COMPONENT
// =====================================================
function EmptyCart({ onNavigate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <ShoppingBag className="w-14 h-14 text-gray-300" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2" dir="rtl">
        سلتك فارغة
      </h2>
      <p className="text-gray-500 text-center max-w-xs mb-6" dir="rtl">
        ابدأ التسوق وأضف أطباقك المفضلة إلى السلة
      </p>
      <button
        onClick={onNavigate}
        className="inline-flex items-center gap-2 px-8 py-3 bg-[#C2185B] text-white rounded-xl font-bold hover:bg-[#A01550] transition-colors shadow-lg"
      >
        تصفح القائمة
        <ChevronLeft className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// =====================================================
// PROGRESS BAR - FREE DELIVERY GAMIFICATION
// =====================================================
function FreeDeliveryProgress({ currentTotal, threshold }) {
  const progress = Math.min((currentTotal / threshold) * 100, 100);
  const remaining = Math.max(threshold - currentTotal, 0);
  const isUnlocked = currentTotal >= threshold;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-2xl mb-4 ${isUnlocked ? 'bg-green-50' : 'bg-yellow-50'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Truck className={`w-5 h-5 ${isUnlocked ? 'text-green-600' : 'text-yellow-600'}`} />
          <span className={`font-bold text-sm ${isUnlocked ? 'text-green-700' : 'text-yellow-700'}`} dir="rtl">
            {isUnlocked ? 'مبروك! التوصيل مجاني 🎉' : `أضف بـ $${remaining.toFixed(2)} للتوصيل المجاني`}
          </span>
        </div>
        {!isUnlocked && (
          <span className="text-xs text-yellow-600 font-medium">
            {progress.toFixed(0)}%
          </span>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${isUnlocked ? 'bg-green-500' : 'bg-[#C2185B]'}`}
        />
      </div>
    </motion.div>
  );
}

// =====================================================
// CART ITEM ROW
// =====================================================
function CartItemRow({ item, onQuantityChange, onRemove, isUpdating }) {
  const priceSYP = Math.round((item.price_usd || item.customer_price || 0) * EXCHANGE_RATE);
  const itemTotal = (item.price_usd || item.customer_price || 0) * item.quantity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      className="flex gap-3 p-3 bg-white rounded-xl border-b border-gray-100"
      dir="rtl"
    >
      {/* Image */}
      <div className="w-[80px] h-[80px] rounded-xl overflow-hidden bg-gray-100 shrink-0">
        <img 
          src={item.image_url || item.image || '/placeholder-food.png'} 
          alt={item.name_ar || item.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = '/placeholder-food.png'; }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 text-sm line-clamp-1">
          {item.name_ar || item.name}
        </h4>
        <p className="text-[#C2185B] font-bold text-sm mt-1">
          ل.س {priceSYP.toLocaleString()}
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center bg-white rounded-full border border-[#C2185B]/20 overflow-hidden">
            <button
              onClick={() => onQuantityChange(item.id, item.quantity - 1)}
              disabled={isUpdating}
              className="w-7 h-7 flex items-center justify-center text-[#C2185B] hover:bg-[#C2185B]/10 transition-colors disabled:opacity-50"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-6 text-center font-bold text-[#C2185B] text-sm">
              {item.quantity}
            </span>
            <button
              onClick={() => onQuantityChange(item.id, item.quantity + 1)}
              disabled={isUpdating}
              className="w-7 h-7 flex items-center justify-center text-[#C2185B] hover:bg-[#C2185B]/10 transition-colors disabled:opacity-50"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={() => onRemove(item.id)}
            disabled={isUpdating}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Item Total */}
      <div className="text-left shrink-0">
        <p className="font-bold text-gray-900 text-sm">
          ل.س {Math.round(itemTotal * EXCHANGE_RATE).toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
}

// =====================================================
// UPSELL CAROUSEL
// =====================================================
function UpsellCarousel({ items, onAddItem }) {
  return (
    <div className="bg-white rounded-2xl p-4 mt-4">
      <h3 className="font-bold text-gray-900 mb-3 text-base" dir="rtl">
        هل ترغب بإضافة هذا؟ 🍟
      </h3>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            whileTap={{ scale: 0.95 }}
            className="w-[120px] shrink-0 bg-gray-50 rounded-xl p-2 relative"
          >
            {/* Image */}
            <div className="h-20 w-full rounded-lg overflow-hidden bg-white mb-2">
              <img 
                src={item.image || '/placeholder-food.png'} 
                alt={item.name_ar}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = '/placeholder-food.png'; }}
              />
            </div>
            
            {/* Add Button - Floating */}
            <button
              onClick={() => onAddItem(item)}
              className="absolute top-2 left-2 w-6 h-6 bg-[#C2185B] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#A01550] transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Title */}
            <p className="text-xs font-medium text-gray-800 line-clamp-1 text-center" dir="rtl">
              {item.name_ar}
            </p>
            
            {/* Price */}
            <p className="text-xs font-bold text-[#C2185B] text-center mt-1">
              ل.س {Math.round(item.price_usd * EXCHANGE_RATE).toLocaleString()}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// TIP SECTION
// =====================================================
function TipSection({ selectedTip, onTipChange, customTip, onCustomTipChange }) {
  const [showCustomInput, setShowCustomInput] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🛵</span>
        <div>
          <h3 className="font-bold text-gray-900 text-base" dir="rtl">اشكر مندوب التوصيل</h3>
          <p className="text-xs text-gray-500" dir="rtl">ادعم مندوب التوصيل بإكرامية، أفعالك اللطيفة تترك آثار كبيرة!</p>
        </div>
      </div>

      {/* Tip Options Grid */}
      <div className="grid grid-cols-4 gap-2 mt-3">
        {TIP_OPTIONS.map((option) => {
          const isSelected = option.value === 'custom' 
            ? showCustomInput 
            : selectedTip === option.value;

          return (
            <button
              key={option.label}
              onClick={() => {
                if (option.value === 'custom') {
                  setShowCustomInput(true);
                  onTipChange(customTip || 0);
                } else {
                  setShowCustomInput(false);
                  onTipChange(option.value);
                }
              }}
              className={`relative py-2 px-2 rounded-xl text-center transition-all ${
                isSelected 
                  ? 'bg-[#C2185B]/10 border-2 border-[#C2185B] text-[#C2185B]' 
                  : 'bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100'
              }`}
            >
              {option.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#C2185B] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  الأكثر إكرامية
                </span>
              )}
              <span className="text-lg">{option.emoji}</span>
              <p className="text-xs font-bold mt-0.5">
                {option.value === 'custom' ? option.label : `ل.س ${option.label}`}
              </p>
            </button>
          );
        })}
      </div>

      {/* Custom Tip Input */}
      <AnimatePresence>
        {showCustomInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
              <Edit3 className="w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={customTip || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  onCustomTipChange(value);
                  onTipChange(value);
                }}
                placeholder="أدخل المبلغ"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                dir="rtl"
              />
              <span className="text-xs text-gray-500">ل.س</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkbox */}
      <label className="flex items-center gap-2 mt-3 cursor-pointer">
        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#C2185B] focus:ring-[#C2185B]" />
        <span className="text-xs text-gray-600" dir="rtl">أضف نفس الإكرامية على الطلبات القادمة</span>
      </label>

      {/* Driver Info */}
      <div className="flex items-center gap-2 mt-3 text-xs text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span dir="rtl">سيتم تحويل 100% من الإكرامية لمندوب التوصيل</span>
      </div>
    </div>
  );
}

// =====================================================
// PAYMENT METHOD SELECTOR
// =====================================================
function PaymentMethodSelector({ selected, onChange }) {
  return (
    <div className="bg-white rounded-2xl p-4 mt-4">
      <h3 className="font-bold text-gray-900 mb-3 text-base" dir="rtl">طريقة الدفع</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Card Payment */}
        <button
          onClick={() => onChange('card')}
          className={`p-3 rounded-xl border-2 transition-all ${
            selected === 'card' 
              ? 'border-[#C2185B] bg-[#C2185B]/5' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <CreditCard className={`w-5 h-5 ${selected === 'card' ? 'text-[#C2185B]' : 'text-gray-500'}`} />
            <span className={`text-sm font-medium ${selected === 'card' ? 'text-[#C2185B]' : 'text-gray-700'}`} dir="rtl">
              بطاقة ائتمان
            </span>
          </div>
          <div className="flex items-center justify-center gap-1 mt-2">
            <img src="/visa.svg" alt="Visa" className="h-4" />
            <img src="/mastercard.svg" alt="Mastercard" className="h-4" />
          </div>
        </button>

        {/* Cash on Delivery */}
        <button
          onClick={() => onChange('cod')}
          className={`p-3 rounded-xl border-2 transition-all ${
            selected === 'cod' 
              ? 'border-[#C2185B] bg-[#C2185B]/5' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Banknote className={`w-5 h-5 ${selected === 'cod' ? 'text-[#C2185B]' : 'text-gray-500'}`} />
            <span className={`text-sm font-medium ${selected === 'cod' ? 'text-[#C2185B]' : 'text-gray-700'}`} dir="rtl">
              عند الاستلام
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}

// =====================================================
// COUPON INPUT
// =====================================================
function CouponInput({ appliedCoupon, onApply, onRemove, isLoading }) {
  const [code, setCode] = useState('');

  return (
    <div className="bg-white rounded-2xl p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-5 h-5 text-[#C2185B]" />
        <h3 className="font-bold text-gray-900 text-base" dir="rtl">كود الخصم</h3>
      </div>

      {appliedCoupon ? (
        <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-bold text-green-700">{appliedCoupon.code}</span>
            <span className="text-sm text-green-600">
              -{appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `$${appliedCoupon.value}`}
            </span>
          </div>
          <button onClick={onRemove} className="text-gray-400 hover:text-red-500 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="أدخل كود الخصم"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C2185B] focus:ring-1 focus:ring-[#C2185B]"
            dir="rtl"
          />
          <button
            onClick={() => { onApply(code); setCode(''); }}
            disabled={!code.trim() || isLoading}
            className="px-6 py-3 bg-[#C2185B] text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#A01550] transition-colors"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تطبيق'}
          </button>
        </div>
      )}
    </div>
  );
}

// =====================================================
// ORDER SUMMARY (PHANTOM DISCOUNT LOGIC)
// =====================================================
function OrderSummary({ realTotal, tip, couponDiscount }) {
  // Phantom Discount Calculation
  const displayedSubtotal = realTotal * MARKUP_FACTOR;
  const fakeDeliveryFee = FAKE_DELIVERY_FEE;
  const phantomDiscount = (displayedSubtotal + fakeDeliveryFee) - realTotal;
  
  // Convert to SYP for display
  const subtotalSYP = Math.round(displayedSubtotal * EXCHANGE_RATE);
  const deliveryFeeSYP = Math.round(fakeDeliveryFee * EXCHANGE_RATE);
  const discountSYP = Math.round(phantomDiscount * EXCHANGE_RATE);
  const serviceFee = Math.round(0.05 * realTotal * EXCHANGE_RATE); // 5% service fee (part of phantom)
  const tipSYP = Math.round((tip || 0) * EXCHANGE_RATE);
  const couponDiscountSYP = Math.round((couponDiscount || 0) * EXCHANGE_RATE);
  const finalTotalSYP = Math.round(realTotal * EXCHANGE_RATE) + tipSYP - couponDiscountSYP;

  return (
    <div className="bg-white rounded-2xl p-4 mt-4">
      {/* Summary Lines */}
      <div className="space-y-3">
        {/* Subtotal (Inflated) */}
        <div className="flex justify-between text-sm" dir="rtl">
          <span className="text-gray-600">المجموع الفرعي</span>
          <span className="text-gray-900">ل.س {subtotalSYP.toLocaleString()}</span>
        </div>

        {/* Discount (Phantom) */}
        <div className="flex justify-between text-sm" dir="rtl">
          <span className="text-gray-600">الخصم</span>
          <span className="text-green-600 font-bold">- ل.س {discountSYP.toLocaleString()}</span>
        </div>

        {/* Service Fee */}
        <div className="flex justify-between text-sm" dir="rtl">
          <span className="text-gray-600 flex items-center gap-1">
            رسوم الخدمة
            <span className="text-xs text-gray-400">ⓘ</span>
          </span>
          <span className="text-gray-900">ل.س {serviceFee.toLocaleString()}</span>
        </div>

        {/* Delivery Fee (Crossed out + Free) */}
        <div className="flex justify-between text-sm items-center" dir="rtl">
          <span className="text-gray-600">رسوم التوصيل</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 line-through text-xs">ل.س {deliveryFeeSYP.toLocaleString()}</span>
            <span className="text-green-600 font-bold">مجاناً</span>
          </div>
        </div>

        {/* Tip (if any) */}
        {tip > 0 && (
          <div className="flex justify-between text-sm" dir="rtl">
            <span className="text-gray-600">إكرامية المندوب</span>
            <span className="text-gray-900">ل.س {tipSYP.toLocaleString()}</span>
          </div>
        )}

        {/* Coupon Discount (if any) */}
        {couponDiscount > 0 && (
          <div className="flex justify-between text-sm" dir="rtl">
            <span className="text-gray-600">خصم الكوبون</span>
            <span className="text-green-600 font-bold">- ل.س {couponDiscountSYP.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Savings Banner */}
      <div className="mt-4 py-2 px-3 bg-green-50 rounded-lg flex items-center justify-center gap-2">
        <Gift className="w-4 h-4 text-green-600" />
        <span className="text-sm text-green-700 font-medium" dir="rtl">
          مبروك عليك! وفّرت ل.س {discountSYP.toLocaleString()} على هذا الطلب 🎉
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 my-4" />

      {/* Final Total */}
      <div className="flex justify-between items-center" dir="rtl">
        <span className="font-bold text-gray-900 text-lg">قيمة الطلب</span>
        <span className="font-bold text-gray-900 text-2xl">ل.س {finalTotalSYP.toLocaleString()}</span>
      </div>

      {/* Warning */}
      <p className="text-xs text-red-500 text-center mt-3" dir="rtl">
        لا يمكن إلغاء أو استرجاع المبلغ بعد إجراء الطلب.
      </p>
    </div>
  );
}

// =====================================================
// FLOATING CHECKOUT BUTTON
// =====================================================
function FloatingCheckoutButton({ total, isLoading, onCheckout }) {
  const totalSYP = Math.round(total * EXCHANGE_RATE);

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-50">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onCheckout}
        disabled={isLoading}
        className="w-full h-[52px] bg-[#C2185B] text-white rounded-xl font-bold flex items-center justify-between px-6 hover:bg-[#A01550] transition-colors disabled:opacity-70 shadow-lg"
      >
        <span className="text-lg">إتمام الطلب</span>
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <span className="text-lg font-bold">ل.س {totalSYP.toLocaleString()}</span>
        )}
      </motion.button>
    </div>
  );
}

// =====================================================
// MAIN CART COMPONENT
// =====================================================
export default function CartNew() {
  const navigate = useNavigate();
  const { cartItems = [], updateQuantity, removeFromCart, addToCart, clearCart } = useCart() || {};
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedTip, setSelectedTip] = useState(0);
  const [customTip, setCustomTip] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Calculate real total (actual price)
  const realTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price = item.price_usd || item.customer_price || 0;
      return sum + (price * item.quantity);
    }, 0);
  }, [cartItems]);

  // Coupon discount
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percentage') {
      return (realTotal * appliedCoupon.value) / 100;
    }
    return appliedCoupon.value;
  }, [appliedCoupon, realTotal]);

  // Final total for checkout
  const finalTotal = realTotal + selectedTip - couponDiscount;

  // Handle quantity change
  const handleQuantityChange = useCallback(async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart?.(itemId);
    } else {
      setIsUpdating(true);
      await updateQuantity?.(itemId, newQuantity);
      setIsUpdating(false);
    }
  }, [updateQuantity, removeFromCart]);

  // Handle remove item
  const handleRemoveItem = useCallback((itemId) => {
    removeFromCart?.(itemId);
    toast.success('تم حذف العنصر من السلة');
  }, [removeFromCart]);

  // Handle add upsell item
  const handleAddUpsellItem = useCallback((item) => {
    addToCart?.({
      ...item,
      customer_price: item.price_usd,
      quantity: 1
    });
    toast.success(`تمت إضافة ${item.name_ar} إلى السلة`);
  }, [addToCart]);

  // Handle apply coupon
  const handleApplyCoupon = useCallback(async (code) => {
    setCouponLoading(true);
    // Simulate API call
    setTimeout(() => {
      if (code === 'WASEL20' || code === 'WELCOME10') {
        setAppliedCoupon({
          code,
          type: 'percentage',
          value: code === 'WASEL20' ? 20 : 10
        });
        toast.success('تم تطبيق الكوبون بنجاح!');
      } else {
        toast.error('كود الخصم غير صالح');
      }
      setCouponLoading(false);
    }, 1000);
  }, []);

  // Handle checkout
  const handleCheckout = useCallback(async () => {
    if (cartItems.length === 0) {
      toast.error('السلة فارغة');
      return;
    }

    setIsCheckingOut(true);
    try {
      // Navigate to checkout or process payment
      toast.success('جاري تجهيز طلبك...');
      // await processOrder();
      navigate('/checkout');
    } catch (error) {
      toast.error('حدث خطأ، حاول مرة أخرى');
    } finally {
      setIsCheckingOut(false);
    }
  }, [cartItems, navigate]);

  // Empty cart state
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] font-['Cairo']">
        <EmptyCart onNavigate={() => navigate('/menu')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-['Cairo'] pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-40">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowRight className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="font-bold text-lg text-gray-900" dir="rtl">سلة الطلبات</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="px-4 py-4">
        {/* Free Delivery Progress */}
        <FreeDeliveryProgress 
          currentTotal={realTotal} 
          threshold={FREE_DELIVERY_THRESHOLD} 
        />

        {/* Cart Items */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <AnimatePresence>
            {cartItems.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemoveItem}
                isUpdating={isUpdating}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Upsell Carousel */}
        <UpsellCarousel items={UPSELL_ITEMS} onAddItem={handleAddUpsellItem} />

        {/* Tip Section */}
        <TipSection
          selectedTip={selectedTip}
          onTipChange={setSelectedTip}
          customTip={customTip}
          onCustomTipChange={setCustomTip}
        />

        {/* Coupon Input */}
        <CouponInput
          appliedCoupon={appliedCoupon}
          onApply={handleApplyCoupon}
          onRemove={() => setAppliedCoupon(null)}
          isLoading={couponLoading}
        />

        {/* Payment Method */}
        <PaymentMethodSelector
          selected={paymentMethod}
          onChange={setPaymentMethod}
        />

        {/* Order Summary */}
        <OrderSummary
          realTotal={realTotal}
          tip={selectedTip}
          couponDiscount={couponDiscount}
        />
      </div>

      {/* Floating Checkout Button */}
      <FloatingCheckoutButton
        total={finalTotal}
        isLoading={isCheckingOut}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
