import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppFooter from '@/components/common/AppFooter';
import { Bell, Trash2, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} from '@/lib/inAppNotifications';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    
    // الاستماع للإشعارات الجديدة
    const handleUpdate = () => loadNotifications();
    window.addEventListener('wasel_notifications_updated', handleUpdate);
    window.addEventListener('wasel_notification_added', handleUpdate);
    
    return () => {
      window.removeEventListener('wasel_notifications_updated', handleUpdate);
      window.removeEventListener('wasel_notification_added', handleUpdate);
    };
  }, []);

  const loadNotifications = () => {
    setNotifications(getNotifications());
    setUnreadCount(getUnreadCount());
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    loadNotifications();
    
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleDelete = (e, notificationId) => {
    e.stopPropagation();
    deleteNotification(notificationId);
    loadNotifications();
  };

  const handleClearAll = () => {
    if (window.confirm('هل تريد حذف جميع الإشعارات؟')) {
      clearAllNotifications();
      loadNotifications();
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-orange-500" />;
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    
    return date.toLocaleDateString('ar-EG', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 pt-6 pb-8 px-4 rounded-b-[2rem] shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-500" />
              الإشعارات
              {unreadCount > 0 && (
                <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    markAllAsRead();
                    loadNotifications();
                  }}
                  className="text-sm text-blue-600 font-medium hover:text-blue-700"
                >
                  قرأت الكل
                </button>
                <button
                  onClick={handleClearAll}
                  className="text-sm text-red-600 font-medium hover:text-red-700"
                >
                  حذف الكل
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Bell className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              لا توجد إشعارات
            </h2>
            <p className="text-gray-600">
              سنرسل لك إشعار عند حدوث تحديثات
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-2xl p-4 shadow-md cursor-pointer transition-all hover:shadow-lg ${
                  !notification.read ? 'border-r-4 border-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, notification.id)}
                    className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <AppFooter />
    </div>
  );
}
