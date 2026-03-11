import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AppFooter from '@/components/common/AppFooter';
import { useMutation } from '@tanstack/react-query';
import { fetchOrderById, createOrder, uploadFile } from '@/api/waselClient';

import { Send, Gift, UtensilsCrossed, Package, CheckCircle, Loader2, ArrowRight, MessageSquare, Calendar, Clock, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from '../components/cart/CartContext';

const orderTypes = [
  { id: 'gift', name: 'هدية', icon: Gift },
  { id: 'food', name: 'طعام', icon: UtensilsCrossed },
  { id: 'package', name: 'باقة', icon: Package }
];

const countries = [
  'الإمارات', 'السعودية', 'قطر', 'الكويت', 'البحرين', 'عمان',
  'ألمانيا', 'فرنسا', 'هولندا', 'السويد', 'النمسا', 'بلجيكا',
  'تركيا', 'لبنان', 'الأردن', 'مصر', 'أخرى'
];

export default function Order() {
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedType = urlParams.get('type') || 'gift';
  const preselectedItem = urlParams.get('item') || '';
  const fromCart = urlParams.get('from') === 'cart';
  const restaurantName = urlParams.get('restaurant') || '';
  
  const { cartItems, clearCart, getTotalPrice } = useCart();

  const [formData, setFormData] = useState({
    sender_name: '',
    sender_country: '',
    sender_whatsapp: '',
    order_type: preselectedType,
    package_type: fromCart ? `طلب من ${restaurantName}` : preselectedItem,
    package_details: '',
    preferred_delivery_date: '',
    preferred_delivery_time: '',
    recipient_name: '',
    recipient_area: '',
    recipient_phone: '',
    notes: fromCart ? generateCartNotes() : ''
  });



  function generateCartNotes() {
    if (!cartItems.length) return '';
    return cartItems.map(item => 
      `${item.name} (${item.quantity}x) - ${(item.total_price * item.quantity).toLocaleString()} ل.س`
    ).join('\n') + `\n\nالمجموع الكلي: ${getTotalPrice().toLocaleString()} ل.س`;
  }

  useEffect(() => {
    if (fromCart) {
      setFormData(prev => ({
        ...prev,
        notes: generateCartNotes()
      }));
    }
  }, [fromCart]);

  const [submitted, setSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);

  useEffect(() => {
    const fetchLoyalty = async () => {
       try {
          const user = await base44?.auth?.me?.();
          if (user) {
             const txs = await base44?.entities?.LoyaltyTransaction?.list?.({
                filter: { user_email: user.email }
             });
             const total = (Array.isArray(txs) ? txs : []).reduce((acc, tx) => acc + (tx?.points || 0), 0);
             setLoyaltyBalance(total);
          }
       } catch (e) {
          console.error('Failed to fetch loyalty:', e);
       }
    };
    fetchLoyalty();
  }, []);

  const createOrderMutation = useMutation({
    mutationFn: async (data) => {
      // Guest checkout allowed
      let currentUser = null;
      try {
        currentUser = await base44?.auth?.me?.();
      } catch (err) {
        // User not logged in, proceed as guest
        console.log('Proceeding as guest');
      }

      const orderNum = 'WS' + Date.now().toString().slice(-8);
      
      let costBreakdown = null;
      if (fromCart && Array.isArray(cartItems) && cartItems.length > 0) {
        const { getFinalTotalSYP, DELIVERY_FEE_SYP } = useCart();
        costBreakdown = {
          item_cost: getTotalPrice(),
          delivery_fee: DELIVERY_FEE_SYP,
          service_fee: 0,
          total: getFinalTotalSYP()
        };
      }

      const order = await base44?.entities?.Order?.create?.({
        ...data,
        order_number: orderNum,
        status: 'received',
        payment_status: 'pending',
        cost_breakdown: costBreakdown
      });

      try {
        if (currentUser) {
          await base44?.functions?.invoke?.('sendNotification', {
            type: 'new_order',
            orderNumber: orderNum,
            recipientEmail: currentUser?.email || '',
            recipientName: currentUser?.full_name || '',
            message: 'تم استلام طلبك بنجاح وجاري المراجعة. سنتواصل معك قريباً عبر واتساب لتأكيد التفاصيل.',
            additionalData: {
              trackUrl: typeof window !== 'undefined' ? `${window.location.origin}/TrackOrder?order=${orderNum}` : ''
            }
          });
        }
      } catch (err) {
        console.error('Failed to send notification:', err);
      }
      
      return { order, costBreakdown };
    },
    onSuccess: ({ order, costBreakdown }) => {
      setOrderNumber(order.order_number);
      if (fromCart) {
        clearCart();
      }
      setSubmitted(true);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = { ...formData };
    if (useLoyaltyPoints) {
       finalData.notes += `\n[Loyalty] Customer used points. Balance: ${loyaltyBalance}`;
    }
    createOrderMutation.mutate(finalData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 sm:p-12 max-w-lg w-full text-center shadow-xl"
        >
          <div className="w-20 h-20 bg-[#52B788]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[#52B788]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4332] mb-4">
            تم استلام طلبك بنجاح!
          </h2>
          <p className="text-[#1B4332]/70 mb-6">
            رقم الطلب: <span className="font-bold text-[#1B4332]">{orderNumber}</span>
          </p>
          <div className="bg-[#F5E6D3] rounded-xl p-4 mb-6">
            <p className="text-[#1B4332] text-sm">
              تم إرسال الطلب إلى فريق واصل. سنتواصل معك عبر واتساب لتأكيد السعر والدفع.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <a
              href={`https://wa.me/971502406519?text=${encodeURIComponent(`مرحباً، أريد الدفع للطلب رقم ${orderNumber}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white py-4 rounded-xl font-bold text-center hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              تواصل للدفع عبر واتساب
            </a>
            <div className="flex gap-3">
              <Link
                to={createPageUrl('TrackOrder') + `?order=${orderNumber}`}
                className="flex-1 bg-[#1B4332] text-white py-3 rounded-xl font-semibold hover:bg-[#2D6A4F] transition-colors text-center"
              >
                تتبع الطلب
              </Link>
              <Link
                to={createPageUrl('Home')}
                className="flex-1 bg-[#F5E6D3] text-[#1B4332] py-3 rounded-xl font-semibold hover:bg-[#F5E6D3]/80 transition-colors text-center"
              >
                العودة للرئيسية
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              أرسل طلبك
            </h1>
            <p className="text-white/70">
              املأ النموذج وسنتواصل معك لإتمام الطلب
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-8 -mt-6">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl"
        >
          {/* Order Type */}
          <div className="mb-8">
            <Label className="text-[#1B4332] font-semibold mb-3 block">نوع الطلب</Label>
            <div className="grid grid-cols-3 gap-3">
              {orderTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleChange('order_type', type.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      formData.order_type === type.id
                        ? 'border-[#1B4332] bg-[#1B4332] text-white'
                        : 'border-[#F5E6D3] bg-white text-[#1B4332] hover:border-[#1B4332]/30'
                    }`}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">{type.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {preselectedItem && !fromCart && (
            <div className="mb-6 bg-[#F5E6D3] rounded-xl p-4">
              <p className="text-[#1B4332] text-sm">
                <span className="font-semibold">الصنف المحدد:</span> {preselectedItem}
              </p>
            </div>
          )}

          {fromCart && cartItems.length > 0 && (
            <div className="mb-6 bg-[#F5E6D3] rounded-xl p-4">
              <p className="text-[#1B4332] text-sm font-semibold mb-2">طلبك من {restaurantName}:</p>
              <div className="space-y-1 text-sm text-[#1B4332]">
                {cartItems.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.name} (×{item.quantity})</span>
                    <span className="font-medium">{(item.total_price * item.quantity).toLocaleString()} ل.س</span>
                  </div>
                ))}
                <div className="h-px bg-[#1B4332]/20 my-2" />
                <div className="flex justify-between font-bold">
                  <span>المجموع:</span>
                  <span>{getTotalPrice().toLocaleString()} ل.س</span>
                </div>
              </div>
            </div>
          )}



          {/* Sender Info */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-[#1B4332] mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#1B4332] text-white rounded-lg flex items-center justify-center text-sm">1</span>
              بيانات المرسل
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sender_name" className="text-[#1B4332]/70 text-sm">اسمك الكامل *</Label>
                <Input
                  id="sender_name"
                  value={formData.sender_name}
                  onChange={(e) => handleChange('sender_name', e.target.value)}
                  required
                  className="mt-1 border-[#F5E6D3] focus:border-[#1B4332] rounded-xl"
                  placeholder="أدخل اسمك"
                />
              </div>
              <div>
                <Label htmlFor="sender_country" className="text-[#1B4332]/70 text-sm">الدولة *</Label>
                <Select value={formData.sender_country} onValueChange={(val) => handleChange('sender_country', val)}>
                  <SelectTrigger className="mt-1 border-[#F5E6D3] focus:border-[#1B4332] rounded-xl">
                    <SelectValue placeholder="اختر دولتك" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sender_whatsapp" className="text-[#1B4332]/70 text-sm">رقم واتساب (مع رمز الدولة) *</Label>
                <Input
                  id="sender_whatsapp"
                  type="tel"
                  value={formData.sender_whatsapp}
                  onChange={(e) => handleChange('sender_whatsapp', e.target.value)}
                  required
                  className="mt-1 border-[#F5E6D3] focus:border-[#1B4332] rounded-xl"
                  placeholder="+971xxxxxxxxx"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Loyalty Points */}
          {loyaltyBalance > 0 && (
             <div className="mb-8 bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-2xl border border-amber-100">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                      <Star className="w-5 h-5 fill-current" />
                   </div>
                   <div>
                      <h3 className="font-bold text-gray-900">نقاط الولاء</h3>
                      <p className="text-sm text-gray-600">
                         رصيدك الحالي: <span className="font-bold text-amber-600">{loyaltyBalance}</span> نقطة
                      </p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <input 
                      type="checkbox" 
                      id="useLoyalty"
                      checked={useLoyaltyPoints}
                      onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                      className="w-5 h-5 text-[#1B4332] rounded focus:ring-[#1B4332] cursor-pointer"
                   />
                   <label htmlFor="useLoyalty" className="text-sm font-medium text-gray-800 cursor-pointer select-none">
                      استخدام النقاط للحصول على خصم
                   </label>
                </div>
             </div>
          )}

          {/* Delivery Preferences */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-[#1B4332] mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center text-sm">📅</span>
              وقت التسليم المفضل
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preferred_delivery_date" className="text-[#1B4332]/70 text-sm">
                  التاريخ المفضل (اختياري)
                </Label>
                <div className="relative mt-1">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1B4332]/40 pointer-events-none" />
                  <Input
                    id="preferred_delivery_date"
                    type="date"
                    value={formData.preferred_delivery_date}
                    onChange={(e) => handleChange('preferred_delivery_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="pr-10 border-[#F5E6D3] focus:border-[#1B4332] rounded-xl"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="preferred_delivery_time" className="text-[#1B4332]/70 text-sm">
                  الوقت المفضل (اختياري)
                </Label>
                <div className="relative mt-1">
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1B4332]/40 pointer-events-none" />
                  <Input
                    id="preferred_delivery_time"
                    type="time"
                    value={formData.preferred_delivery_time}
                    onChange={(e) => handleChange('preferred_delivery_time', e.target.value)}
                    className="pr-10 border-[#F5E6D3] focus:border-[#1B4332] rounded-xl"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-[#1B4332]/50 mt-2">
              * سنحاول التوصيل في الوقت المطلوب، وسنتواصل معك للتأكيد
            </p>
          </div>

          {/* Recipient Info */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-[#1B4332] mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#52B788] text-white rounded-lg flex items-center justify-center text-sm">2</span>
              بيانات المستلم
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipient_name" className="text-[#1B4332]/70 text-sm">اسم المستلم *</Label>
                <Input
                  id="recipient_name"
                  value={formData.recipient_name}
                  onChange={(e) => handleChange('recipient_name', e.target.value)}
                  required
                  className="mt-1 border-[#F5E6D3] focus:border-[#1B4332] rounded-xl"
                  placeholder="اسم الشخص المستلم"
                />
              </div>
              <div>
                <Label htmlFor="recipient_area" className="text-[#1B4332]/70 text-sm">عنوان دقيق للبيت *</Label>
                <Textarea
                  id="recipient_area"
                  value={formData.recipient_area}
                  onChange={(e) => handleChange('recipient_area', e.target.value)}
                  required
                  className="mt-1 border-[#F5E6D3] focus:border-[#1B4332] rounded-xl min-h-[80px]"
                  placeholder="مثال: درعا البلد - حي المطار - شارع الجامع - بناء السلام - الطابق الثالث"
                />
              </div>
              <div>
                <Label htmlFor="recipient_phone" className="text-[#1B4332]/70 text-sm">رقم هاتف المستلم *</Label>
                <Input
                  id="recipient_phone"
                  type="tel"
                  value={formData.recipient_phone}
                  onChange={(e) => handleChange('recipient_phone', e.target.value)}
                  required
                  className="mt-1 border-[#F5E6D3] focus:border-[#1B4332] rounded-xl"
                  placeholder="رقم الهاتف في سوريا"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-8">
            <Label htmlFor="notes" className="text-[#1B4332]/70 text-sm">ملاحظات إضافية (اختياري)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="mt-1 border-[#F5E6D3] focus:border-[#1B4332] rounded-xl min-h-[100px]"
              placeholder="أي تفاصيل إضافية تريد إخبارنا بها..."
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={createOrderMutation.isPending}
            className="w-full bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-300"
          >
            {createOrderMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                إرسال الطلب
                <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
              </>
            )}
          </Button>

          <p className="text-center text-[#1B4332]/50 text-sm mt-4">
            سيتم التواصل معك عبر واتساب لتأكيد الطلب والدفع
          </p>
        </motion.form>
      </section>
      <AppFooter />
    </div>
  );
}