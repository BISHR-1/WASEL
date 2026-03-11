import React, { useState } from 'react';
import { fetchRestaurants, createRestaurant, deleteRestaurant, uploadFile } from '@/api/waselClient';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UtensilsCrossed, Plus, Edit, Trash2, Settings, Menu as MenuIcon, Clock, ShoppingBag, ArrowRight, Save, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MenuItemManager from '../components/restaurant/MenuItemManager';
import WorkingHoursManager from '../components/restaurant/WorkingHoursManager';
import RestaurantSettings from '../components/restaurant/RestaurantSettings';
import RestaurantOrders from '../components/restaurant/RestaurantOrders';

export default function AdminRestaurants() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    description: '',
    cuisine_type: '',
    location: '',
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
        // Check if user is admin (you might have a role field in users table)
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single();
        
        // For now, allow all authenticated users (add admin check if needed)
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

  const createRestaurantMutation = useMutation({
    mutationFn: (data) => createRestaurant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allRestaurants'] });
      setShowCreateDialog(false);
      setNewRestaurant({
        name: '',
        description: '',
        cuisine_type: '',
        location: '',
        image_url: '',
        available: true
      });
    }
  });

  const deleteRestaurantMutation = useMutation({
    mutationFn: (id) => deleteRestaurant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allRestaurants'] });
    }
  });

  const handleCreateRestaurant = () => {
    if (!newRestaurant.name) {
      alert('يرجى إدخال اسم المطعم');
      return;
    }
    createRestaurantMutation.mutate(newRestaurant);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار صورة فقط');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('حجم الصورة يجب أن يكون أقل من 10 ميجابايت');
      return;
    }

    setUploadingImage(true);
    try {
      const fileUrl = await uploadFile(file, 'restaurants');
      if (fileUrl) {
        setNewRestaurant({ ...newRestaurant, image_url: fileUrl });
        console.log('تم رفع الصورة بنجاح:', fileUrl);
      } else {
        throw new Error('فشل في الحصول على رابط الصورة');
      }
    } catch (error) {
      console.error('خطأ في رفع الصورة:', error);
      alert('حدث خطأ أثناء رفع الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (selectedRestaurant) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedRestaurant(null)}
                  className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  {selectedRestaurant.image_url && (
                    <img
                      src={selectedRestaurant.image_url}
                      alt={selectedRestaurant.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  )}
                  <div>
                    <h1 className="text-2xl font-bold text-white">{selectedRestaurant.name}</h1>
                    <p className="text-white/70 text-sm">{selectedRestaurant.cuisine_type}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-lg">
                <p className="text-white text-sm">إدارة كاملة - Admin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <Tabs defaultValue="menu" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="menu" className="flex items-center gap-2">
                <MenuIcon className="w-4 h-4" />
                القائمة
              </TabsTrigger>
              <TabsTrigger value="hours" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                ساعات العمل
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                الطلبات
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                الإعدادات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="menu">
              <MenuItemManager restaurantId={selectedRestaurant.id} />
            </TabsContent>

            <TabsContent value="hours">
              <WorkingHoursManager
                restaurant={selectedRestaurant}
              />
            </TabsContent>

            <TabsContent value="orders">
              <RestaurantOrders
                restaurantId={selectedRestaurant.id}
                restaurantName={selectedRestaurant.name}
              />
            </TabsContent>

            <TabsContent value="settings">
              <RestaurantSettings restaurant={selectedRestaurant} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]" dir="rtl">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <UtensilsCrossed className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              إدارة المطاعم - Admin
            </h1>
            <p className="text-white/70 text-lg">
              تحكم كامل في جميع المطاعم والقوائم
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Add Button */}
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#1B4332]">
            جميع المطاعم ({restaurants.length})
          </h2>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white"
          >
            <Plus className="w-5 h-5 ml-2" />
            إضافة مطعم جديد
          </Button>
        </div>

        {/* Restaurants Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant, index) => (
            <motion.div
              key={restaurant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#F5E6D3] hover:shadow-xl transition-all duration-300"
            >
              <div className="relative h-48">
                <img
                  src={restaurant.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    restaurant.available
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-500 text-white'
                  }`}>
                    {restaurant.available ? 'متاح' : 'غير متاح'}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-bold text-[#1B4332] mb-2">
                  {restaurant.name}
                </h3>
                <p className="text-[#1B4332]/60 text-sm mb-1">
                  {restaurant.cuisine_type}
                </p>
                <p className="text-[#1B4332]/60 text-sm mb-4">
                  📍 {restaurant.location}
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setSelectedRestaurant(restaurant)}
                    className="flex-1 bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
                  >
                    <Edit className="w-4 h-4 ml-2" />
                    إدارة
                  </Button>
                  <Button
                    onClick={() => {
                      if (confirm('هل أنت متأكد من حذف هذا المطعم؟')) {
                        deleteRestaurantMutation.mutate(restaurant.id);
                      }
                    }}
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {restaurants.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#F5E6D3]">
            <UtensilsCrossed className="w-16 h-16 text-[#F5E6D3] mx-auto mb-4" />
            <p className="text-[#1B4332]/60">لا توجد مطاعم حالياً</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="mt-4 bg-[#1B4332] text-white"
            >
              أضف أول مطعم
            </Button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#1B4332]">
              إضافة مطعم جديد
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Image */}
            <div>
              <Label>صورة المطعم</Label>
              <div className="mt-2">
                {newRestaurant.image_url ? (
                  <div className="relative">
                    <img
                      src={newRestaurant.image_url}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => setNewRestaurant({ ...newRestaurant, image_url: '' })}
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
                    <Plus className="w-8 h-8 text-[#1B4332]/40 mx-auto mb-2" />
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

            {/* Name */}
            <div>
              <Label htmlFor="name">اسم المطعم *</Label>
              <Input
                id="name"
                value={newRestaurant.name}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                placeholder="مثال: مطعم الشام"
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={newRestaurant.description}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, description: e.target.value })}
                placeholder="وصف المطعم..."
                className="mt-1 min-h-[100px]"
              />
            </div>

            {/* Cuisine Type */}
            <div>
              <Label htmlFor="cuisine_type">نوع المطبخ</Label>
              <Input
                id="cuisine_type"
                value={newRestaurant.cuisine_type}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, cuisine_type: e.target.value })}
                placeholder="مثال: شامي، حوراني، مشاوي"
                className="mt-1"
              />
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">الموقع</Label>
              <Input
                id="location"
                value={newRestaurant.location}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, location: e.target.value })}
                placeholder="مثال: درعا البلد"
                className="mt-1"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCreateRestaurant}
                disabled={createRestaurantMutation.isPending || uploadingImage}
                className="flex-1 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white"
              >
                {createRestaurantMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : uploadingImage ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    جاري رفع الصورة...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 ml-2" />
                    إنشاء المطعم
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowCreateDialog(false)}
                variant="outline"
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}