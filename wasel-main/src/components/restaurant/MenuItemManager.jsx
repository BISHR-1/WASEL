import React, { useState } from 'react';
import { fetchMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, uploadFile } from '@/api/waselClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Image as ImageIcon, Upload, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function MenuItemManager({ restaurantId, restaurantName }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    base_price: '',
    image_url: ''
  });

  const queryClient = useQueryClient();

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['menuItems', restaurantId],
    queryFn: () => fetchMenuItems({ restaurant_id: restaurantId })
  });

  const createItemMutation = useMutation({
    mutationFn: (data) => {
      const basePrice = parseInt(data.base_price);
      const customerPrice = Math.round(basePrice * 1.1); // 10% زيادة
      return createMenuItem({
        ...data,
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        base_price: basePrice,
        customer_price: customerPrice,
        price: customerPrice,
        is_available: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems', restaurantId] });
      resetForm();
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const basePrice = parseInt(data.base_price);
      const customerPrice = Math.round(basePrice * 1.1); // 10% زيادة
      return updateMenuItem(id, {
        ...data,
        base_price: basePrice,
        customer_price: customerPrice,
        price: customerPrice
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems', restaurantId] });
      resetForm();
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems', restaurantId] });
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileUrl = await uploadFile(file, 'menu-items');
      setFormData(prev => ({ ...prev, image_url: fileUrl }));
    } catch (error) {
      console.error('خطأ في رفع الصورة:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createItemMutation.mutate(formData);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description || '',
      base_price: item.base_price,
      image_url: item.image_url || ''
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setShowDialog(false);
    setEditingItem(null);
    setFormData({
      name: '',
      category: '',
      description: '',
      base_price: '',
      image_url: ''
    });
  };

  const categories = [...new Set((Array.isArray(menuItems) ? menuItems.map(item => item?.category) : []))];

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
          <h2 className="text-2xl font-bold text-[#1B4332]">قائمة الطعام</h2>
          <p className="text-[#1B4332]/60 text-sm">إدارة المنتجات والأصناف</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-[#1B4332] gap-2">
          <Plus className="w-4 h-4" />
          إضافة منتج جديد
        </Button>
      </div>

      {/* Menu Items */}
      {menuItems?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#F5E6D3]">
          <ImageIcon className="w-16 h-16 text-[#F5E6D3] mx-auto mb-4" />
          <p className="text-[#1B4332]/60">لا توجد منتجات بعد</p>
          <Button onClick={() => setShowDialog(true)} className="mt-4 bg-[#1B4332]">
            إضافة أول منتج
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {(Array.isArray(categories) ? categories : []).map(category => (
            <div key={category} className="bg-white rounded-2xl p-6 border border-[#F5E6D3]">
              <h3 className="text-lg font-bold text-[#1B4332] mb-4">{category}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Array.isArray(menuItems) ? menuItems.filter(item => item?.category === category) : []).map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-[#F5E6D3]/30 rounded-xl overflow-hidden"
                    >
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-40 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h4 className="font-bold text-[#1B4332] mb-1">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-[#1B4332]/60 mb-2 line-clamp-2">{item.description}</p>
                        )}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#1B4332]/60">سعر المطعم:</span>
                            <span className="font-semibold text-[#1B4332]">{(item.base_price || 0).toLocaleString()} ل.س</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-[#F5E6D3]">
                            <span className="text-sm font-bold text-[#1B4332]">سعر العرض (+10%):</span>
                            <span className="font-bold text-[#52B788] text-lg">{(item.customer_price || Math.round((item.base_price || 0) * 1.1)).toLocaleString()} ل.س</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEdit(item)}
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            تعديل
                          </Button>
                          <Button
                            onClick={() => {
                              if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
                                deleteItemMutation.mutate(item.id);
                              }
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-2 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            حذف
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1B4332]">
              {editingItem ? 'تعديل منتج' : 'إضافة منتج جديد'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div>
              <Label className="text-[#1B4332]">صورة المنتج</Label>
              {formData.image_url ? (
                <div className="relative mt-2">
                  <img
                    src={formData.image_url}
                    alt="معاينة"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                    variant="outline"
                    size="sm"
                    className="absolute top-2 left-2 bg-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer block mt-2">
                  <div className="border-2 border-dashed border-[#F5E6D3] hover:border-[#1B4332]/30 rounded-xl p-8 text-center transition-colors">
                    {uploading ? (
                      <Loader2 className="w-8 h-8 text-[#1B4332] mx-auto mb-2 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-[#1B4332]/40 mx-auto mb-2" />
                    )}
                    <p className="text-sm text-[#1B4332]/60">
                      {uploading ? 'جاري الرفع...' : 'اضغط لرفع صورة'}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-[#1B4332]">اسم المنتج *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="mt-1"
                placeholder="مثال: شاورما دجاج"
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category" className="text-[#1B4332]">التصنيف *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                required
                className="mt-1"
                placeholder="مثال: مقبلات، أطباق رئيسية، حلويات"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-[#1B4332]">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1"
                placeholder="وصف مختصر للمنتج..."
                rows={3}
              />
            </div>

            {/* Base Price */}
            <div>
              <Label htmlFor="base_price" className="text-[#1B4332]">سعر المطعم (ل.س) *</Label>
              <Input
                id="base_price"
                type="number"
                value={formData.base_price}
                onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
                required
                className="mt-1"
                placeholder="50000"
              />
              <p className="text-xs text-[#1B4332]/60 mt-1">سعر المنتج من المطعم</p>
            </div>

            {/* Price Preview */}
            <div className="bg-gradient-to-r from-[#F5E6D3] to-[#52B788]/10 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#1B4332]/70">سعر المطعم:</span>
                <span className="font-semibold text-[#1B4332]">
                  {parseInt(formData.base_price || 0).toLocaleString()} ل.س
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#52B788] font-semibold">زيادة 10%:</span>
                <span className="font-semibold text-[#52B788]">
                  +{Math.round(parseInt(formData.base_price || 0) * 0.1).toLocaleString()} ل.س
                </span>
              </div>
              <div className="h-px bg-[#1B4332]/10 my-2" />
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1B4332]">سعر العميل النهائي:</span>
                <span className="text-xl font-bold text-[#1B4332]">
                  {Math.round(parseInt(formData.base_price || 0) * 1.1).toLocaleString()} ل.س
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createItemMutation.isPending || updateItemMutation.isPending}
                className="flex-1 bg-[#1B4332]"
              >
                {createItemMutation.isPending || updateItemMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingItem ? (
                  'حفظ التعديلات'
                ) : (
                  'إضافة المنتج'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}