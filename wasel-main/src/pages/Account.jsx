import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, Heart, Settings, LogOut, Package, ChevronRight, Edit2, Save, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { getOtpSession, clearOtpSession } from '@/lib/otpAuth';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

export default function Account() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatarUrl: '',
  });

  useEffect(() => {
    const loadSession = async () => {
      const otpSession = getOtpSession();
      if (otpSession?.email) {
        setSession({ type: 'otp', email: otpSession.email });
        setProfile({
          name: otpSession.name || '',
          email: otpSession.email || '',
          phone: otpSession.phone || '',
          avatarUrl: '',
        });
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setSession(null);
          return;
        }

        const { data: dbProfile, error } = await supabase
          .from('users')
          .select('full_name, email, phone, avatar_url')
          .eq('auth_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Failed to load profile from users table:', error);
        }

        const fallbackName = user.user_metadata?.full_name || user.user_metadata?.name || (user.email ? user.email.split('@')[0] : 'عميل واصل');
        const mergedProfile = {
          name: dbProfile?.full_name || fallbackName,
          email: dbProfile?.email || user.email || '',
          phone: dbProfile?.phone || '',
          avatarUrl: dbProfile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        };

        setSession({ type: 'google', userId: user.id, email: user.email || '' });
        setProfile(mergedProfile);
      } catch (error) {
        console.error('Account session load error:', error);
        setSession(null);
      }
    };

    loadSession();
  }, []);

  const handleSave = async () => {
    // Save to localStorage for now
    localStorage.setItem('user_profile', JSON.stringify(profile));

    if (session?.type === 'google' && session?.userId) {
      const { error } = await supabase.from('users').upsert(
        {
          auth_id: session.userId,
          email: profile.email || session.email,
          full_name: profile.name || null,
          phone: profile.phone || null,
          avatar_url: profile.avatarUrl || null,
          provider: 'google',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'auth_id' }
      );

      if (error) {
        console.error('Profile upsert error:', error);
        toast.error('تم الحفظ محلياً لكن فشل تحديث الملف الشخصي على الخادم');
        setEditing(false);
        return;
      }
    }

    toast.success('تم حفظ البيانات بنجاح');
    setEditing(false);
  };

  const handleLogout = async () => {
    // تأكيد تسجيل الخروج
    if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      clearOtpSession();
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Supabase signout error:', error);
      }
      toast.success('تم تسجيل الخروج بنجاح');
      // إعادة تحميل الصفحة للعودة لشاشة تسجيل الدخول
      window.location.href = '/';
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#f7f7fa] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl text-center"
        >
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            مرحباً بك
          </h2>
          <p className="text-gray-600 mb-8">
            سجّل دخولك للوصول إلى حسابك
          </p>
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold h-12 rounded-xl"
          >
            العودة للرئيسية
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 pb-24 font-['Cairo']">
      {/* Header with Profile */}
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 pt-8 pb-20 px-4 rounded-b-[2rem] shadow-lg">
        <div className="max-w-2xl mx-auto">
          {/* Profile Circle with Wasel Character */}
          <div className="flex flex-col items-center">
            <motion.div 
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              className="relative w-32 h-32 mb-4"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-blue-300/30 rounded-full blur-lg scale-110" />
              
              {/* Wasel Character */}
              <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-2xl">
                <img
                  src={profile.avatarUrl || '/wasel-mascot.png'}
                  alt="User Avatar"
                  className="w-24 h-24 object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = '/wasel-mascot.png';
                  }}
                />
              </div>
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              أهلاً بك، {profile.name || 'عميل واصل'}
            </h2>
            <p className="text-gray-600 text-sm">
              نوصل حبك لحد الباب 💙
            </p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="max-w-2xl mx-auto px-4 -mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">معلوماتي</h3>
            <button
              onClick={() => editing ? handleSave() : setEditing(true)}
              className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 font-medium text-sm"
            >
              {editing ? (
                <>
                  <Save className="w-4 h-4" />
                  حفظ
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  تعديل
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600 mb-1">الاسم</Label>
              <Input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                disabled={!editing}
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600 mb-1">البريد الإلكتروني</Label>
              <Input
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled={!editing}
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600 mb-1">رقم الهاتف</Label>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                disabled={!editing}
                className="bg-gray-50"
              />
            </div>
          </div>
        </motion.div>

        {/* Menu Items */}
        <div className="space-y-3">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => navigate(createPageUrl('Wallet'))}
            className="w-full bg-gradient-to-l from-[#F0FDF4] to-white rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow border border-[#BBF7D0]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800">محفظتي</p>
                <p className="text-xs text-gray-500">شحن الرصيد ومسح بطاقات QR</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-green-500" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate(createPageUrl('MyOrders'))}
            className="w-full bg-white rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800">طلباتي</p>
                <p className="text-xs text-gray-500">تتبع وإدارة طلباتك</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate(createPageUrl('MyAddresses'))}
            className="w-full bg-white rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800">عناويني</p>
                <p className="text-xs text-gray-500">إدارة عناوين التوصيل</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate(createPageUrl('Favorites'))}
            className="w-full bg-white rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-600" />
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800">المفضلة</p>
                <p className="text-xs text-gray-500">المنتجات المفضلة لديك</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => navigate(createPageUrl('Settings'))}
            className="w-full bg-white rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800">الإعدادات</p>
                <p className="text-xs text-gray-500">اللغة والإشعارات</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            onClick={() => navigate(createPageUrl('CustomerSupport'))}
            className="w-full bg-gradient-to-l from-[#EFF6FF] to-white rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow border border-[#BFDBFE]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">🎧</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800">مركز المساعدة</p>
                <p className="text-xs text-gray-500">أسئلة شائعة ودعم مباشر</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-400" />
          </motion.button>

          {/* Logout */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={handleLogout}
            className="w-full bg-red-50 rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-red-100 transition-colors mt-6"
          >
            <LogOut className="w-5 h-5 text-red-600" />
            <span className="font-bold text-red-600">تسجيل الخروج</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
