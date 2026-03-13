import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchOrders, updateOrder } from '@/api/waselClient';
import { supabase } from '@/lib/supabase';
import { Package, Search, Upload, DollarSign, User as UserIcon, Phone, MapPin, Calendar, MessageSquare, Share2, Mail, Copy, Image as ImageIcon, Edit, Save, X, CheckCircle2, Star, Store, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import PasswordProtection from '../components/common/PasswordProtection';

const statusOptions = [
  { value: 'received', label: 'تم الاستلام', color: 'bg-blue-100 text-blue-700' },
  { value: 'processing', label: 'قيد التنفيذ', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'delivered', label: 'تم التوصيل', color: 'bg-green-100 text-green-700' }
];

export default function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingOrder, setEditingOrder] = useState(null);
  const [showCostDialog, setShowCostDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const queryClient = useQueryClient();

  const [costData, setCostData] = useState({
    item_cost: 0,
    delivery_fee: 5000,
    service_fee: 0,
    total: 0
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
    initialData: []
  });

  const { data: allReviews } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => base44.entities.Review.list('-created_date'),
    initialData: []
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['execution-orders'] });
      setEditingOrder(null);
      setShowCostDialog(false);
    }
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.Order.update(id, { 
      payment_status: 'paid',
      payment_date: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['execution-orders'] });
    }
  });

  const handlePhotoUpload = async (orderId, file) => {
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateOrderMutation.mutateAsync({
        id: orderId,
        data: { delivery_photo: file_url }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdateCosts = () => {
    const total = costData.item_cost + costData.delivery_fee + costData.service_fee;
    updateOrderMutation.mutate({
      id: selectedOrder.id,
      data: {
        cost_breakdown: { ...costData, total }
      }
    });
  };

  const openCostDialog = (order) => {
    setSelectedOrder(order);
    if (order.cost_breakdown) {
      setCostData(order.cost_breakdown);
    } else {
      setCostData({
        item_cost: 0,
        delivery_fee: 5000,
        service_fee: 0,
        total: 0
      });
    }
    setShowCostDialog(true);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery || 
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.sender_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleWhatsAppContact = (phone) => {
    window.open(`https://wa.me/${phone.replace(/\+/g, '')}`, '_blank');
  };

  const formatOrderForExport = (order) => {
    const orderType = order.order_type === 'gift' ? 'هدية' : order.order_type === 'food' ? 'طعام' : 'باقة';
    const status = order.status === 'received' ? 'تم الاستلام' : order.status === 'processing' ? 'قيد التنفيذ' : 'تم التوصيل';
    
    let costInfo = '';
    if (order.cost_breakdown) {
      const cb = order.cost_breakdown;
      costInfo = `

💰 *تفصيل التكلفة:*
تكلفة الصنف: ${cb.item_cost?.toLocaleString() || 0} ل.س
رسوم التوصيل: ${cb.delivery_fee?.toLocaleString() || 0} ل.س
عمولة المنصة: ${cb.service_fee?.toLocaleString() || 0} ل.س
المجموع: ${cb.total?.toLocaleString() || 0} ل.س`;
    }
    
    return `🎁 *طلب جديد من واصل ستور*

📋 *رقم الطلب:* ${order.order_number}
📅 *التاريخ:* ${new Date(order.created_date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
📊 *الحالة:* ${status}
📦 *نوع الطلب:* ${orderType}${order.package_type ? ` - ${order.package_type}` : ''}

👤 *معلومات المرسل:*
الاسم: ${order.sender_name}
الدولة: ${order.sender_country}
واتساب: ${order.sender_whatsapp}

📍 *معلومات المستلم:*
الاسم: ${order.recipient_name}
المنطقة: ${order.recipient_area}
الهاتف: ${order.recipient_phone}${order.notes ? `

💬 *ملاحظات:*
${order.notes}` : ''}${order.execution_notes ? `

📝 *ملاحظات التنفيذ:*
${order.execution_notes}` : ''}${costInfo}

💳 *حالة الدفع:* ${order.payment_status === 'paid' ? '✅ مدفوع' : order.payment_status === 'failed' ? '❌ فشل' : '⏳ بانتظار الدفع'}${order.assigned_to ? `
👷 *المنفذ:* ${order.assigned_to}` : ''}`;
  };

  const handleExportToWhatsApp = (order) => {
    const text = formatOrderForExport(order);
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleExportToEmail = (order) => {
    const text = formatOrderForExport(order);
    const subject = `طلب واصل ستور ${order.order_number}`;
    const body = text.replace(/\*/g, '');
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleCopyOrder = (order) => {
    const text = formatOrderForExport(order);
    navigator.clipboard.writeText(text);
  };

  return (
    <PasswordProtection>
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">لوحة التحكم</h1>
                <p className="text-white/70">إدارة ومتابعة الطلبات</p>
              </div>
            </div>
            <Link to={createPageUrl('RestaurantDashboard')}>
              <Button className="bg-white/10 hover:bg-white/20 text-white border-white/30 gap-2">
                <Store className="w-4 h-4" />
                لوحة المطعم
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1B4332]/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث برقم الطلب، اسم المرسل، أو المستلم..."
                className="pr-10 bg-white border-0 rounded-xl"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-white border-0 rounded-xl">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Orders List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#1B4332]/60">جاري التحميل...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <Package className="w-16 h-16 text-[#1B4332]/20 mx-auto mb-4" />
            <p className="text-[#1B4332]/60">لا توجد طلبات</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              const orderType = order.order_type === 'gift' ? 'هدية' : order.order_type === 'food' ? 'طعام' : 'باقة';
              const statusData = statusOptions.find(s => s.value === order.status) || statusOptions[0];
              const isEditing = editingOrder?.id === order.id;
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-[#F5E6D3] hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-[#1B4332]">{order.order_number}</h3>
                        <Badge className={statusData.color}>{statusData.label}</Badge>
                      </div>
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
                      
                      {/* Review Badge */}
                      {(() => {
                        const orderReview = allReviews?.find(r => r.order_id === order.id);
                        return orderReview && (
                          <div className="mt-2 flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= orderReview.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            {orderReview.comment && (
                              <span className="text-xs text-[#1B4332]/70 mr-2">"{orderReview.comment}"</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    
                    <div className="flex gap-2">
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderMutation.mutate({ id: order.id, data: { status: value } })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {!isEditing && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingOrder({ ...order })}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Sender */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-[#1B4332] flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-[#52B788]" />
                        معلومات المرسل
                      </h4>
                      <div className="space-y-2 pr-7">
                        <p className="text-sm"><span className="text-[#1B4332]/60">الاسم:</span> <span className="font-medium text-[#1B4332]">{order.sender_name}</span></p>
                        <p className="text-sm"><span className="text-[#1B4332]/60">الدولة:</span> <span className="font-medium text-[#1B4332]">{order.sender_country}</span></p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm"><span className="text-[#1B4332]/60">واتساب:</span> <span className="font-medium text-[#1B4332]" dir="ltr">{order.sender_whatsapp}</span></p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWhatsAppContact(order.sender_whatsapp)}
                            className="h-7 px-2"
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Recipient */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-[#1B4332] flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#52B788]" />
                        معلومات المستلم
                      </h4>
                      <div className="space-y-2 pr-7">
                        <p className="text-sm"><span className="text-[#1B4332]/60">الاسم:</span> <span className="font-medium text-[#1B4332]">{order.recipient_name}</span></p>
                        <p className="text-sm"><span className="text-[#1B4332]/60">المنطقة:</span> <span className="font-medium text-[#1B4332]">{order.recipient_area}</span></p>
                        <p className="text-sm"><span className="text-[#1B4332]/60">الهاتف:</span> <span className="font-medium text-[#1B4332]" dir="ltr">{order.recipient_phone}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Editing Form */}
                  {isEditing && (
                    <div className="mt-6 p-4 bg-[#F5E6D3]/30 rounded-xl space-y-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm">المنفذ</Label>
                          <Input
                            value={editingOrder.assigned_to || ''}
                            onChange={(e) => setEditingOrder({ ...editingOrder, assigned_to: e.target.value })}
                            placeholder="اسم المنفذ"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">ملاحظة التوصيل</Label>
                          <Input
                            value={editingOrder.delivery_note || ''}
                            onChange={(e) => setEditingOrder({ ...editingOrder, delivery_note: e.target.value })}
                            placeholder="ملاحظة عند التوصيل"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">ملاحظات التنفيذ (داخلية)</Label>
                        <Textarea
                          value={editingOrder.execution_notes || ''}
                          onChange={(e) => setEditingOrder({ ...editingOrder, execution_notes: e.target.value })}
                          placeholder="ملاحظات للفريق..."
                          className="min-h-[60px]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateOrderMutation.mutate({ id: order.id, data: editingOrder })}
                          className="bg-[#52B788]"
                        >
                          <Save className="w-4 h-4 ml-2" />
                          حفظ
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingOrder(null)}
                        >
                          <X className="w-4 h-4 ml-2" />
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Order Details */}
                  <div className="mt-6 pt-6 border-t border-[#F5E6D3]">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-[#52B788]" />
                          <span className="text-sm text-[#1B4332]/60">النوع:</span>
                          <span className="text-sm font-medium text-[#1B4332]">{orderType}</span>
                        </div>
                        {order.package_type && (
                          <>
                            <span className="text-[#1B4332]/30">|</span>
                            <span className="text-sm font-medium text-[#1B4332]">{order.package_type}</span>
                          </>
                        )}
                        {order.assigned_to && (
                          <>
                            <span className="text-[#1B4332]/30">|</span>
                            <span className="text-sm text-[#1B4332]/60">المنفذ: <strong>{order.assigned_to}</strong></span>
                          </>
                        )}
                      </div>
                      
                      {/* Payment Confirmation & Invoice */}
                      <div className="flex gap-2">
                        {order.payment_status !== 'paid' ? (
                          <Button
                            size="sm"
                            onClick={() => confirmPaymentMutation.mutate({ id: order.id })}
                            disabled={confirmPaymentMutation.isPending}
                            className="bg-[#52B788] hover:bg-[#40916C] gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            تأكيد الدفع
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                toast.promise(
                                  base44.functions.invoke('sendInvoice', { orderId: order.id }),
                                  {
                                    loading: 'جاري إرسال الفاتورة...',
                                    success: 'تم إرسال الفاتورة بنجاح',
                                    error: 'فشل إرسال الفاتورة'
                                  }
                                );
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="gap-2 text-[#1B4332] border-[#1B4332]"
                          >
                            <FileText className="w-4 h-4" />
                            إرسال الفاتورة
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    {order.cost_breakdown && (
                      <div className="mb-4 bg-[#F5E6D3] rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-[#1B4332]">💰 تفصيل التكلفة</span>
                          <Button size="sm" variant="ghost" onClick={() => openCostDialog(order)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between"><span>تكلفة الصنف:</span><span>{order.cost_breakdown.item_cost?.toLocaleString() || 0} ل.س</span></div>
                          <div className="flex justify-between"><span>رسوم التوصيل:</span><span>{order.cost_breakdown.delivery_fee?.toLocaleString() || 0} ل.س</span></div>
                          <div className="flex justify-between"><span>عمولة المنصة:</span><span>{order.cost_breakdown.service_fee?.toLocaleString() || 0} ل.س</span></div>
                          <div className="h-px bg-[#1B4332]/20 my-1" />
                          <div className="flex justify-between font-bold"><span>المجموع:</span><span>{order.cost_breakdown.total?.toLocaleString() || 0} ل.س</span></div>
                        </div>
                      </div>
                    )}

                    {!order.cost_breakdown && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openCostDialog(order)}
                        className="mb-4"
                      >
                        <DollarSign className="w-4 h-4 ml-2" />
                        إضافة التكلفة
                      </Button>
                    )}

                    {/* Delivery Photo */}
                    {order.delivery_photo ? (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-[#1B4332] mb-2">📸 صورة التوثيق:</p>
                        <img src={order.delivery_photo} alt="توثيق" className="rounded-xl max-h-48 object-cover" />
                        {order.delivery_note && (
                          <p className="text-sm text-[#1B4332]/70 mt-2">{order.delivery_note}</p>
                        )}
                      </div>
                    ) : (
                      <div className="mb-4">
                        <Label htmlFor={`photo-${order.id}`} className="cursor-pointer">
                          <div className="border-2 border-dashed border-[#1B4332]/30 rounded-xl p-4 text-center hover:border-[#52B788] transition-colors">
                            {uploadingPhoto ? (
                              <div className="text-[#1B4332]/60">جاري الرفع...</div>
                            ) : (
                              <>
                                <Upload className="w-6 h-6 text-[#1B4332]/60 mx-auto mb-2" />
                                <p className="text-sm text-[#1B4332]/60">رفع صورة التوثيق</p>
                              </>
                            )}
                          </div>
                        </Label>
                        <input
                          id={`photo-${order.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handlePhotoUpload(order.id, e.target.files[0]);
                            }
                          }}
                        />
                      </div>
                    )}
                    
                    {order.notes && (
                      <div className="mt-4 bg-blue-50 rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-blue-600 font-semibold mb-1">ملاحظات العميل:</p>
                            <p className="text-sm text-[#1B4332]">{order.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {order.execution_notes && (
                      <div className="mt-4 bg-amber-50 rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-amber-600 font-semibold mb-1">ملاحظات داخلية:</p>
                            <p className="text-sm text-[#1B4332]">{order.execution_notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Export Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportToWhatsApp(order)}
                        className="gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        واتساب
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportToEmail(order)}
                        className="gap-2"
                      >
                        <Mail className="w-4 h-4" />
                        إيميل
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyOrder(order)}
                        className="gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        نسخ
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Cost Dialog */}
      <Dialog open={showCostDialog} onOpenChange={setShowCostDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>حساب التكلفة</DialogTitle>
            <DialogDescription>
              أدخل تفاصيل التكلفة للطلب {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>تكلفة الصنف (ل.س)</Label>
              <Input
                type="number"
                value={costData.item_cost}
                onChange={(e) => setCostData({ ...costData, item_cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>رسوم التوصيل (ل.س)</Label>
              <Input
                type="number"
                value={costData.delivery_fee}
                onChange={(e) => setCostData({ ...costData, delivery_fee: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>عمولة المنصة (ل.س)</Label>
              <Input
                type="number"
                value={costData.service_fee}
                onChange={(e) => setCostData({ ...costData, service_fee: parseFloat(e.target.value) || 0 })}
              />
            </div>
            
            <div className="bg-[#F5E6D3] rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#1B4332]">المجموع الكلي:</span>
                <span className="font-bold text-[#1B4332] text-xl">
                  {(costData.item_cost + costData.delivery_fee + costData.service_fee).toLocaleString()} ل.س
                </span>
              </div>
            </div>

            <Button
              onClick={handleUpdateCosts}
              className="w-full bg-[#52B788]"
            >
              حفظ التكلفة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </PasswordProtection>
  );
}