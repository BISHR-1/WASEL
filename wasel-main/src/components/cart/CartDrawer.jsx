import React, { useState, useEffect } from 'react';
import { useCart } from './CartContext';
import { X, Plus, Minus, ShoppingBag, Trash2, CreditCard, MessageCircle, Edit3, Calendar, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from 'framer-motion';
import { base44, createBase44Entity } from '@/api/base44Client';
import { createPayPalPayment } from '@/api/paypalClient';
import { createPageUrl } from '../../utils';
import { Link } from 'react-router-dom';

export default function CartDrawer({ isOpen = false, onClose = () => {} }) {
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loadingSavedData, setLoadingSavedData] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [orderDetails, setOrderDetails] = useState({
    sender_name: '',
    sender_country: '',
    sender_whatsapp: '',
    recipient_name: '',
    recipient_address: '',
    recipient_phone: '',
    preferred_delivery_date: '',
    preferred_delivery_time: '',
    notes: ''
  });

  const countries = [
    'الإمارات', 'السعودية', 'قطر', 'الكويت', 'البحرين', 'عمان',
    'ألمانيا', 'فرنسا', 'هولندا', 'السويد', 'النمسا', 'بلجيكا',
    'تركيا', 'لبنان', 'الأردن', 'مصر', 'أخرى'
  ];

  const { 
    cartItems = [], 
    updateQuantity = () => {}, 
    removeFromCart = () => {}, 
    clearCart = () => {},
    getTotalPrice = () => 0,
    getFinalTotalSYP = () => 0,
    getFinalTotalUSD = () => 0,
    DELIVERY_FEE_USD = 6
  } = useCart?.() || {};

  // Load saved order details
  useEffect(() => {
    const loadSavedData = async () => {
      if (!isOpen) return;
      setLoadingSavedData(true);
      try {
        if (base44?.auth?.me) {
          const user = await base44.auth.me();
          if (user?.saved_order_details) {
            setOrderDetails(prev => ({ ...prev, ...(user.saved_order_details || {}) }));
            setHasSavedData(true);
            setDetailsSaved(true);
          }
        }
      } catch (err) {
        console.error('Error loading saved data:', err?.message || err);
      } finally {
        setLoadingSavedData(false);
      }
    };
    loadSavedData();
  }, [isOpen]);

  const handleSaveDetails = async () => {
    if (!orderDetails?.sender_name || !orderDetails?.sender_country || !orderDetails?.sender_whatsapp || 
        !orderDetails?.recipient_name || !orderDetails?.recipient_address || !orderDetails?.recipient_phone) return;

    try {
      if (base44?.auth?.updateMe) {
        await base44.auth.updateMe({
          saved_order_details: {
            sender_name: orderDetails.sender_name || '',
            sender_country: orderDetails.sender_country || '',
            sender_whatsapp: orderDetails.sender_whatsapp || '',
            recipient_name: orderDetails.recipient_name || '',
            recipient_address: orderDetails.recipient_address || '',
            recipient_phone: orderDetails.recipient_phone || ''
          }
        });
        setHasSavedData(true);
        setDetailsSaved(true);
        setShowDetailsForm(false);
      }
    } catch (err) {
      console.error('Error saving details:', err?.message || err);
    }
  };

  const handleCheckout = async () => {
    if (!detailsSaved || !acceptedTerms) return;

    setProcessing(true);
    try {
      const orderNum = 'PP' + Date.now().toString().slice(-8);

      const order = await createBase44Entity('Order', {
        order_number: orderNum,
        sender_name: orderDetails.sender_name,
        sender_country: orderDetails.sender_country,
        sender_whatsapp: orderDetails.sender_whatsapp,
        order_type: 'mixed',
        package_type: 'طلب عبر منصة واصل',
        preferred_delivery_date: orderDetails.preferred_delivery_date,
        preferred_delivery_time: orderDetails.preferred_delivery_time,
        recipient_name: orderDetails.recipient_name,
        recipient_area: orderDetails.recipient_address,
        recipient_phone: orderDetails.recipient_phone,
        notes: orderDetails.notes + '\n\n' + cartItems.map(item => {
          const price = item.customer_price || Math.round((item.base_price || 0) * 1.1);
          return `${item.name || 'منتج'} (×${item.quantity || 1}) - ${(price * (item.quantity || 1)).toLocaleString()} ل.س`;
        }).join('\n'),
        status: 'received',
        payment_status: 'pending',
        payment_method: 'paypal',
        cost_breakdown: {
          item_cost: getTotalPrice(),
          delivery_fee: 0,
          service_fee: 0,
          total: getFinalTotalSYP()
        },
        items: cartItems.map(item => ({
          name: item.name || 'منتج',
          price: item.customer_price || Math.round((item.base_price || 0) * 1.1),
          quantity: item.quantity || 1,
          image_url: item.image_url || '',
          item_type: item.item_type || 'other'
        }))
      });

      // PayPal Payment Flow
      const origin = window?.location?.origin || '';
      const response = await createPayPalPayment({
        orderId: orderNum,
        amount: getFinalTotalUSD(),
        currency: 'USD',
        orderDescription: 'Order from Wasel platform',
        return_url: `${origin}/PaymentSuccess?order=${orderNum}`,
        cancel_url: `${origin}/Payment?order=${orderNum}&canceled=true`,
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.customer_price || Math.round((item.base_price || 0) * 1.1)
        }))
      });

      if (response?.success && response?.approveUrl) {
        clearCart();
        window.location.href = response.approveUrl;
      } else {
        throw new Error(response?.error || 'Failed to create PayPal payment');
      }

    } catch (err) {
      console.error('Checkout Error:', err);
      alert('حدث خطأ أثناء الدفع: ' + (err.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-50"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed left-0 top-0 h-[100dvh] w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        {/* ... نفس الهيدر ... */}

        {/* Items + Form + Summary */}
        {/* ... نفس الهيكل كما هو ... */}

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t-2 border-[#F5E6D3] bg-white absolute bottom-0 left-0 right-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          {/* Payment Method + Terms + Checkout */}
          <Button
            onClick={handleCheckout}
            disabled={processing || !acceptedTerms}
            className={`w-full text-white py-5 sm:py-6 rounded-2xl font-bold shadow-lg ${
              paymentMethod === 'online'
              ? 'bg-gradient-to-r from-[#635BFF] to-[#00D4FF]'
              : 'bg-gradient-to-r from-[#25D366] to-[#20BA5A]'
            }`}
          >
            {processing ? 'جاري التحضير...' : 'ادفع عبر PayPal'}
          </Button>
        </div>
      </motion.div>
    </>
  );
}
