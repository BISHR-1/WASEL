/**
 * نظام الإشعارات الفورية - Push Notifications System
 * يعمل على Android/iOS عبر Capacitor وفي المتصفح كـ fallback
 */

/**
 * Check if we're on a native platform
 */
function isNativePlatform() {
  try {
    // @ts-ignore
    const capacitor = window['Capacitor'];
    return capacitor && typeof capacitor.isNativePlatform === 'function' && capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Get PushNotifications plugin safely
 */
async function getPushNotificationsPlugin() {
  if (!isNativePlatform()) {
    return null;
  }
  try {
    const module = await import('@capacitor/push-notifications');
    return module.PushNotifications;
  } catch {
    return null;
  }
}

/**
 * تهيئة الإشعارات الفورية
 */
export async function initPushNotifications() {
  try {
    // Only initialize on native platforms
    if (!isNativePlatform()) {
      console.log('Push notifications: Running in browser mode, skipping native init');
      return false;
    }

    const PushNotifications = await getPushNotificationsPlugin();
    if (!PushNotifications) {
      console.log('Push notifications plugin not available - skipping initialization');
      return false;
    }

    console.log('Initializing push notifications...');

    // طلب الإذن
    let permStatus;
    try {
      permStatus = await PushNotifications.checkPermissions();
    } catch (permError) {
      console.warn('Permission check failed:', permError);
      // Continue without permission check on some platforms
      permStatus = { receive: 'granted' };
    }

    if (permStatus.receive === 'prompt') {
      try {
        permStatus = await PushNotifications.requestPermissions();
      } catch (requestError) {
        console.warn('Permission request failed:', requestError);
        // Continue anyway
        permStatus = { receive: 'granted' };
      }
    }

    if (permStatus.receive !== 'granted') {
      console.log('Push notification permissions not granted');
      return false;
    }

    // تسجيل الجهاز
    try {
      await PushNotifications.register();
    } catch (regError) {
      console.error('Registration failed:', regError);
      return false;
    }

    // الاستماع للأحداث
    setupPushListeners(PushNotifications);

    console.log('Push notifications initialized successfully!');
    return true;
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    // Don't throw error, just return false to prevent app crash
    return false;
  }
}

/**
 * إعداد المستمعين للإشعارات
 */
function setupPushListeners(PushNotifications) {
  if (!PushNotifications) return;
  
  // عند نجاح التسجيل
  PushNotifications.addListener('registration', (token) => {
    console.log('Push registration success, token: ' + token.value);
    // احفظ الـ token في قاعدة البيانات
    saveDeviceToken(token.value);
  });

  // عند فشل التسجيل
  PushNotifications.addListener('registrationError', (error) => {
    console.error('Error on registration: ' + JSON.stringify(error));
  });

  // عند استلام إشعار
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push notification received: ', notification);
    
    // عرض الإشعار في التطبيق
    showInAppNotification(notification);
  });

  // عند الضغط على الإشعار
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Push notification action performed', notification.actionId, notification.notification);
    
    // التنقل حسب نوع الإشعار
    handleNotificationAction(notification);
  });
}

/**
 * حفظ token الجهاز في قاعدة البيانات
 */
async function saveDeviceToken(token) {
  try {
    // Get user ID from Supabase auth session (wasel_user_id is deprecated/never set)
    const { supabase } = await import('@/lib/supabase');
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) return;

    // احفظ في localStorage مؤقتاً
    localStorage.setItem('wasel_device_token', token);
    
      // Detect current login role from admin_session in localStorage (set by resolveUserRole in App.jsx)
      let loginRole = 'user';
      try {
        const adminSession = JSON.parse(localStorage.getItem('admin_session') || 'null');
        if (adminSession?.role) {
          const r = String(adminSession.role).toLowerCase();
          if (['admin', 'supervisor', 'operator', 'support'].includes(r)) loginRole = r;
        }
      } catch (_) { /* ignore */ }

      // حفظ الـ token في جدول user_devices
      const platform = (window['Capacitor']?.isNativePlatform?.()) ? 'android' : 'web';

        const { data: existingDevice } = await supabase.from('user_devices')
          .select('id')
          .eq('fcm_token', token)
          .maybeSingle();

        if (existingDevice) {
           await supabase.from('user_devices').update({
             user_id: userId,
             is_active: true,
             login_role: loginRole,
             updated_at: new Date().toISOString()
           }).eq('id', existingDevice.id);
        } else {
           await supabase.from('user_devices').insert({
             user_id: userId,
             fcm_token: token,
             device_type: platform,
             is_active: true,
             login_role: loginRole,
             updated_at: new Date().toISOString()
           });
        }
        
        // Remove or deactivate this token from any OTHER users on this same device
        if (token) {
          await supabase.from('user_devices')
            .delete()
            .eq('fcm_token', token)
            .neq('user_id', userId);
        }

        console.log('Device token saved to DB:', token);
  } catch (error) {
      console.error('Error in saveDeviceToken:', error);
  }
}

/**
 * معالجة الضغط على الإشعار
 */
function handleNotificationAction(notification) {
  const data = notification.notification.data;
  
  // مثال: إذا كان إشعار طلب
  if (data.type === 'order') {
    window.location.href = `/Order?id=${data.orderId}`;
  }
  // إذا كان إشعار رسالة
  else if (data.type === 'message') {
    window.location.href = `/OrderChat?orderId=${data.orderId}`;
  }
}

/**
 * إرسال إشعار محلي (Local Notification)
 */
export async function sendLocalNotification(title, body, data = {}) {
  try {
    // Try native first if available
    if (isNativePlatform()) {
      try {
        const PushNotifications = await getPushNotificationsPlugin();
        if (PushNotifications) {
          await PushNotifications.createChannel({
            id: 'wasel_orders',
            name: 'Wasel Orders',
            description: 'Order notifications from Wasel',
            importance: 5,
            visibility: 1,
            sound: 'default',
            vibration: true
          });
        }
      } catch (channelError) {
        console.warn('Channel creation error:', channelError);
      }
    }
    
    // تعطيل إشعارات المتصفح نهائياً لمنع ReferenceError
    // if (typeof window !== 'undefined' && typeof window['Notification'] !== 'undefined' && window['Notification'].permission === 'granted') {
    //   new window['Notification'](title, {
    //     body: body,
    //     icon: '/icons/icon-192.png',
    //     badge: '/icons/icon-72.png',
    //     tag: 'wasel-notification',
    //     data: data
    //   });
    //   console.log('Browser notification sent:', title);
    // } else {
    //   console.log('Browser notifications not available or not permitted');
    // }
  } catch (error) {
    console.error('Error sending local notification:', error);
  }
}

/**
 * الحصول على جميع الإشعارات المعلقة
 */
export async function getPendingNotifications() {
  try {
    if (!isNativePlatform()) {
      return [];
    }
    const PushNotifications = await getPushNotificationsPlugin();
    if (!PushNotifications) {
      return [];
    }
    const notificationList = await PushNotifications.getDeliveredNotifications();
    console.log('Delivered notifications:', notificationList);
    return notificationList.notifications;
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
}

/**
 * مسح جميع الإشعارات
 */
export async function clearAllNotifications() {
  try {
    if (!isNativePlatform()) {
      return;
    }
    const PushNotifications = await getPushNotificationsPlugin();
    if (!PushNotifications) {
      return;
    }
    await PushNotifications.removeAllDeliveredNotifications();
    console.log('All notifications cleared');
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}
