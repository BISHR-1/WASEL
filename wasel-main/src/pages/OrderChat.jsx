import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '@/api/waselClient';
import AppFooter from '@/components/common/AppFooter';

import { ArrowRight, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import OrderChat from '../components/chat/OrderChat';

export default function OrderChatPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order');
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44?.auth?.me?.();
        setUser(currentUser);
      } catch (err) {
        // لا نجبر المستخدم على تسجيل الدخول إذا كان زائراً
        // سنستخدم اسم "ضيف" أو نطلب الاسم في الشات إذا لم يكن مسجلاً
        setUser({ full_name: 'ضيف', id: 'guest' });
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const { data: orders = [] } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      try {
        const result = await base44?.entities?.Order?.filter?.({ id: orderId });
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Failed to fetch order:', error);
        return [];
      }
    },
    enabled: !!orderId && !!user
  });

  const order = Array.isArray(orders) && orders.length > 0 ? orders[0] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!orderId || !order) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="text-center">
          <Package className="w-16 h-16 text-[#F5E6D3] mx-auto mb-4" />
          <p className="text-[#1B4332]/60 mb-4">لم يتم العثور على الطلب</p>
          <Link
            to={createPageUrl('Home')}
            className="text-[#52B788] hover:underline"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Link
            to={createPageUrl('MyOrders')}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            العودة لطلباتي
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              محادثة الطلب
            </h1>
            <p className="text-white/70">
              {order.order_number} - {order.recipient_name}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Chat */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="h-[600px]">
          <OrderChat
            orderId={order.id}
            orderNumber={order.order_number}
            senderType="customer"
            senderName={user.full_name}
          />
        </div>
      </section>
      <AppFooter />
    </div>
  );
}