/**
 * 🔔 خدمة الإشعارات باستخدام OneSignal
 * بديل مجاني وسهل بدون Firebase
 * 
 * الإعداد:
 * 1. أنشئ حساب في onesignal.com
 * 2. أنشئ تطبيق جديد
 * 3. احصل على App ID
 * 4. ضعه في ONESIGNAL_APP_ID
 */

import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';

// ⚠️ ضع App ID الخاص بك من OneSignal Dashboard
const ONESIGNAL_APP_ID = 'YOUR_ONESIGNAL_APP_ID'; // غيّر هذا!

let OneSignal = null;
let playerId = null;

/**
 * تهيئة OneSignal
 */
export const initializeOneSignal = async () => {
  // OneSignal يعمل فقط على الجهاز الحقيقي
  if (!Capacitor.isNativePlatform()) {
    console.log('📱 OneSignal يعمل فقط على التطبيق الأصلي (APK)');
    return null;
  }

  try {
    // استيراد OneSignal ديناميكياً
    const OneSignalPlugin = await import('onesignal-cordova-plugin');
    OneSignal = OneSignalPlugin.default || window.plugins?.OneSignal;

    if (!OneSignal) {
      console.error('❌ OneSignal غير متوفر');
      return null;
    }

    // تهيئة OneSignal
    OneSignal.setAppId(ONESIGNAL_APP_ID);

    // طلب إذن الإشعارات
    OneSignal.promptForPushNotificationsWithUserResponse(function(accepted) {
      console.log("📱 إذن الإشعارات:", accepted ? "مقبول ✅" : "مرفوض ❌");
    });

    // الحصول على Player ID (معرف الجهاز)
    OneSignal.getDeviceState(function(state) {
      if (state && state.userId) {
        playerId = state.userId;
        console.log("🔑 OneSignal Player ID:", playerId);
        
        // حفظ في Supabase
        savePlayerIdToDatabase(playerId);
      }
    });

    // عند وصول إشعار والتطبيق مفتوح
    OneSignal.setNotificationWillShowInForegroundHandler(function(event) {
      const notification = event.getNotification();
      console.log("📬 إشعار جديد:", notification);
      
      // عرض الإشعار
      event.complete(notification);
    });

    // عند الضغط على الإشعار
    OneSignal.setNotificationOpenedHandler(function(event) {
      const notification = event.notification;
      const data = notification.additionalData || {};
      
      console.log("👆 تم الضغط على الإشعار:", notification);
      
      // التنقل حسب نوع الإشعار
      handleNotificationTap(data);
    });

    console.log('✅ تم تهيئة OneSignal بنجاح');
    return true;

  } catch (error) {
    console.error('❌ خطأ في تهيئة OneSignal:', error);
    return null;
  }
};

/**
 * حفظ Player ID في Supabase
 */
const savePlayerIdToDatabase = async (playerId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from('user_devices')
        .upsert({
          user_id: user.id,
          onesignal_player_id: playerId,
          platform: 'android',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (!error) {
        console.log('✅ تم حفظ Player ID في Supabase');
        return;
      }

      const conflictMissing = String(error?.message || '').toLowerCase().includes('on conflict')
        || String(error?.code || '') === '42P10';

      if (conflictMissing) {
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
              onesignal_player_id: playerId,
              platform: 'android',
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          if (updateError) {
            console.error('❌ خطأ في تحديث Player ID:', updateError);
            return;
          }
          console.log('✅ تم تحديث Player ID في Supabase (fallback)');
          return;
        }

        const { error: insertError } = await supabase
          .from('user_devices')
          .insert({
            user_id: user.id,
            onesignal_player_id: playerId,
            platform: 'android',
            is_active: true,
            updated_at: new Date().toISOString(),
          });
        if (insertError) {
          console.error('❌ خطأ في إدراج Player ID:', insertError);
          return;
        }
        console.log('✅ تم إدراج Player ID في Supabase (fallback)');
        return;
      }

      console.error('❌ خطأ في حفظ Player ID:', error);
    } else {
      // حفظ محلياً للاستخدام لاحقاً
      localStorage.setItem('onesignal_player_id', playerId);
    }
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
};

/**
 * معالجة الضغط على الإشعار
 */
const handleNotificationTap = (data) => {
  switch (data.type) {
    case 'order_update':
      window.location.href = `/Order?id=${data.order_id}`;
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
 * الحصول على Player ID الحالي
 */
export const getPlayerId = () => playerId;

/**
 * إرسال Tag للمستخدم (للتصنيف)
 */
export const setUserTags = (tags) => {
  if (OneSignal) {
    OneSignal.sendTags(tags);
    console.log('🏷️ تم إرسال Tags:', tags);
  }
};

/**
 * حذف Tag
 */
export const deleteUserTag = (tagKey) => {
  if (OneSignal) {
    OneSignal.deleteTag(tagKey);
  }
};

/**
 * تعيين External User ID (ربط بـ Supabase User ID)
 */
export const setExternalUserId = async (userId) => {
  if (OneSignal && userId) {
    OneSignal.setExternalUserId(userId);
    console.log('🔗 تم ربط User ID:', userId);
  }
};

/**
 * إلغاء الاشتراك
 */
export const unsubscribeFromNotifications = () => {
  if (OneSignal) {
    OneSignal.disablePush(true);
    console.log('🔕 تم إلغاء الاشتراك');
  }
};

/**
 * إعادة الاشتراك
 */
export const resubscribeToNotifications = () => {
  if (OneSignal) {
    OneSignal.disablePush(false);
    console.log('🔔 تم إعادة الاشتراك');
  }
};

export default {
  initializeOneSignal,
  getPlayerId,
  setUserTags,
  deleteUserTag,
  setExternalUserId,
  unsubscribeFromNotifications,
  resubscribeToNotifications
};
