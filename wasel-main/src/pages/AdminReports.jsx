import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart3, TrendingUp, Package, DollarSign, Users, Calendar, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminReports() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [timeRange, setTimeRange] = useState('month');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'bishrjr3734') {
      setIsAuthenticated(true);
    }
  };

  const { data: orders = [] } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
    enabled: isAuthenticated
  });

  const stats = useMemo(() => {
    const now = new Date();
    const filterDate = new Date();
    
    if (timeRange === 'week') {
      filterDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      filterDate.setMonth(now.getMonth() - 1);
    } else if (timeRange === 'year') {
      filterDate.setFullYear(now.getFullYear() - 1);
    }

    const filteredOrders = orders.filter(o => new Date(o.created_date) >= filterDate);

    const totalOrders = filteredOrders.length;
    const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered').length;
    const processingOrders = filteredOrders.filter(o => o.status === 'processing').length;
    const receivedOrders = filteredOrders.filter(o => o.status === 'received').length;

    const totalRevenue = filteredOrders
      .filter(o => o.cost_breakdown?.total)
      .reduce((sum, o) => sum + o.cost_breakdown.total, 0);

    const totalServiceFees = filteredOrders
      .filter(o => o.cost_breakdown?.service_fee)
      .reduce((sum, o) => sum + o.cost_breakdown.service_fee, 0);

    const ordersByType = filteredOrders.reduce((acc, o) => {
      const type = o.order_type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const topItems = filteredOrders
      .filter(o => o.package_type)
      .reduce((acc, o) => {
        acc[o.package_type] = (acc[o.package_type] || 0) + 1;
        return acc;
      }, {});

    const topItemsArray = Object.entries(topItems)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const teamPerformance = filteredOrders
      .filter(o => o.assigned_to)
      .reduce((acc, o) => {
        const name = o.assigned_to;
        if (!acc[name]) {
          acc[name] = { total: 0, delivered: 0 };
        }
        acc[name].total += 1;
        if (o.status === 'delivered') {
          acc[name].delivered += 1;
        }
        return acc;
      }, {});

    const teamArray = Object.entries(teamPerformance)
      .map(([name, data]) => ({
        name,
        total: data.total,
        delivered: data.delivered,
        rate: ((data.delivered / data.total) * 100).toFixed(1)
      }))
      .sort((a, b) => b.total - a.total);

    return {
      totalOrders,
      deliveredOrders,
      processingOrders,
      receivedOrders,
      totalRevenue,
      totalServiceFees,
      ordersByType,
      topItemsArray,
      teamArray,
      deliveryRate: totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : 0
    };
  }, [orders, timeRange]);

  const exportReport = () => {
    const report = `📊 تقرير واصل - ${timeRange === 'week' ? 'أسبوعي' : timeRange === 'month' ? 'شهري' : 'سنوي'}
التاريخ: ${new Date().toLocaleDateString('ar-SA')}

📈 الإحصائيات العامة:
إجمالي الطلبات: ${stats.totalOrders}
الطلبات المستلمة: ${stats.receivedOrders}
قيد التنفيذ: ${stats.processingOrders}
تم التوصيل: ${stats.deliveredOrders}
معدل التوصيل: ${stats.deliveryRate}%

💰 الإيرادات:
إجمالي الإيرادات: ${stats.totalRevenue.toLocaleString()} ل.س
عمولة المنصة: ${stats.totalServiceFees.toLocaleString()} ل.س

📦 توزيع الطلبات:
${Object.entries(stats.ordersByType).map(([type, count]) => 
  `${type === 'gift' ? 'هدايا' : type === 'food' ? 'طعام' : 'باقات'}: ${count}`
).join('\n')}

🔥 الأصناف الأكثر طلباً:
${stats.topItemsArray.map(([item, count], i) => `${i + 1}. ${item} (${count} طلب)`).join('\n')}

👥 أداء الفريق:
${stats.teamArray.map(t => `${t.name}: ${t.total} طلب (${t.delivered} تم التوصيل - ${t.rate}%)`).join('\n')}`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wasel-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl"
        >
          <div className="w-16 h-16 bg-[#1B4332] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#1B4332] text-center mb-2">
            التقارير والإحصائيات
          </h2>
          <p className="text-[#1B4332]/60 text-center mb-6">
            أدخل كلمة المرور للوصول
          </p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full px-4 py-3 rounded-xl border border-[#F5E6D3] text-center"
              autoFocus
            />
            <Button
              type="submit"
              className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white py-6 rounded-xl font-bold"
            >
              دخول
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">التقارير والإحصائيات</h1>
                <p className="text-white/70">تحليل الأداء والمبيعات</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40 bg-white border-0 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">آخر أسبوع</SelectItem>
                  <SelectItem value="month">آخر شهر</SelectItem>
                  <SelectItem value="year">آخر سنة</SelectItem>
                  <SelectItem value="all">كل الوقت</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={exportReport}
                className="bg-white text-[#1B4332] hover:bg-[#F5E6D3]"
              >
                <Download className="w-4 h-4 ml-2" />
                تصدير التقرير
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[#1B4332]/60 flex items-center gap-2">
                <Package className="w-4 h-4" />
                إجمالي الطلبات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#1B4332]">{stats.totalOrders}</div>
              <p className="text-xs text-[#1B4332]/60 mt-1">
                تم التوصيل: {stats.deliveredOrders} ({stats.deliveryRate}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[#1B4332]/60 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                إجمالي الإيرادات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#1B4332]">
                {(stats.totalRevenue / 1000).toFixed(0)}K
              </div>
              <p className="text-xs text-[#1B4332]/60 mt-1">ل.س</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[#1B4332]/60 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                عمولة المنصة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#52B788]">
                {(stats.totalServiceFees / 1000).toFixed(0)}K
              </div>
              <p className="text-xs text-[#1B4332]/60 mt-1">ل.س</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[#1B4332]/60 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                قيد التنفيذ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats.processingOrders}</div>
              <p className="text-xs text-[#1B4332]/60 mt-1">
                جديد: {stats.receivedOrders}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Order Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#52B788]" />
                توزيع الطلبات حسب النوع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.ordersByType).map(([type, count]) => {
                  const typeName = type === 'gift' ? 'هدايا' : type === 'food' ? 'طعام' : 'باقات';
                  const percentage = ((count / stats.totalOrders) * 100).toFixed(1);
                  return (
                    <div key={type}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-[#1B4332]">{typeName}</span>
                        <span className="text-sm text-[#1B4332]/60">{count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-[#F5E6D3] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#52B788] rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#52B788]" />
                الأصناف الأكثر طلباً
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topItemsArray.slice(0, 5).map(([item, count], i) => (
                  <div key={item} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-[#1B4332] text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-[#1B4332]">{item}</span>
                    </div>
                    <span className="text-sm font-bold text-[#52B788]">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Performance */}
        {stats.teamArray.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#52B788]" />
                أداء فريق التنفيذ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.teamArray.map((member) => (
                  <div key={member.name} className="border border-[#F5E6D3] rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-[#1B4332]">{member.name}</h4>
                      <span className="text-sm font-bold text-[#52B788]">{member.rate}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-[#1B4332]/60">إجمالي الطلبات:</span>
                        <span className="font-bold text-[#1B4332] mr-2">{member.total}</span>
                      </div>
                      <div>
                        <span className="text-[#1B4332]/60">تم التوصيل:</span>
                        <span className="font-bold text-[#52B788] mr-2">{member.delivered}</span>
                      </div>
                    </div>
                    <div className="mt-3 h-2 bg-[#F5E6D3] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#52B788] rounded-full"
                        style={{ width: `${member.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}