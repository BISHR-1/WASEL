/**
 * نظام الإشعارات داخل التطبيق
 * In-App Notifications System
 */

/**
 * إضافة إشعار داخل التطبيق
 */
export function addNotification(title, message, type = 'info', actionUrl = null) {
  const notifications = getNotifications();
  
  const newNotification = {
    id: Date.now().toString(),
    title,
    message,
    type, // 'info', 'success', 'warning', 'error'
    actionUrl,
    read: false,
    createdAt: new Date().toISOString()
  };
  
  notifications.unshift(newNotification);
  
  // احفظ آخر 50 إشعار فقط
  const limited = notifications.slice(0, 50);
  localStorage.setItem('wasel_in_app_notifications', JSON.stringify(limited));
  
  // إظهار toast (إذا كان متاحاً)
  // @ts-ignore - toast may be available globally
  if (typeof window !== 'undefined' && window.toast) {
    // @ts-ignore
    window.toast(message, { title, type });
  }
  
  // إطلاق حدث مخصص لتحديث UI
  window.dispatchEvent(new CustomEvent('wasel_notification_added', { detail: newNotification }));
  
  return newNotification;
}

/**
 * جلب جميع الإشعارات
 */
export function getNotifications() {
  const stored = localStorage.getItem('wasel_in_app_notifications');
  return stored ? JSON.parse(stored) : [];
}

/**
 * عدد الإشعارات غير المقروءة
 */
export function getUnreadCount() {
  const notifications = getNotifications();
  return notifications.filter(n => !n.read).length;
}

/**
 * تحديد إشعار كمقروء
 */
export function markAsRead(notificationId) {
  const notifications = getNotifications();
  const updated = notifications.map(n => 
    n.id === notificationId ? { ...n, read: true } : n
  );
  localStorage.setItem('wasel_in_app_notifications', JSON.stringify(updated));
  
  // إطلاق حدث لتحديث العداد
  window.dispatchEvent(new Event('wasel_notifications_updated'));
}

/**
 * تحديد جميع الإشعارات كمقروءة
 */
export function markAllAsRead() {
  const notifications = getNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  localStorage.setItem('wasel_in_app_notifications', JSON.stringify(updated));
  
  window.dispatchEvent(new Event('wasel_notifications_updated'));
}

/**
 * حذف إشعار
 */
export function deleteNotification(notificationId) {
  const notifications = getNotifications();
  const filtered = notifications.filter(n => n.id !== notificationId);
  localStorage.setItem('wasel_in_app_notifications', JSON.stringify(filtered));
  
  window.dispatchEvent(new Event('wasel_notifications_updated'));
}

/**
 * مسح جميع الإشعارات
 */
export function clearAllNotifications() {
  localStorage.removeItem('wasel_in_app_notifications');
  
  window.dispatchEvent(new Event('wasel_notifications_updated'));
}
