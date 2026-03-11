import React, { useState, useEffect } from 'react';
import { fetchRestaurantById, fetchMenuItems, fetchOrders, fetchRestaurants, createRestaurant } from '@/api/waselClient';

import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Clock, Package, ShoppingBag, LogOut, Image as ImageIcon, Upload, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MenuItemManager from '../components/restaurant/MenuItemManager';
import WorkingHoursManager from '../components/restaurant/WorkingHoursManager';
import RestaurantOrders from '../components/restaurant/RestaurantOrders';
import RestaurantSettings from '../components/restaurant/RestaurantSettings';
import PasswordProtection from '../components/common/PasswordProtection';

export default function RestaurantDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        if (error || !authUser) {
          window.location.href = '/';
          return;
        }
        setUser(authUser);
      } catch (err) {
        window.location.href = '/';
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const { data: restaurants = [] } = useQuery({
    queryKey: ['myRestaurants', user?.email],
    queryFn: async () => {
      try {
        const result = await fetchRestaurants({ owner_email: user?.email || '' });
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
        return [];
      }
    },
    enabled: !!user
  });

  const myRestaurant = restaurants?.[0];
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    cuisine_type: '',
    description: '',
    location: '',
    image_url: ''
  });

  const createRestaurantMutation = useMutation({
    mutationFn: (data) => createRestaurant({
      ...data,
      owner_email: user?.email || '',
      available: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRestaurants'] });
      alert('تم تسجيل المطعم بنجاح!');
    },
    onError: (error) => {
      alert('حدث خطأ: ' + error.message);
    }
  });

  const handleCreateRestaurant = (e) => {
    e.preventDefault();
    createRestaurantMutation.mutate(newRestaurant);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#1B4332]/60">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!myRestaurant) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#1B4332] to-[#52B788] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#1B4332] mb-2">مرحباً بك في لوحة المطعم</h2>
            <p className="text-[#1B4332]/60">سجل مطعمك الآن للبدء بإدارة قائمة الطعام والطلبات</p>
          </div>

          <form onSubmit={handleCreateRestaurant} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-[#1B4332]">اسم المطعم *</Label>
              <Input
                id="name"
                value={newRestaurant.name}
                onChange={(e) => setNewRestaurant(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="مثال: مطعم الشام"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="cuisine_type" className="text-[#1B4332]">نوع المأكولات *</Label>
              <Input
                id="cuisine_type"
                value={newRestaurant.cuisine_type}
                onChange={(e) => setNewRestaurant(prev => ({ ...prev, cuisine_type: e.target.value }))}
                required
                placeholder="مثال: مأكولات شرقية"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-[#1B4332]">وصف المطعم</Label>
              <Textarea
                id="description"
                value={newRestaurant.description}
                onChange={(e) => setNewRestaurant(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف مختصر عن المطعم..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="location" className="text-[#1B4332]">العنوان</Label>
              <Input
                id="location"
                value={newRestaurant.location}
                onChange={(e) => setNewRestaurant(prev => ({ ...prev, location: e.target.value }))}
                placeholder="مثال: درعا البلد"
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                className="flex-1"
              >
                تسجيل الخروج
              </Button>
              <Button
                type="submit"
                disabled={createRestaurantMutation.isPending}
                className="flex-1 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F]"
              >
                {createRestaurantMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري التسجيل...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 ml-2" />
                    تسجيل المطعم
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <PasswordProtection>
    <div className="min-h-screen bg-[#FDFBF7]" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-[#F5E6D3] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user?.role === 'admin' && (
                <Link 
                  to={createPageUrl('AdminPanel')} 
                  className="text-[#1B4332]/60 hover:text-[#1B4332] transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
              <div className="w-12 h-12 bg-gradient-to-br from-[#1B4332] to-[#52B788] rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1B4332]">{myRestaurant.name}</h1>
                <p className="text-sm text-[#1B4332]/60">{myRestaurant.cuisine_type}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === 'admin' && (
                <Link to={createPageUrl('AdminPanel')}>
                  <Button variant="outline" className="gap-2">
                    <ArrowRight className="w-4 h-4" />
                    لوحة التحكم
                  </Button>
                </Link>
              )}
              <Button onClick={handleLogout} variant="outline" className="gap-2">
                <LogOut className="w-4 h-4" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Tabs defaultValue="menu" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-3xl">
            <TabsTrigger value="menu" className="gap-2">
              <Package className="w-4 h-4" />
              قائمة الطعام
            </TabsTrigger>
            <TabsTrigger value="hours" className="gap-2">
              <Clock className="w-4 h-4" />
              ساعات العمل
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingBag className="w-4 h-4" />
              الطلبات
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Edit className="w-4 h-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="menu">
            <MenuItemManager restaurantId={myRestaurant.id} restaurantName={myRestaurant.name} />
          </TabsContent>

          <TabsContent value="hours">
            <WorkingHoursManager restaurant={myRestaurant} />
          </TabsContent>

          <TabsContent value="orders">
            <RestaurantOrders restaurantId={myRestaurant.id} restaurantName={myRestaurant.name} />
          </TabsContent>

          <TabsContent value="settings">
            <RestaurantSettings restaurant={myRestaurant} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </PasswordProtection>
  );
}