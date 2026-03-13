/**
 * 🔔 خدمة الإشعارات الحقيقية (Push Notifications)
 * تعمل حتى عندما يكون التطبيق مغلقاً
 */

import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// تخزين الـ token
let fcmToken = null;
let listenersSetup = false;
let webNotificationsChannel = null;
let webNotificationsPollTimer = null;
let webNotificationsLastSeenAt = null;
const webDeliveredNotificationIds = new Set();

const clearWebNotificationPolling = () => {
  if (webNotificationsPollTimer) {
    clearInterval(webNotificationsPollTimer);
    webNotificationsPollTimer = null;
  }
};

const requestBrowserNotificationPermission = async () => {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return await Notification.requestPermission();
  } catch (error) {
    console.warn('Browser notification permission warning:', error);
    return 'error';
  }
};

const showWebSystemNotification = async (title, body, link) => {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const permission = await requestBrowserNotificationPermission();
    if (permission !== 'granted') return;

    const notif = new Notification(title || 'اشعار جديد', {
      body: body || '',
      icon: '/logo/wasel-logo.png',
      badge: '/logo/wasel-logo.png',
      tag: `wasel-${Date.now()}`,
      renotify: false,
    });

    notif.onclick = () => {
      try {
        window.focus();
      } catch {}
      openNotificationLink(link || '/MyOrders');
      notif.close();
    };
  } catch (error) {
    console.warn('Web system notification warning:', error);
  }
};

const deliverWebNotification = async (row) => {
  if (!row) return;
  const title = row.title || 'اشعار جديد';
  const body = row.message || '';
  const link = row.link || '/MyOrders';

  // Visible in-app feedback even if browser-level notifications are blocked.
  try {
    toast.info(`${title}${body ? `\n${body}` : ''}`, {
      duration: 8000,
      action: {
        label: 'فتح',
        onClick: () => openNotificationLink(link),
      },
    });
  } catch (error) {
    console.warn('Toast notification warning:', error);
  }

  await showWebSystemNotification(title, body, link);
};

const openNotificationLink = (link) => {
  if (typeof window === 'undefined') return;
  if (link && typeof link === 'string') {
    window.location.href = link;
  }
};

const markDelivered = (id) => {
  if (!id) return;
  webDeliveredNotificationIds.add(String(id));
  // Prevent unbounded growth.
  if (webDeliveredNotificationIds.size > 300) {
    const first = webDeliveredNotificationIds.values().next().value;
    if (first) webDeliveredNotificationIds.delete(first);
  }
};

const wasDelivered = (id) => {
  if (!id) return false;
  return webDeliveredNotificationIds.has(String(id));
};

