import React, { useState } from 'react';
import { fetchPackages, createPackage, updatePackage, deletePackage, uploadFile } from '@/api/waselClient';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Upload, Loader2, X, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BackButton from '../components/common/BackButton';

const packageTypes = [
  { id: 'engagement', name: 'خطوبة' },
  { id: 'birthday', name: 'عيد ميلاد' },
  { id: 'eid', name: 'الأعياد' },
  { id: 'groceries', name: 'مواد غذائية' },
  { id: 'emergency', name: 'طوارئ' },
  { id: 'weekly_food', name: 'طعام أسبوعي' },
];

export default function AdminPackages() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    price: '',
    description: '',
    contents: '',
    details: '',
    delivery_time: '',
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

  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: () => base44.entities.Package.list(),
    enabled: !!user
  });

  const createPackageMutation = useMutation({
    mutationFn: (data) => base44.entities.Package.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      resetForm();
    }
  });

  const updatePackageMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Package.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      resetForm();
    }
  });

  const deletePackageMutation = useMutation({
    mutationFn: (id) => base44.entities.Package.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
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
    if (editingPackage) {
      updatePackageMutation.mutate({ id: editingPackage.id, data: formData });
    } else {
      createPackageMutation.mutate(formData);
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name || '',
      type: pkg.type || '',
      price: pkg.price || '',
      description: pkg.description || '',
      contents: pkg.contents || '',
      details: pkg.details || '',
      delivery_time: pkg.delivery_time || '',
      image_url: pkg.image_url || ''
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setShowDialog(false);
    setEditingPackage(null);
    setFormData({
      name: '',
      type: '',
      price: '',
      description: '',
      contents: '',
      details: '',
      delivery_time: '',
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
              <h1 className="text-3xl font-bold text-white mb-2">إدارة الباقات</h1>
              <p className="text-white/70">إضافة وتعديل الباقات المتاحة</p>
            </div>
            <Button onClick={() => setShowDialog(true)} className="bg-white text-[#1B4332] hover:bg-white/90 gap-2">
              <Plus className="w-5 h-5" />
              إضافة باقة جديدة
            </Button>
          </div>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {packagesLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#1B4332]/60">جاري التحميل...</p>
          </div>
        ) : packages?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#F5E6D3]">
            <Package className="w-16 h-16 text-[#F5E6D3] mx-auto mb-4" />
            <p className="text-[#1B4332]/60">لا توجد باقات بعد</p>
            <Button onClick={() => setShowDialog(true)} className="mt-4 bg-[#1B4332]">
              إضافة أول باقة
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {packages.map((pkg) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-md border border-[#F5E6D3]"
              >
                {pkg.image_url && (
                  <img
                    src={pkg.image_url}
                    alt={pkg.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-[#1B4332] mb-2">{pkg.name}</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#1B4332]/60">{pkg.type}</span>
                    <span className="font-bold text-[#52B788]">{parseInt(pkg.price).toLocaleString()} ل.س</span>
                  </div>
                  <p className="text-sm text-[#1B4332]/60 mb-2 line-clamp-2">{pkg.description}</p>
                  <p className="text-xs text-[#1B4332]/50 mb-4">⏱ {pkg.delivery_time}</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(pkg)}
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      تعديل
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذه الباقة؟')) {
                          deletePackageMutation.mutate(pkg.id);
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
              {editingPackage ? 'تعديل باقة' : 'إضافة باقة جديدة'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div>
              <Label className="text-[#1B4332] font-semibold">صورة الباقة</Label>
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
              <Label htmlFor="name" className="text-[#1B4332] font-semibold">اسم الباقة *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="mt-1"
                placeholder="مثال: باقة الخطوبة"
              />
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="type" className="text-[#1B4332] font-semibold">نوع الباقة *</Label>
              <Select value={formData.type} onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر نوع الباقة" />
                </SelectTrigger>
                <SelectContent>
                  {packageTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
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

            {/* Delivery Time */}
            <div>
              <Label htmlFor="delivery_time" className="text-[#1B4332] font-semibold">وقت التوصيل *</Label>
              <Input
                id="delivery_time"
                value={formData.delivery_time}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_time: e.target.value }))}
                required
                className="mt-1"
                placeholder="مثال: 24-48 ساعة"
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
                placeholder="وصف مختصر للباقة..."
                rows={3}
              />
            </div>

            {/* Contents */}
            <div>
              <Label htmlFor="contents" className="text-[#1B4332] font-semibold">محتويات الباقة *</Label>
              <Textarea
                id="contents"
                value={formData.contents}
                onChange={(e) => setFormData(prev => ({ ...prev, contents: e.target.value }))}
                required
                className="mt-1"
                placeholder="مثال: ورد أحمر، شوكولاتة فاخرة، بطاقة تهنئة"
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
                placeholder="تفاصيل كاملة عن محتويات الباقة..."
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
                disabled={createPackageMutation.isPending || updatePackageMutation.isPending}
                className="flex-1 bg-[#1B4332]"
              >
                {createPackageMutation.isPending || updatePackageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingPackage ? (
                  'حفظ التعديلات'
                ) : (
                  'إضافة الباقة'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}