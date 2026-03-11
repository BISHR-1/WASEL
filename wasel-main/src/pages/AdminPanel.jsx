import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Settings, Gift, Package, UtensilsCrossed, FileText, Shield, ArrowRight, Users, TrendingUp, ShoppingCart, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PasswordProtection from '../components/common/PasswordProtection';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser.role !== 'admin') {
          navigate(createPageUrl('Home'));
          return;
        }
        setUser(currentUser);
      } catch (err) {
        navigate(createPageUrl('Home'));
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

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

  const adminSections = [
    {
      title: 'إدارة المطاعم',
      description: 'إضافة وتعديل وحذف المطاعم والقوائم',
      icon: UtensilsCrossed,
      link: 'AdminRestaurants',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'إدارة أصناف المطاعم',
      description: 'إضافة وتعديل أصناف الطعام لجميع المطاعم',
      icon: UtensilsCrossed,
      link: 'AdminMenuItems',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'إدارة الهدايا',
      description: 'إدارة كتالوج الهدايا والمناسبات',
      icon: Gift,
      link: 'AdminGifts',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50'
    },
    {
      title: 'إدارة الباقات',
      description: 'إدارة الباقات والعروض الخاصة',
      icon: Package,
      link: 'AdminPackages',
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'إدارة المنتجات',
      description: 'إدارة السوبر ماركت والإلكترونيات',
      icon: ShoppingCart,
      link: 'AdminProducts',
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'bg-teal-50'
    },
    {
      title: 'الطلبات',
      description: 'متابعة وإدارة جميع الطلبات',
      icon: FileText,
      link: 'AdminOrders',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'التقارير',
      description: 'إحصائيات وتقارير الأداء',
      icon: TrendingUp,
      link: 'AdminReports',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50'
    },
    {
      title: 'المستشار الذكي',
      description: 'اقتراحات لتطوير الموقع وزيادة المبيعات',
      icon: Bot,
      link: 'AdminAdvisor',
      color: 'from-pink-600 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'المستخدمين والمحافظ',
      description: 'إدارة بيانات وتصفير أرصدة المستخدمين',
      icon: Users,
      link: 'AdminUsers',
      color: 'from-slate-500 to-slate-700',
      bgColor: 'bg-slate-50'
    }
  ];

  return (
    <PasswordProtection>
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] to-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <Link to={createPageUrl('Home')} className="text-white/80 hover:text-white flex items-center gap-2">
              <ArrowRight className="w-5 h-5" />
              العودة للرئيسية
            </Link>
            <Button
              onClick={() => base44.auth.logout()}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              تسجيل الخروج
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">لوحة التحكم</h1>
              <p className="text-white/80">مرحباً، {user?.full_name}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Sections */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.link}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={createPageUrl(section.link)}>
                  <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-[#F5E6D3] hover:border-[#52B788] cursor-pointer h-full">
                    <CardHeader>
                      <div className={`w-14 h-14 bg-gradient-to-br ${section.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <CardTitle className="text-[#1B4332] text-xl">{section.title}</CardTitle>
                      <CardDescription className="text-[#1B4332]/60">
                        {section.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white"
                      >
                        فتح
                        <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <Card className="bg-gradient-to-br from-[#F5E6D3] to-white border-2 border-[#F5E6D3]">
          <CardHeader>
            <CardTitle className="text-[#1B4332]">معلومات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#52B788]/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <UtensilsCrossed className="w-6 h-6 text-[#52B788]" />
                </div>
                <p className="text-sm text-[#1B4332]/60">إدارة المطاعم</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#52B788]/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Gift className="w-6 h-6 text-[#52B788]" />
                </div>
                <p className="text-sm text-[#1B4332]/60">إدارة الهدايا</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#52B788]/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Package className="w-6 h-6 text-[#52B788]" />
                </div>
                <p className="text-sm text-[#1B4332]/60">إدارة الباقات</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
    </PasswordProtection>
  );
}