import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, User, MapPin, Phone, Calendar, DollarSign, Package, Bell, Volume2, VolumeX, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const statusColors = {
  received: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  processing: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  delivered: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' }
};

const statusLabels = {
  received: 'تم الاستلام',
  processing: 'قيد التنفيذ',
  delivered: 'تم التوصيل'
};

export default function RestaurantOrders({ restaurantId, restaurantName }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [notificationSettings, setNotificationSettings] = useState(() => {
    const saved = localStorage.getItem('wasel_admin_notifications');
    return saved ? JSON.parse(saved) : {
      soundEnabled: true,
      newOrderAlert: true,
      statusChangeAlert: true,
      soundType: 'default' 
    };
  });

  const prevOrdersRef = useRef([]);
  const isFirstLoadRef = useRef(true);

  // Save settings
  useEffect(() => {
    localStorage.setItem('wasel_admin_notifications', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  const playNotificationSound = () => {
    if (!notificationSettings.soundEnabled) return;
    
    // Simple beep sound (data URI to avoid external dependencies)
    const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3');
    audio.play().catch(e => console.log('Audio play failed', e));
  };

  const { data: orders, isLoading } = useQuery({
    queryKey: ['restaurantOrders', restaurantId],
    queryFn: async () => {
      const allOrders = await base44.entities.Order.filter({ order_type: 'food' });
      return allOrders.filter(order => {
        const restaurantMatch = `طلب من ${restaurantName}`;
        return order.notes?.includes(restaurantMatch) || order.package_type?.includes(restaurantMatch);
      });
    },
    enabled: !!restaurantId && !!restaurantName,
    refetchInterval: 5000, // Check every 5 seconds for instant updates
  });

  // Notification Logic
  useEffect(() => {
    if (isLoading || !orders) return;

    if (isFirstLoadRef.current) {
      prevOrdersRef.current = orders;
      isFirstLoadRef.current = false;
      return;
    }

    const prevOrders = prevOrdersRef.current;
    
    // Check for new orders
    const newOrders = orders.filter(o => !prevOrders.find(po => po.id === o.id));
    
    // Check for status changes
    const statusChanges = orders.filter(o => {
      const prev = prevOrders.find(po => po.id === o.id);
      return prev && prev.status !== o.status;
    });

    if (newOrders.length > 0 && notificationSettings.newOrderAlert) {
      playNotificationSound();
      newOrders.forEach(order => {
        toast.success(`طلب جديد #${order.order_number}`, {
          description: `${order.sender_name} - ${order.package_type}`,
          duration: 5000,
          action: {
            label: 'عرض',
            onClick: () => setStatusFilter('all')
          }
        });
      });
    }

    if (statusChanges.length > 0 && notificationSettings.statusChangeAlert) {
      playNotificationSound();
      statusChanges.forEach(order => {
        toast.info(`تحديث حالة الطلب #${order.order_number}`, {
          description: `تغيرت الحالة إلى: ${statusLabels[order.status]}`,
          duration: 4000
        });
      });
    }

    prevOrdersRef.current = orders;
  }, [orders, isLoading, notificationSettings]);

  const filteredOrders = orders?.filter(order => 
    statusFilter === 'all' || order.status === statusFilter
  ) || [];

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#1B4332]/60">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1B4332]">الطلبات الواردة</h2>
          <p className="text-[#1B4332]/60 text-sm">إجمالي الطلبات: {filteredOrders.length}</p>
        </div>

        {/* Notification Settings */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              {notificationSettings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#1B4332]" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-400" />
              )}
              <Settings className="w-4 h-4 text-[#1B4332]" />
              إعدادات التنبيهات
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]" dir="rtl">
            <DialogHeader>
              <DialogTitle>إعدادات الإشعارات</DialogTitle>
              <DialogDescription>
                تخصيص طريقة تنبيهك عند وصول طلبات جديدة أو تحديثات.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-between space-x-2 space-x-reverse bg-gray-50 p-3 rounded-lg">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="sound" className="font-semibold">الأصوات</Label>
                  <span className="text-xs text-gray-500">تشغيل صوت عند التنبيه</span>
                </div>
                <Switch
                  id="sound"
                  checked={notificationSettings.soundEnabled}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, soundEnabled: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2 space-x-reverse bg-gray-50 p-3 rounded-lg">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="new-order" className="font-semibold">طلبات جديدة</Label>
                  <span className="text-xs text-gray-500">تنبيه عند وصول طلب جديد</span>
                </div>
                <Switch
                  id="new-order"
                  checked={notificationSettings.newOrderAlert}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, newOrderAlert: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between space-x-2 space-x-reverse bg-gray-50 p-3 rounded-lg">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="status-change" className="font-semibold">تغيير الحالة</Label>
                  <span className="text-xs text-gray-500">تنبيه عند تغير حالة طلب</span>
                </div>
                <Switch
                  id="status-change"
                  checked={notificationSettings.statusChangeAlert}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, statusChangeAlert: checked }))
                  }
                />
              </div>
              
              <div className="pt-2">
                <Button 
                  variant="secondary" 
                  className="w-full gap-2"
                  onClick={() => {
                    playNotificationSound();
                    toast.success("تجربة التنبيه", { description: "هذا مثال على شكل التنبيه" });
                  }}
                >
                  <Bell className="w-4 h-4" />
                  تجربة التنبيهات
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Filter */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="all">الكل ({orders?.length || 0})</TabsTrigger>
          <TabsTrigger value="received">جديدة ({orders?.filter(o => o.status === 'received').length || 0})</TabsTrigger>
          <TabsTrigger value="processing">قيد التنفيذ ({orders?.filter(o => o.status === 'processing').length || 0})</TabsTrigger>
          <TabsTrigger value="delivered">مكتملة ({orders?.filter(o => o.status === 'delivered').length || 0})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#F5E6D3]">
          <ShoppingBag className="w-16 h-16 text-[#F5E6D3] mx-auto mb-4" />
          <p className="text-[#1B4332]/60">لا توجد طلبات</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const statusStyle = statusColors[order.status] || statusColors.received;
            
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 border border-[#F5E6D3] hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-[#F5E6D3]">
                  <div>
                    <h3 className="font-bold text-[#1B4332] text-lg mb-1">
                      طلب رقم: {order.order_number}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-[#1B4332]/60">
                      <Calendar className="w-4 h-4" />
                      {new Date(order.created_date).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
                    {statusLabels[order.status]}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-[#52B788] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#1B4332]/60 mb-1">المرسل</p>
                      <p className="font-semibold text-[#1B4332]">{order.sender_name}</p>
                      <p className="text-sm text-[#1B4332]/60">{order.sender_whatsapp}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#52B788] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#1B4332]/60 mb-1">المستلم</p>
                      <p className="font-semibold text-[#1B4332]">{order.recipient_name}</p>
                      <p className="text-sm text-[#1B4332]/60">{order.recipient_area}</p>
                      <p className="text-sm text-[#1B4332]/60">{order.recipient_phone}</p>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                {order.notes && (
                  <div className="bg-[#F5E6D3]/50 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-[#1B4332] mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-[#1B4332]/60 mb-2">تفاصيل الطلب:</p>
                        <div className="text-sm text-[#1B4332] whitespace-pre-line">
                          {order.notes}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cost Breakdown */}
                {order.cost_breakdown && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-blue-600 mb-2 font-semibold">التكلفة:</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-700">الأصناف:</span>
                            <span className="font-semibold text-blue-900">{order.cost_breakdown.item_cost?.toLocaleString()} ل.س</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">التوصيل:</span>
                            <span className="font-semibold text-blue-900">{order.cost_breakdown.delivery_fee?.toLocaleString()} ل.س</span>
                          </div>
                          <div className="h-px bg-blue-200 my-2" />
                          <div className="flex justify-between">
                            <span className="font-bold text-blue-900">الإجمالي:</span>
                            <span className="font-bold text-blue-900 text-lg">{order.cost_breakdown.total?.toLocaleString()} ل.س</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Status */}
                <div className="mt-4 pt-4 border-t border-[#F5E6D3]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#1B4332]/60">حالة الدفع:</span>
                    <span className={`font-semibold ${
                      order.payment_status === 'paid' ? 'text-green-600' :
                      order.payment_status === 'failed' ? 'text-red-600' :
                      'text-amber-600'
                    }`}>
                      {order.payment_status === 'paid' ? '✓ تم الدفع' :
                       order.payment_status === 'failed' ? '✗ فشل الدفع' :
                       '⏳ قيد الانتظار'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}