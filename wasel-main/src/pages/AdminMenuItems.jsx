import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRestaurants, fetchMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, uploadFile } from '@/api/waselClient';
import { supabase } from '@/lib/supabase';
import { UtensilsCrossed, Plus, Edit, Trash2, Search, Loader2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowRight } from 'lucide-react';

export default function AdminMenuItems() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState('all');
  
  const [formData, setFormData] = useState({
    restaurant_id: '',
    name: '',
    name_en: '',
    category: '',
    description: '',
    description_en: '',
    base_price: '',
    image_url: '',
    available: true
  });

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          window.location.href = '/';
          return;
        }
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single();
        
        setUser(userData || { email: user.email });
      } catch (err) {
        window.location.href = '/';
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const { data: restaurants = [] } = useQuery({
    queryKey: ['allRestaurants'],
    queryFn: () => fetchRestaurants(),
    enabled: !!user
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['allMenuItems'],
    queryFn: () => fetchMenuItems({}),
    enabled: !!user
  });

  const createItemMutation = useMutation({
    mutationFn: (data) => createMenuItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMenuItems'] });
      resetForm();
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => updateMenuItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMenuItems'] });
      resetForm();
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMenuItems'] });
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار صورة فقط');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('حجم الصورة يجب أن يكون أقل من 10 ميجابايت');
      return;
    }

    setUploadingImage(true);
    try {
      const fileUrl = await uploadFile(file, 'menu-items');
      if (fileUrl) {
        setFormData({ ...formData, image_url: fileUrl });
      }
    } catch (error) {
      console.error('خطأ في رفع الصورة:', error);
      alert('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.restaurant_id) {
      alert('يرجى اختيار المطعم');
      return;
    }
    if (!formData.name || !formData.base_price) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const basePrice = parseFloat(formData.base_price);
    const customerPrice = Math.round(basePrice * 1.1);

    const submitData = {
      ...formData,
      base_price: basePrice,
      customer_price: customerPrice,
      price: customerPrice, // للتوافق مع schema القديم
      is_available: formData.available
    };

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: submitData });
    } else {
      createItemMutation.mutate(submitData);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      restaurant_id: item.restaurant_id,
      name: item.name || '',
      name_en: item.name_en || '',
      category: item.category || '',
      description: item.description || '',
      description_en: item.description_en || '',
      base_price: item.base_price || item.price || '',
      image_url: item.image_url || '',
      available: item.available !== false
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setShowDialog(false);
    setEditingItem(null);
    setFormData({
      restaurant_id: '',
      name: '',
      name_en: '',
      category: '',
      description: '',
      description_en: '',
      base_price: '',
      image_url: '',
      available: true
    });
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRestaurant = selectedRestaurant === 'all' || item.restaurant_id === selectedRestaurant;
    return matchesSearch && matchesRestaurant;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]" dir="rtl">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Link to={createPageUrl('AdminPanel')} className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
            <ArrowRight className="w-5 h-5" />
            العودة للوحة الإدارة
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <UtensilsCrossed className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              إدارة أصناف المطاعم
            </h1>
            <p className="text-white/70 text-lg">
              إضافة وتعديل الأصناف لجميع المطاعم
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="ابحث عن صنف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
          <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="جميع المطاعم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المطاعم</SelectItem>
              {restaurants.map(restaurant => (
                <SelectItem key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setShowDialog(true)}
            className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white"
          >
            <Plus className="w-5 h-5 ml-2" />
            إضافة صنف جديد
          </Button>
        </div>

        {/* Items Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => {
            const restaurant = restaurants.find(r => r.id === item.restaurant_id);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#F5E6D3] hover:shadow-xl transition-all"
              >
                <div className="relative h-48 bg-gray-100">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="mb-2">
                    <span className="text-xs text-[#1B4332]/60 bg-[#F5E6D3] px-2 py-1 rounded">
                      {restaurant?.name || 'مطعم غير معروف'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1B4332] mb-1">{item.name}</h3>
                  <p className="text-sm text-[#1B4332]/60 mb-2">{item.category}</p>
                  <p className="text-sm text-[#1B4332]/60 mb-4 line-clamp-2">{item.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-[#1B4332]">
                      {item.base_price || item.price} ل.س
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      item.available !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.available !== false ? 'متاح' : 'غير متاح'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(item)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 ml-2" />
                      تعديل
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
                          deleteItemMutation.mutate(item.id);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#F5E6D3]">
            <UtensilsCrossed className="w-16 h-16 text-[#F5E6D3] mx-auto mb-4" />
            <p className="text-[#1B4332]/60">لا توجد أصناف</p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#1B4332]">
              {editingItem ? 'تعديل صنف' : 'إضافة صنف جديد'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Restaurant Selection */}
            <div>
              <Label className="text-[#1B4332]">المطعم *</Label>
              <Select
                value={formData.restaurant_id}
                onValueChange={(value) => setFormData({ ...formData, restaurant_id: value })}
                required
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر المطعم" />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map(restaurant => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image Upload */}
            <div>
              <Label className="text-[#1B4332]">صورة الصنف</Label>
              <div className="mt-2">
                {formData.image_url ? (
                  <div className="relative">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="absolute top-2 left-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                      disabled={uploadingImage}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : uploadingImage ? (
                  <div className="border-2 border-dashed border-[#F5E6D3] rounded-xl p-8 text-center">
                    <Loader2 className="w-8 h-8 text-[#1B4332] mx-auto mb-2 animate-spin" />
                    <p className="text-[#1B4332]/60 text-sm">جاري رفع الصورة...</p>
                  </div>
                ) : (
                  <label className="cursor-pointer block border-2 border-dashed border-[#F5E6D3] rounded-xl p-8 text-center hover:border-[#1B4332] transition-colors">
                    <Upload className="w-8 h-8 text-[#1B4332]/40 mx-auto mb-2" />
                    <p className="text-[#1B4332]/60 text-sm">اضغط لرفع صورة</p>
                    <p className="text-[#1B4332]/40 text-xs mt-1">PNG, JPG حتى 10MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Name (Arabic) */}
            <div>
              <Label htmlFor="name" className="text-[#1B4332]">اسم الصنف (عربي) *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: شاورما فروج"
                className="mt-1"
                required
              />
            </div>

            {/* Name (English) */}
            <div>
              <Label htmlFor="name_en" className="text-[#1B4332]">اسم الصنف (English)</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="Ex: Chicken Shawarma"
                className="mt-1"
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category" className="text-[#1B4332]">التصنيف</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="مثال: مقبلات، أطباق رئيسية، حلويات"
                className="mt-1"
              />
            </div>

            {/* Description (Arabic) */}
            <div>
              <Label htmlFor="description" className="text-[#1B4332]">الوصف (عربي)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف مختصر للصنف..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Description (English) */}
            <div>
              <Label htmlFor="description_en" className="text-[#1B4332]">الوصف (English)</Label>
              <Textarea
                id="description_en"
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                placeholder="Short description..."
                className="mt-1"
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
                onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                placeholder="مثال: 50000"
                className="mt-1"
                required
              />
              <p className="text-xs text-[#1B4332]/60 mt-1">
                سعر العميل سيكون: {formData.base_price ? Math.round(parseFloat(formData.base_price) * 1.1) : 0} ل.س (زيادة 10%)
              </p>
            </div>

            {/* Available */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="available"
                checked={formData.available}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="available" className="text-[#1B4332] cursor-pointer">
                الصنف متاح
              </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="flex-1"
                disabled={createItemMutation.isPending || updateItemMutation.isPending}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createItemMutation.isPending || updateItemMutation.isPending || uploadingImage}
                className="flex-1 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white"
              >
                {createItemMutation.isPending || updateItemMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : uploadingImage ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    جاري رفع الصورة...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 ml-2" />
                    {editingItem ? 'حفظ التعديلات' : 'إضافة الصنف'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
