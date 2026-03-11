import React, { useState } from 'react';
import { fetchGifts, createGift, updateGift, deleteGift, uploadFile } from '@/api/waselClient';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Upload, Loader2, X, Gift, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BackButton from '../components/common/BackButton';

const categories = [
  { id: 'engagement', name: 'خطوبة' },
  { id: 'wedding', name: 'زفاف' },
  { id: 'newborn', name: 'مولود جديد' },
  { id: 'birthday', name: 'عيد ميلاد' },
  { id: 'graduation', name: 'تخرج' },
  { id: 'flowers', name: 'ورود' },
  { id: 'chocolate', name: 'شوكولا' },
  { id: 'all', name: 'جميع المناسبات' },
];

export default function AdminGifts() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingGift, setEditingGift] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    details: '',
    occasion: '',
    image_url: ''
  });

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser.role !== 'admin') {
          window.location.href = '/';
          return;
        }
        setUser(currentUser);
      } catch (err) {
        base44.auth.redirectToLogin();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const { data: gifts, isLoading: giftsLoading } = useQuery({
    queryKey: ['gifts'],
    queryFn: () => base44.entities.Gift.list(),
    enabled: !!user
  });

  const createGiftMutation = useMutation({
    mutationFn: (data) => base44.entities.Gift.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
      resetForm();
    }
  });

  const updateGiftMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Gift.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
      resetForm();
    }
  });

  const deleteGiftMutation = useMutation({
    mutationFn: (id) => base44.entities.Gift.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: result.file_url }));
    } catch (error) {
      console.error('خطأ في رفع الصورة:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingGift) {
      updateGiftMutation.mutate({ id: editingGift.id, data: formData });
    } else {
      createGiftMutation.mutate(formData);
    }
  };

  const handleEdit = (gift) => {
    setEditingGift(gift);
    setFormData({
      name: gift.name || '',
      category: gift.category || '',
      price: gift.price || '',
      description: gift.description || '',
      details: gift.details || '',
      occasion: gift.occasion || '',
      image_url: gift.image_url || ''
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setShowDialog(false);
    setEditingGift(null);
    setFormData({
      name: '',
      category: '',
      price: '',
      description: '',
      details: '',
      occasion: '',
      image_url: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <BackButton />
      
      {/* Header */}
      <section className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">إدارة الهدايا</h1>
              <p className="text-white/70">إضافة وتعديل الهدايا المتاحة</p>
            </div>
            <Button onClick={() => setShowDialog(true)} className="bg-white text-[#1B4332] hover:bg-white/90 gap-2">
              <Plus className="w-5 h-5" />
              إضافة هدية جديدة
            </Button>
          </div>
        </div>
      </section>

      {/* Gifts Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {giftsLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#1B4332]/60">جاري التحميل...</p>
          </div>
        ) : gifts?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#F5E6D3]">
            <Gift className="w-16 h-16 text-[#F5E6D3] mx-auto mb-4" />
            <p className="text-[#1B4332]/60">لا توجد هدايا بعد</p>
            <Button onClick={() => setShowDialog(true)} className="mt-4 bg-[#1B4332]">
              إضافة أول هدية
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gifts.map((gift) => (
              <motion.div
                key={gift.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-md border border-[#F5E6D3]"
              >
                {gift.image_url && (
                  <img
                    src={gift.image_url}
                    alt={gift.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-[#1B4332] mb-2">{gift.name}</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#1B4332]/60">{gift.category}</span>
                    <span className="font-bold text-[#52B788]">{parseInt(gift.price).toLocaleString()} ل.س</span>
                  </div>
                  <p className="text-sm text-[#1B4332]/60 mb-4 line-clamp-2">{gift.description}</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(gift)}
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      تعديل
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذه الهدية؟')) {
                          deleteGiftMutation.mutate(gift.id);
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
        )}
      </section>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#1B4332]">
              {editingGift ? 'تعديل هدية' : 'إضافة هدية جديدة'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div>
              <Label className="text-[#1B4332] font-semibold">صورة الهدية</Label>
              {formData.image_url ? (
                <div className="relative mt-2">
                  <img
                    src={formData.image_url}
                    alt="معاينة"
                    className="w-full h-64 object-cover rounded-xl"
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
              <Label htmlFor="name" className="text-[#1B4332] font-semibold">اسم الهدية *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="mt-1"
                placeholder="مثال: باقة الخطوبة"
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category" className="text-[#1B4332] font-semibold">التصنيف *</Label>
              <Select value={formData.category} onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div>
              <Label htmlFor="price" className="text-[#1B4332] font-semibold">السعر (ل.س) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                required
                className="mt-1"
                placeholder="80000"
              />
            </div>

            {/* Occasion */}
            <div>
              <Label htmlFor="occasion" className="text-[#1B4332] font-semibold">المناسبة</Label>
              <Input
                id="occasion"
                value={formData.occasion}
                onChange={(e) => setFormData(prev => ({ ...prev, occasion: e.target.value }))}
                className="mt-1"
                placeholder="مثال: خطوبة، عيد ميلاد، تخرج"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-[#1B4332] font-semibold">الوصف المختصر *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                className="mt-1"
                placeholder="وصف مختصر للهدية..."
                rows={3}
              />
            </div>

            {/* Details */}
            <div>
              <Label htmlFor="details" className="text-[#1B4332] font-semibold">التفاصيل الكاملة</Label>
              <Textarea
                id="details"
                value={formData.details}
                onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                className="mt-1"
                placeholder="تفاصيل كاملة عن محتويات الهدية..."
                rows={4}
              />
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
                disabled={createGiftMutation.isPending || updateGiftMutation.isPending}
                className="flex-1 bg-[#1B4332]"
              >
                {createGiftMutation.isPending || updateGiftMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingGift ? (
                  'حفظ التعديلات'
                ) : (
                  'إضافة الهدية'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}