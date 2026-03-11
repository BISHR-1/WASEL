import React, { useState } from 'react';
import { updateRestaurant, uploadFile } from '@/api/waselClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Upload, Loader2, X, Store } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function RestaurantSettings({ restaurant }) {
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [formData, setFormData] = useState({
    name: restaurant.name || '',
    description: restaurant.description || '',
    cuisine_type: restaurant.cuisine_type || '',
    location: restaurant.location || '',
    image_url: restaurant.image_url || '',
    cover_image_url: restaurant.cover_image_url || '',
    available: restaurant.available !== false
  });

  const queryClient = useQueryClient();

  const updateRestaurantMutation = useMutation({
    mutationFn: (data) => updateRestaurant(restaurant.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRestaurants'] });
      alert('تم حفظ التعديلات بنجاح!');
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileUrl = await uploadFile(file, 'restaurants');
      setFormData(prev => ({ ...prev, image_url: fileUrl }));
    } catch (error) {
      console.error('خطأ في رفع الصورة:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const fileUrl = await uploadFile(file, 'restaurants');
      setFormData(prev => ({ ...prev, cover_image_url: fileUrl }));
    } catch (error) {
      console.error('خطأ في رفع صورة الغلاف:', error);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateRestaurantMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#1B4332] mb-2">إعدادات المطعم</h2>
        <p className="text-[#1B4332]/60 text-sm">تعديل المعلومات الأساسية للمطعم</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Restaurant Logo */}
        <div className="bg-white rounded-2xl p-6 border border-[#F5E6D3]">
          <Label className="text-[#1B4332] font-semibold mb-3 block">صورة اللوغو</Label>
          {formData.image_url ? (
            <div className="relative">
              <img
                src={formData.image_url}
                alt="لوغو المطعم"
                className="w-full h-64 object-cover rounded-xl"
              />
              <Button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                variant="outline"
                size="sm"
                className="absolute top-3 left-3 bg-white"
              >
                <X className="w-4 h-4 ml-2" />
                إزالة الصورة
              </Button>
            </div>
          ) : (
            <label className="cursor-pointer block">
              <div className="border-2 border-dashed border-[#F5E6D3] hover:border-[#1B4332]/30 rounded-xl p-12 text-center transition-colors">
                {uploading ? (
                  <>
                    <Loader2 className="w-12 h-12 text-[#1B4332] mx-auto mb-3 animate-spin" />
                    <p className="text-sm text-[#1B4332]/60">جاري رفع الصورة...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-[#1B4332]/40 mx-auto mb-3" />
                    <p className="text-sm text-[#1B4332]/60 mb-1">اضغط لرفع صورة اللوغو</p>
                    <p className="text-xs text-[#1B4332]/40">PNG, JPG حتى 10MB</p>
                  </>
                )}
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

        {/* Restaurant Cover */}
        <div className="bg-white rounded-2xl p-6 border border-[#F5E6D3]">
          <Label className="text-[#1B4332] font-semibold mb-1 block">صورة الغلاف (اختياري)</Label>
          <p className="text-xs text-[#1B4332]/60 mb-3">صورة خلفية تظهر خلف اللوغو في صفحة المطعم</p>
          {formData.cover_image_url ? (
            <div className="relative">
              <img
                src={formData.cover_image_url}
                alt="غلاف المطعم"
                className="w-full h-64 object-cover rounded-xl"
              />
              <Button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, cover_image_url: '' }))}
                variant="outline"
                size="sm"
                className="absolute top-3 left-3 bg-white"
              >
                <X className="w-4 h-4 ml-2" />
                إزالة الصورة
              </Button>
            </div>
          ) : (
            <label className="cursor-pointer block">
              <div className="border-2 border-dashed border-[#F5E6D3] hover:border-[#1B4332]/30 rounded-xl p-12 text-center transition-colors">
                {uploadingCover ? (
                  <>
                    <Loader2 className="w-12 h-12 text-[#1B4332] mx-auto mb-3 animate-spin" />
                    <p className="text-sm text-[#1B4332]/60">جاري رفع الصورة...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-[#1B4332]/40 mx-auto mb-3" />
                    <p className="text-sm text-[#1B4332]/60 mb-1">اضغط لرفع صورة الغلاف</p>
                    <p className="text-xs text-[#1B4332]/40">PNG, JPG حتى 10MB</p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
                disabled={uploadingCover}
              />
            </label>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 border border-[#F5E6D3] space-y-4">
          <h3 className="font-semibold text-[#1B4332] flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-[#52B788]" />
            المعلومات الأساسية
          </h3>

          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-[#1B4332]">اسم المطعم *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              className="mt-1"
              placeholder="مثال: مطعم الشام"
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
              placeholder="وصف مختصر عن المطعم..."
              rows={3}
            />
          </div>

          {/* Cuisine Type */}
          <div>
            <Label htmlFor="cuisine_type" className="text-[#1B4332]">نوع المأكولات *</Label>
            <Input
              id="cuisine_type"
              value={formData.cuisine_type}
              onChange={(e) => setFormData(prev => ({ ...prev, cuisine_type: e.target.value }))}
              required
              className="mt-1"
              placeholder="مثال: مأكولات شرقية، مشويات، فاست فود"
            />
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location" className="text-[#1B4332]">العنوان</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="mt-1"
              placeholder="مثال: درعا البلد - شارع الثورة"
            />
          </div>

          {/* Availability */}
          <div className="flex items-center justify-between pt-4 border-t border-[#F5E6D3]">
            <div>
              <Label className="text-[#1B4332] font-medium">حالة المطعم</Label>
              <p className="text-sm text-[#1B4332]/60">
                {formData.available ? 'المطعم مفتوح ويقبل الطلبات' : 'المطعم مغلق مؤقتاً'}
              </p>
            </div>
            <Switch
              checked={formData.available}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available: checked }))}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateRestaurantMutation.isPending}
            className="bg-[#1B4332] gap-2 px-8"
          >
            {updateRestaurantMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                حفظ التعديلات
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}