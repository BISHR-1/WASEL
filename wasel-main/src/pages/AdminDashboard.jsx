/**
 * Admin Dashboard for Supervisors / Delivery Persons / Suppliers
 * لوحة التحكم للمشرفين والموصلين والموردين
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  LogOut,
  Users,
  Package,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  Eye,
  EyeOff,
  Loader2,
  TrendingUp,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  getCurrentAdminSession,
  getCurrentAdminUser,
  logoutAdminUser,
  hasAdminRole,
  ADMIN_ROLES,
  extendAdminSession
} from '@/utils/adminAuth';
import { createPageUrl } from '@/utils';
import { getNotificationDispatchLogs, notificationDispatchEventName } from '@/services/firebaseOrderNotifications';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, assigned, completed
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState(null);
  const [syncMessage, setSyncMessage] = useState('');
  const [notificationDispatchLogs, setNotificationDispatchLogs] = useState(() => getNotificationDispatchLogs());

  useEffect(() => {
    const handler = () => {
      setNotificationDispatchLogs(getNotificationDispatchLogs());
    };

    window.addEventListener(notificationDispatchEventName, handler);
    return () => window.removeEventListener(notificationDispatchEventName, handler);
  }, []);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const session = getCurrentAdminSession();
      const user = getCurrentAdminUser();

      if (session && user) {
        setCurrentUser(user);
        
        // Extend session timeout
        extendAdminSession();
        
        // Load data based on role
        await loadDashboardData(user);
        setLoading(false);
        return;
      }

      // Unified auth fallback from users.role
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      if (!authUser) {
        navigate(createPageUrl('StaffLogin'));
        return;
      }

      const { data: userRow, error: userRowError } = await supabase
        .from('users')
        .select('id, full_name, email, role, auth_id')
        .or(`auth_id.eq.${authUser.id},id.eq.${authUser.id},email.eq.${authUser.email}`)
        .maybeSingle();

      if (userRowError || !userRow) {
        navigate(createPageUrl('Home'));
        return;
      }

      const role = String(userRow.role || '').toLowerCase();
      if (!['admin', 'super_admin', 'support', 'operator', 'supervisor'].includes(role)) {
        navigate(createPageUrl('Home'));
        return;
      }

      const unifiedAdmin = {
        id: userRow.id,
        name: userRow.full_name || authUser.email || 'Admin',
        email: userRow.email || authUser.email,
        role: role === 'supervisor' ? ADMIN_ROLES.SUPERVISOR : ADMIN_ROLES.SUPERVISOR,
      };

      setCurrentUser(unifiedAdmin);
      await loadDashboardData(unifiedAdmin);
      setLoading(false);

    };

    checkAuth();
  }, [navigate]);

  // Load dashboard data
  const loadDashboardData = async (user) => {
    try {
      // Load all admin users (supervisors, delivery persons, suppliers)
      const { data: users, error: usersError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('is_active', true);

      if (usersError) throw usersError;
      setAdminUsers(users || []);

      // Load delivery persons for supervisor
      if (user.role === ADMIN_ROLES.SUPERVISOR) {
        const deliveryPeople = users?.filter(u => u.role === ADMIN_ROLES.DELIVERY_PERSON) || [];
        setDeliveryPersons(deliveryPeople);

        // Load paid orders
        const { data: ordersList, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('status', 'paid')
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(ordersList || []);
        filterOrders(ordersList, 'all', '');
      } 
      // Load assigned orders for delivery person
      else if (user.role === ADMIN_ROLES.DELIVERY_PERSON) {
        const { data: assignedOrders, error: ordersError } = await supabase
          .from('order_assignments')
          .select('*, orders(*)')
          .eq('delivery_person_id', user.id);

        if (ordersError) throw ordersError;
        
        const ordersList = assignedOrders?.map(a => ({
          ...a.orders,
          assignment_id: a.id,
          assignment_status: a.status
        })) || [];
        
        setOrders(ordersList);
        filterOrders(ordersList, 'all', '');
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل البيانات:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    }
  };

  // Filter orders
  const filterOrders = (ordersList, status, search) => {
    let filtered = [...ordersList];

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(order => order.status === status);
    }

    // Filter by search term
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(order =>
        (order.recipient_details?.name || '').toLowerCase().includes(searchLower) ||
        (order.recipient_details?.phone || '').includes(search) ||
        (order.id || '').includes(search)
      );
    }

    setFilteredOrders(filtered);
  };

  // Handle order assignment
  const handleAssignOrder = async () => {
    if (!assigningOrder || !selectedDeliveryPerson) {
      toast.error('يرجى اختيار موصل');
      return;
    }

    try {
      const { error } = await supabase
        .from('order_assignments')
        .insert([{
          order_id: assigningOrder.id,
          delivery_person_id: selectedDeliveryPerson.id,
          assigned_by: currentUser.id,
          status: 'assigned'
        }]);

      if (error) throw error;

      // Update order status
      await supabase
        .from('orders')
        .update({ status: 'assigned' })
        .eq('id', assigningOrder.id);

      toast.success('تم تعيين الطلب بنجاح');
      setAssigningOrder(null);
      setSelectedDeliveryPerson(null);
      
      // Reload data
      await loadDashboardData(currentUser);
    } catch (error) {
      console.error('❌ خطأ:', error);
      toast.error('حدث خطأ في تعيين الطلب');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logoutAdminUser();
      toast.success('تم تسجيل الخروج بنجاح');
      navigate(createPageUrl('StaffLogin'));
    } catch (error) {
      console.error('❌ خطأ في تسجيل الخروج:', error);
      toast.error('حدث خطأ في تسجيل الخروج');
    }
  };

  // Update order status (for delivery person)
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('تم تحديث حالة الطلب');
      await loadDashboardData(currentUser);
    } catch (error) {
      console.error('❌ خطأ:', error);
      toast.error('حدث خطأ في تحديث الطلب');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-purple-300">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  const isSupervisor = hasAdminRole(ADMIN_ROLES.SUPERVISOR);
  const isDeliveryPerson = hasAdminRole(ADMIN_ROLES.DELIVERY_PERSON);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/5 backdrop-blur-md border border-white/10 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{currentUser?.name}</h1>
              <p className="text-purple-300 text-sm">{currentUser?.role === 'supervisor' ? 'مشرف' : 'موصل'}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </motion.button>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">سجل إرسال الإشعارات (Firebase)</h2>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('wasel_notification_dispatch_logs_v1');
                setNotificationDispatchLogs([]);
                toast.success('تم مسح سجل الإشعارات');
              }}
              className="text-xs px-3 py-1 rounded border border-white/20 text-white/80 hover:bg-white/10"
            >
              مسح السجل
            </button>
          </div>

          {notificationDispatchLogs.length === 0 ? (
            <p className="text-sm text-purple-300">لا يوجد أحداث إشعار بعد.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notificationDispatchLogs.slice(0, 12).map((log) => (
                <div key={log.id} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-white font-semibold">{log.event_type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${log.push_success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      {log.push_success ? 'sent' : 'failed'}
                    </span>
                  </div>
                  <div className="mt-1 text-purple-200">
                    Order: {log.order_number || log.order_id || '-'} | sent: {log.sent} | failed: {log.failed} | total: {log.total}
                  </div>
                  <div className="mt-1 text-xs text-white/50">{new Date(log.created_at).toLocaleString('ar-EG')}</div>
                  {log.note && <div className="mt-1 text-xs text-yellow-300">{log.note}</div>}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Supervisor Dashboard */}
        {isSupervisor && (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Stats */}
              <div className="grid sm:grid-cols-3 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-300 text-sm">الطلبات الجديدة</p>
                      <p className="text-4xl font-bold text-white">{orders.length}</p>
                    </div>
                    <Package className="w-8 h-8 text-purple-400" />
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-300 text-sm">الموصلون</p>
                      <p className="text-4xl font-bold text-white">{deliveryPersons.length}</p>
                    </div>
                    <Users className="w-8 h-8 text-green-400" />
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-300 text-sm">إجمالي الموظفين</p>
                      <p className="text-4xl font-bold text-white">{adminUsers.length}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-400" />
                  </div>
                </motion.div>
              </div>

              {/* Orders Management */}
              <motion.div
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-6">إدارة الطلبات</h2>

                {/* Search and Filter */}
                <div className="mb-6 space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                      <input
                        type="text"
                        placeholder="ابحث عن العميل أو رقم الطلب..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          filterOrders(orders, filterStatus, e.target.value);
                        }}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        filterOrders(orders, e.target.value, searchTerm);
                      }}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="all">جميع الحالات</option>
                      <option value="paid">مدفوعة</option>
                      <option value="assigned">معينة</option>
                      <option value="completed">مكتملة</option>
                    </select>
                  </div>
                </div>

                {/* Orders List */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
                      <p className="text-purple-300">لا توجد طلبات</p>
                    </div>
                  ) : (
                    filteredOrders.map(order => (
                      <motion.div
                        key={order.id}
                        whileHover={{ scale: 1.01 }}
                        className="bg-white/5 border border-white/10 rounded-lg p-4 cursor-pointer hover:border-purple-500 transition-all"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetails(true);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-white">{order.recipient_details?.name}</h3>
                            <p className="text-sm text-purple-300 mt-1">#{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-white/70 mt-1">
                              📍 {order.recipient_details?.address?.slice(0, 40)}...
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              order.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                              order.status === 'assigned' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {order.status === 'completed' ? 'مكتملة' :
                               order.status === 'assigned' ? 'معينة' :
                               'مدفوعة'}
                            </span>
                            <p className="text-xs text-white/50 mt-2">
                              ${order.total_amount?.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Quick assign button */}
                        {order.status === 'paid' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssigningOrder(order);
                            }}
                            className="mt-4 w-full py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all text-sm font-medium"
                          >
                            تعيين موصل
                          </motion.button>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>

              {/* Assign Order Modal */}
              <AnimatePresence>
                {assigningOrder && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setAssigningOrder(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.9 }}
                      className="bg-slate-800 border border-white/10 rounded-xl p-6 max-w-md w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="text-xl font-bold text-white mb-6">اختر موصل</h3>

                      {deliveryPersons.length === 0 ? (
                        <p className="text-purple-300 text-center py-8">لا يوجد موصلون متاحون</p>
                      ) : (
                        <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
                          {deliveryPersons.map(person => (
                            <motion.button
                              key={person.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedDeliveryPerson(person)}
                              className={`w-full p-4 rounded-lg border transition-all text-left ${
                                selectedDeliveryPerson?.id === person.id
                                  ? 'bg-purple-500/20 border-purple-500'
                                  : 'bg-white/5 border-white/10 hover:border-white/30'
                              }`}
                            >
                              <p className="font-bold text-white">{person.name}</p>
                              <p className="text-sm text-purple-300">{person.email}</p>
                            </motion.button>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setAssigningOrder(null)}
                          className="flex-1 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all"
                        >
                          إلغاء
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleAssignOrder}
                          disabled={!selectedDeliveryPerson}
                          className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50"
                        >
                          تأكيد
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Deliveryersons List */}
              <motion.div
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-6">الموصلون</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {deliveryPersons.map(person => (
                    <motion.div
                      key={person.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white/5 border border-white/10 rounded-lg p-4"
                    >
                      <p className="font-bold text-white">{person.name}</p>
                      <p className="text-sm text-purple-300 mt-1">{person.email}</p>
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-xs text-white/70">متصل</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Delivery Person Dashboard */}
        {isDeliveryPerson && (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Stats */}
              <div className="grid sm:grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-300 text-sm">الطلبات المعينة</p>
                      <p className="text-4xl font-bold text-white">{orders.length}</p>
                    </div>
                    <Package className="w-8 h-8 text-purple-400" />
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-300 text-sm">المكتملة</p>
                      <p className="text-4xl font-bold text-white">{orders.filter(o => o.status === 'completed').length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                </motion.div>
              </div>

              {/* Assigned Orders */}
              <motion.div
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-6">الطلبات المعينة لي</h2>

                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
                      <p className="text-purple-300">لا توجد طلبات معينة</p>
                    </div>
                  ) : (
                    orders.map(order => (
                      <motion.div
                        key={order.id}
                        whileHover={{ scale: 1.01 }}
                        className="bg-white/5 border border-white/10 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-white">{order.recipient_details?.name}</h3>
                            <p className="text-sm text-purple-300 mt-2">
                              📱 {order.recipient_details?.phone}
                            </p>
                            <p className="text-sm text-white/70 mt-1">
                              📍 {order.recipient_details?.address}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            order.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                            order.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {order.status === 'completed' ? 'مكتملة' :
                             order.status === 'in_progress' ? 'جاري التوصيل' :
                             'معينة'}
                          </span>
                        </div>

                        {/* Status Update Buttons */}
                        <div className="mt-4 flex gap-2">
                          {order.status !== 'completed' && (
                            <>
                              {order.status !== 'in_progress' && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleUpdateOrderStatus(order.id, 'in_progress')}
                                  className="flex-1 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-all text-sm font-medium"
                                >
                                  جاري التوصيل
                                </motion.button>
                              )}
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                className="flex-1 py-2 bg-green-500/20 border border-green-500/30 text-green-300 rounded-lg hover:bg-green-500/30 transition-all text-sm font-medium"
                              >
                                مكتملة
                              </motion.button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