const resolvePublicUserId = async (authUserId) => {
  if (!authUserId) return null;
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .or(`auth_id.eq.${authUserId},id.eq.${authUserId}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('resolvePublicUserId warning:', error);
    return null;
  }

  return data?.id || null;
};

const setupWebNotifications = async () => {
  try {
    if (typeof window === 'undefined') return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      console.log('🌐 Web notifications: no authenticated user yet');
      return null;
    }

    const publicUserId = await resolvePublicUserId(user.id);
    if (!publicUserId) {
      console.log('🌐 Web notifications: public user id not found');
      return null;
    }

    if (webNotificationsChannel) {
      supabase.removeChannel(webNotificationsChannel);
      webNotificationsChannel = null;
    }

    clearWebNotificationPolling();

    const { data: latestRows } = await supabase
      .from('notifications')
      .select('created_at')
      .eq('user_id', publicUserId)
      .order('created_at', { ascending: false })
      .limit(1);

    webNotificationsLastSeenAt = latestRows?.[0]?.created_at || new Date().toISOString();

    webNotificationsChannel = supabase
      .channel(`web-notifications-${publicUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${publicUserId}`,
        },
        (payload) => {
          const row = payload?.new || {};
          if (wasDelivered(row.id)) return;

          markDelivered(row.id);
          if (row.created_at) webNotificationsLastSeenAt = row.created_at;

          deliverWebNotification(row).catch((error) => {
            console.warn('deliverWebNotification realtime warning:', error);
          });

        }
      )
      .subscribe();

    // Polling fallback in case Realtime is disabled/missed in environment.
    webNotificationsPollTimer = setInterval(async () => {
      try {
        let query = supabase
          .from('notifications')
          .select('id, title, message, link, created_at')
          .eq('user_id', publicUserId)
          .order('created_at', { ascending: true })
          .limit(20);

        if (webNotificationsLastSeenAt) {
          query = query.gt('created_at', webNotificationsLastSeenAt);
        }

        const { data, error } = await query;
        if (error) {
          console.warn('Web notifications polling warning:', error);
          return;
        }

        (data || []).forEach((row) => {
          if (wasDelivered(row.id)) return;
          markDelivered(row.id);
          if (row.created_at) webNotificationsLastSeenAt = row.created_at;

          deliverWebNotification(row).catch((error) => {
            console.warn('deliverWebNotification poll warning:', error);
          });
        });
      } catch (pollError) {
        console.warn('Web notifications polling exception:', pollError);
      }
    }, 10000);

    console.log('✅ تم تفعيل إشعارات الموقع (Realtime)');
    return true;
  } catch (error) {
    console.error('❌ خطأ في تفعيل إشعارات الموقع:', error);
    return null;
  }
};

/**
 * إعداد المستمعين للأحداث - يُستدعى فوراً عند تحميل الملف
 */
const setupListeners = () => {
  if (listenersSetup || !Capacitor.isNativePlatform()) return;
  
  console.log('📱 إعداد مستمعي الإشعارات...');
  listenersSetup = true;

  // عند الحصول على Token
  PushNotifications.addListener('registration', async (token) => {
    console.log('🔑 FCM Token:', token.value);
    fcmToken = token.value;
    
    // حفظ الـ token في Supabase لإرسال الإشعارات لاحقاً
    await saveTokenToDatabase(token.value);
  });

  // عند فشل التسجيل
  PushNotifications.addListener('registrationError', (error) => {
    console.error('❌ خطأ في التسجيل:', error);
  });

  // عند وصول إشعار والتطبيق مفتوح (Foreground)
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('📬 إشعار جديد (foreground):', notification);
    // عرض إشعار داخلي عندما يكون التطبيق مفتوح
    const title = notification.title || 'إشعار جديد';
    const body = notification.body || '';
    const data = notification.data || {};
    try {
      toast.info(`${title}${body ? `\n${body}` : ''}`, {
        duration: 6000,
        action: data?.order_id ? {
          label: 'عرض',
          onClick: () => handleNotificationTap({ data }),
        } : undefined,
      });
    } catch (e) {
      console.warn('Foreground toast warning:', e);
    }
  });

  // عند الضغط على الإشعار
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('👆 تم الضغط على الإشعار:', action);
    handleNotificationTap(action.notification);
  });
  
  console.log('✅ تم إعداد مستمعي الإشعارات بنجاح');
};

// ⚡ إعداد المستمعين فوراً عند تحميل الملف (مهم جداً!)
setupListeners();

/**
 * تهيئة الإشعارات
 */
export const initializePushNotifications = async () => {
  // تأكد أننا على جهاز حقيقي (ليس متصفح)
  if (!Capacitor.isNativePlatform()) {
    console.log('🌐 تفعيل إشعارات الموقع عبر Realtime');
    return setupWebNotifications();
  }

  try {
    // تأكد من إعداد المستمعين
    setupListeners();
    
    // 1️⃣ طلب الإذن من المستخدم
    const permissionStatus = await PushNotifications.requestPermissions();
    
    if (permissionStatus.receive !== 'granted') {
      console.log('❌ المستخدم رفض الإشعارات');
      return null;
    }

    console.log('✅ تم قبول إذن الإشعارات');

    // 2️⃣ التسجيل للحصول على Token
    await PushNotifications.register();

    // If token was generated before login, ensure it gets synced once user is authenticated.
    await syncCachedTokenIfPossible();

    return true;
  } catch (error) {
    console.error('❌ خطأ في تهيئة الإشعارات:', error);
    return null;
  }
};

const syncCachedTokenIfPossible = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;

    const cachedToken = fcmToken || localStorage.getItem('fcm_token');
    if (!cachedToken) return;

    await saveTokenToDatabase(cachedToken);
  } catch (error) {
    console.warn('syncCachedTokenIfPossible warning:', error);
  }
};

const deactivateTokenForOtherUsers = async (token, activeUserId) => {
  // Skipped: RLS prevents updating other users' rows from client.
  // The edge function uses service_role key and handles stale tokens.
};

/**
 * حفظ Token في قاعدة البيانات
 */
const saveTokenToDatabase = async (token) => {
  try {
    // الحصول على معرف المستخدم الحالي (إذا كان مسجل دخول)
    const { data: { user } } = await supabase.auth.getUser();
    const detectedPlatform = Capacitor.isNativePlatform() ? 'android' : 'web';
    
    if (user) {
      // تحديث أو إضافة الـ token (unique index on user_id only)
      const { error } = await supabase
        .from('user_devices')
        .upsert({
          user_id: user.id,
          fcm_token: token,
          platform: detectedPlatform,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (!error) {
        console.log('✅ تم حفظ Token في قاعدة البيانات (platform:', detectedPlatform, ')');
        localStorage.removeItem('fcm_token');
        return;
      }
      console.warn('⚠️ Upsert token error:', error.code, error.message);

      // Fallback: SELECT → UPDATE or INSERT
      const { data: existing, error: selectError } = await supabase
        .from('user_devices')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (selectError) {
        console.error('❌ خطأ في قراءة user_devices:', selectError);
        return;
      }

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from('user_devices')
          .update({
            fcm_token: token,
            platform: detectedPlatform,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (updateError) {
          console.error('❌ خطأ في تحديث Token:', updateError);
          return;
        }
        console.log('✅ تم تحديث Token في قاعدة البيانات (fallback update)');
        localStorage.removeItem('fcm_token');
        return;
      }

      const { error: insertError } = await supabase
        .from('user_devices')
        .insert({
          user_id: user.id,
          fcm_token: token,
          platform: detectedPlatform,
          is_active: true,
          updated_at: new Date().toISOString(),
        });
      if (insertError) {
        console.error('❌ خطأ في إدراج Token:', insertError);
        return;
      }
      console.log('✅ تم إدراج Token في قاعدة البيانات (fallback insert)');
      localStorage.removeItem('fcm_token');
      return;
    } else {
      // حفظ في localStorage للاستخدام لاحقاً
      localStorage.setItem('fcm_token', token);
    }
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
};

/**
 * عرض إشعار داخل التطبيق
 */
const showInAppNotification = (notification) => {
  // Notifications disabled - no popup shown
};

/**
 * معالجة الضغط على الإشعار
 */
const handleNotificationTap = (notification) => {
  const data = notification.data || {};
  
  // Admin/supervisor: navigate to SupervisorPanel for order-related events
  if (data.order_id && ['new_order_created', 'order_assigned'].includes(data.event)) {
    window.location.href = '/SupervisorPanel';
    return;
  }

  // Regular user: navigate to the specific order
  if (data.order_id) {
    window.location.href = `/TrackOrder?order=${data.order_id}`;
    return;
  }

  switch (data.type) {
    case 'order_update':
      window.location.href = '/MyOrders';
      break;
    case 'promotion':
      window.location.href = '/offers';
      break;
    case 'new_restaurant':
      window.location.href = `/restaurant/${data.restaurant_id}`;
      break;
    default:
      window.location.href = '/';
  }
};

/**
 * الحصول على الـ Token الحالي
 */
export const getFCMToken = () => fcmToken;

export const deactivateCurrentDeviceToken = async () => {
  try {
    const token = fcmToken || localStorage.getItem('fcm_token');
    if (!token) return;
    await supabase
      .from('user_devices')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('fcm_token', token);
  } catch (error) {
    console.warn('deactivateCurrentDeviceToken warning:', error);
  }
};

/**
 * إلغاء الاشتراك في الإشعارات
 */
export const unregisterPushNotifications = async () => {
  if (Capacitor.isNativePlatform()) {
    await PushNotifications.unregister();
    fcmToken = null;
    console.log('🔕 تم إلغاء الاشتراك في الإشعارات');
    return;
  }

  if (webNotificationsChannel) {
    supabase.removeChannel(webNotificationsChannel);
    webNotificationsChannel = null;
  }

  clearWebNotificationPolling();
};

export default {
  initializePushNotifications,
  getFCMToken,
  deactivateCurrentDeviceToken,
  unregisterPushNotifications
};
