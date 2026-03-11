import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Gift, Package as PackageIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const wrappingOptions = [
  { id: 'standard', name: 'تغليف عادي', price: 0, image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=200&h=150&fit=crop' },
  { id: 'luxury', name: 'تغليف فاخر', price: 5000, image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200&h=150&fit=crop' },
  { id: 'premium', name: 'تغليف بريميوم مع ورق ذهبي', price: 10000, image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=200&h=150&fit=crop' },
];

const additionalItems = [
  { id: 'card', name: 'بطاقة تهنئة مخصصة', price: 3000 },
  { id: 'balloon', name: 'بالونات إضافية', price: 5000 },
  { id: 'chocolate', name: 'شوكولاتة إضافية', price: 8000 },
  { id: 'flowers', name: 'ورود إضافية', price: 15000 },
];

export default function CustomizationModal({ item, itemType, isOpen, onClose, onConfirm }) {
  const [selectedWrapping, setSelectedWrapping] = useState('standard');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [customMessage, setCustomMessage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addCashGift, setAddCashGift] = useState(false);
  const [cashGiftAmount, setCashGiftAmount] = useState('');
  const [cashGiftCurrency, setCashGiftCurrency] = useState('SYP');

  const USD_TO_SYP = 115;

  const handleAddonToggle = (addonId) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const calculateTotal = () => {
    const basePrice = Math.max(0, parseInt(item?.price) || 0);
    const wrappingPrice = Math.max(0, wrappingOptions.find(w => w.id === selectedWrapping)?.price || 0);
    const addonsPrice = Array.isArray(selectedAddons) ? selectedAddons.reduce((sum, addonId) => {
      const addon = additionalItems.find(a => a?.id === addonId);
      return sum + Math.max(0, addon?.price || 0);
    }, 0) : 0;

    let cashGiftPrice = 0;
    if (addCashGift && cashGiftAmount) {
        if (cashGiftCurrency === 'USD') {
            cashGiftPrice = parseFloat(cashGiftAmount) * USD_TO_SYP;
        } else {
            cashGiftPrice = parseInt(cashGiftAmount) || 0;
        }
    }

    // Cash gift is NOT multiplied by quantity usually, it's one envelope per item or order?
    // Let's assume it's per customization (one-time for this specific customization instance)
    // But since `quantity` multiplies the whole package...
    // The prompt says "add a cash gift delivered... with the order".
    // If user buys 2 packages, usually they want 1 cash gift? Or 2?
    // Let's assume cash gift is multiplied by quantity if it's attached to the item.
    // Or we can treat it as separate.
    // For simplicity and logic: if I buy 2 packages, I might want 2 gifts.
    // Let's make cash gift part of the unit price essentially.
    
    return ((basePrice + wrappingPrice + addonsPrice) * quantity) + (cashGiftPrice * quantity);
  };

  const handleConfirm = () => {
    if (!item || typeof onConfirm !== 'function') return;
    
    let cashGiftValue = 0;
    if (addCashGift && cashGiftAmount) {
        const amount = parseFloat(cashGiftAmount);
        if (!isNaN(amount) && amount > 0) {
            if (cashGiftCurrency === 'USD') {
                cashGiftValue = Math.max(0, amount * USD_TO_SYP);
            } else {
                cashGiftValue = Math.max(0, parseInt(cashGiftAmount) || 0);
            }
        }
    }

    const customization = {
      wrapping: wrappingOptions.find(w => w?.id === selectedWrapping) || wrappingOptions[0],
      addons: Array.isArray(selectedAddons) ? additionalItems.filter(a => selectedAddons.includes(a?.id)) : [],
      customMessage: customMessage || '',
      quantity: Math.max(1, quantity),
      cashGift: addCashGift && cashGiftValue > 0 ? {
          amount: cashGiftAmount,
          currency: cashGiftCurrency,
          valueInSYP: cashGiftValue
      } : null,
      totalExtraCost: Math.max(0, (
          (wrappingOptions.find(w => w?.id === selectedWrapping)?.price || 0) +
          (Array.isArray(selectedAddons) ? selectedAddons.reduce((sum, addonId) => sum + Math.max(0, additionalItems.find(a => a?.id === addonId)?.price || 0), 0) : 0) +
          cashGiftValue
      )),
      totalPrice: calculateTotal()
    };
    try {
      onConfirm(customization);
    } catch (error) {
      console.error('Error confirming customization:', error?.message || error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] p-6 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {itemType === 'gift' ? (
                  <Gift className="w-8 h-8 text-white" />
                ) : (
                  <PackageIcon className="w-8 h-8 text-white" />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-white">تخصيص طلبك</h2>
                  <p className="text-white/80 text-sm">{item.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Quantity */}
            <div className="bg-[#F5E6D3] rounded-2xl p-4">
              <Label className="text-[#1B4332] font-bold mb-3 block">الكمية</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  variant="outline"
                  className="w-10 h-10 rounded-full"
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <span className="text-2xl font-bold text-[#1B4332] w-12 text-center">{quantity}</span>
                <Button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  variant="outline"
                  className="w-10 h-10 rounded-full"
                >
                  <Plus className="w-5 h-5" />
                </Button>
                <span className="text-sm text-[#1B4332]/60 mr-auto">
                  السعر الأساسي: {(parseInt(item.price) * quantity).toLocaleString()} ل.س
                </span>
              </div>
            </div>

            {/* Wrapping Options */}
            <div>
              <Label className="text-[#1B4332] font-bold mb-3 block">اختر التغليف</Label>
              <div className="grid sm:grid-cols-3 gap-4">
                {wrappingOptions.map((wrap) => (
                  <motion.button
                    key={wrap.id}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedWrapping(wrap.id)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                      selectedWrapping === wrap.id
                        ? 'border-[#52B788] ring-4 ring-[#52B788]/20'
                        : 'border-[#F5E6D3] hover:border-[#1B4332]/30'
                    }`}
                  >
                    <img src={wrap.image} alt={wrap.name} className="w-full h-32 object-cover" />
                    <div className="p-3 bg-white">
                      <p className="font-semibold text-[#1B4332] text-sm">{wrap.name}</p>
                      <p className="text-xs text-[#52B788] font-bold">
                        {wrap.price === 0 ? 'مجاني' : `+${wrap.price.toLocaleString()} ل.س`}
                      </p>
                    </div>
                    {selectedWrapping === wrap.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-[#52B788] rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Additional Items */}
            <div>
              <Label className="text-[#1B4332] font-bold mb-3 block">إضافات اختيارية</Label>
              <div className="space-y-2">
                {additionalItems.map((addon) => (
                  <motion.div
                    key={addon.id}
                    whileHover={{ scale: 1.01 }}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedAddons.includes(addon.id)
                        ? 'border-[#52B788] bg-[#52B788]/5'
                        : 'border-[#F5E6D3] hover:border-[#1B4332]/20'
                    }`}
                    onClick={() => handleAddonToggle(addon.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedAddons.includes(addon.id)}
                        onCheckedChange={() => handleAddonToggle(addon.id)}
                      />
                      <span className="font-medium text-[#1B4332]">{addon.name}</span>
                    </div>
                    <span className="font-bold text-[#52B788]">+{addon.price.toLocaleString()} ل.س</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Custom Message */}
            <div>
              <Label htmlFor="customMessage" className="text-[#1B4332] font-bold mb-3 block">
                رسالة مخصصة على البطاقة (اختياري)
              </Label>
              <Textarea
                id="customMessage"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="اكتب رسالتك الخاصة هنا..."
                className="border-[#F5E6D3] focus:border-[#52B788] rounded-xl min-h-[100px]"
                maxLength={200}
              />
              <p className="text-xs text-[#1B4332]/50 mt-1">{customMessage.length}/200 حرف</p>
            </div>

            {/* Cash Gift Section */}
            {(itemType === 'package' || itemType === 'gift') && (
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-2xl p-5 border border-amber-200">
                    <div className="flex items-center gap-3 mb-4">
                        <Checkbox 
                            id="cashGift"
                            checked={addCashGift}
                            onCheckedChange={setAddCashGift}
                            className="data-[state=checked]:bg-amber-600 border-amber-600"
                        />
                        <div className="cursor-pointer" onClick={() => setAddCashGift(!addCashGift)}>
                            <Label htmlFor="cashGift" className="text-[#1B4332] font-bold text-lg cursor-pointer">
                                إضافة عيدية نقدية (اختياري) 🎊
                            </Label>
                            <p className="text-[#1B4332]/70 text-sm mt-1">
                                يمكنك إضافة عيدية مالية تُسلَّم للمستلم داخل ظرف خاص مع الطلب
                            </p>
                        </div>
                    </div>

                    <AnimatePresence>
                        {addCashGift && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-2 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-[#1B4332] font-semibold mb-2 block">المبلغ</Label>
                                            <Input 
                                                type="number" 
                                                value={cashGiftAmount}
                                                onChange={(e) => setCashGiftAmount(e.target.value)}
                                                placeholder="أدخل المبلغ"
                                                className="bg-white border-amber-200 focus:border-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#1B4332] font-semibold mb-2 block">العملة</Label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setCashGiftCurrency('SYP')}
                                                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                                                        cashGiftCurrency === 'SYP' 
                                                            ? 'bg-amber-600 text-white shadow-md' 
                                                            : 'bg-white text-[#1B4332] border border-amber-200 hover:bg-amber-50'
                                                    }`}
                                                >
                                                    ل.س
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCashGiftCurrency('USD')}
                                                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                                                        cashGiftCurrency === 'USD' 
                                                            ? 'bg-amber-600 text-white shadow-md' 
                                                            : 'bg-white text-[#1B4332] border border-amber-200 hover:bg-amber-50'
                                                    }`}
                                                >
                                                    $ USD
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white/50 p-3 rounded-lg text-sm text-[#1B4332]/80 flex items-start gap-2">
                                        <div className="mt-0.5">💌</div>
                                        <p>سيتم تسليم المبلغ ({cashGiftAmount || 0} {cashGiftCurrency}) داخل ظرف خاص مع الطلب، ويتم التعامل مع المبلغ بسرية واحترام كاملين.</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Total Summary */}
            <div className="bg-gradient-to-br from-[#52B788]/10 to-[#F5E6D3] rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-[#1B4332] text-lg mb-3">ملخص التكلفة</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#1B4332]/70">السعر الأساسي × {quantity}</span>
                  <span className="font-semibold text-[#1B4332]">{(parseInt(item.price) * quantity).toLocaleString()} ل.س</span>
                </div>
                {selectedWrapping !== 'standard' && (
                  <div className="flex justify-between">
                    <span className="text-[#1B4332]/70">
                      {wrappingOptions.find(w => w.id === selectedWrapping)?.name}
                    </span>
                    <span className="font-semibold text-[#52B788]">
                      +{(wrappingOptions.find(w => w.id === selectedWrapping)?.price || 0).toLocaleString()} ل.س
                    </span>
                  </div>
                )}
                {selectedAddons.map(addonId => {
                  const addon = additionalItems.find(a => a.id === addonId);
                  return (
                    <div key={addonId} className="flex justify-between">
                      <span className="text-[#1B4332]/70">{addon?.name}</span>
                      <span className="font-semibold text-[#52B788]">+{addon?.price.toLocaleString()} ل.س</span>
                    </div>
                  );
                })}
                {addCashGift && cashGiftAmount > 0 && (
                    <div className="flex justify-between bg-amber-50 p-2 rounded-lg border border-amber-100">
                      <span className="text-[#1B4332]/90 font-medium">💌 العيدية النقدية</span>
                      <span className="font-bold text-amber-700">
                          +{cashGiftCurrency === 'USD' 
                              ? `$${cashGiftAmount} (${(parseFloat(cashGiftAmount) * USD_TO_SYP).toLocaleString()} ل.س)` 
                              : `${parseInt(cashGiftAmount).toLocaleString()} ل.س`}
                      </span>
                    </div>
                )}
                <div className="h-px bg-[#1B4332]/20 my-2" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#1B4332] text-lg">المجموع الكلي:</span>
                  <span className="font-bold text-[#1B4332] text-2xl">{calculateTotal().toLocaleString()} ل.س</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 py-6 rounded-xl font-bold"
              >
                إلغاء
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                className="flex-1 bg-gradient-to-r from-[#52B788] to-[#40916C] hover:from-[#40916C] hover:to-[#2D6A4F] text-white py-6 rounded-xl font-bold text-lg"
              >
                تأكيد التخصيص
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}