/**
 * أمثلة استخدام نظام الإشعارات
 */

import { 
  initPushNotifications, 
  sendLocalNotification,
  getPendingNotifications,
  clearAllNotifications 
} from '@/lib/pushNotifications';

// =====================================================
// 1. تهيئة الإشعارات عند تسجيل الدخول
// =====================================================

// في src/App.jsx أو EmailOtpLogin.jsx بعد نجاح تسجيل الدخول:
async function onLoginSuccess() {
  // تهيئة الإشعارات
  const initialized = await initPushNotifications();
  
  if (initialized) {
    console.log('✅ Push notifications ready!');
  } else {
    console.log('❌ Push notifications failed');
  }
}


// =====================================================
// 2. إرسال إشعار محلي عند إنشاء طلب
// =====================================================

// في src/pages/Cart.jsx عند إنشاء طلب:
async function handleOrderCreated(orderId) {
  await sendLocalNotification(
    'تم إنشاء الطلب بنجاح! 🎉',
    'سيتم توصيل طلبك في أقرب وقت',
    { type: 'order', orderId: orderId }
  );
}


// =====================================================
// 3. إرسال إشعار عند تغيير حالة الطلب
// =====================================================

// دالة لإرسال إشعارات حسب حالة الطلب:
async function notifyOrderStatus(status, orderNumber) {
  const messages = {
    'pending': {
      title: '⏳ طلبك قيد المراجعة',
      body: `الطلب #${orderNumber} تحت المعالجة`
    },
    'confirmed': {
      title: '✅ تم تأكيد طلبك',
      body: `الطلب #${orderNumber} جاهز للتوصيل`
    },
    'on_the_way': {
      title: '🚗 طلبك في الطريق!',
      body: `السائق في طريقه إليك - الطلب #${orderNumber}`
    },
    'delivered': {
      title: '🎉 تم التوصيل بنجاح!',
      body: `شكراً لاستخدامك واصل - الطلب #${orderNumber}`
    },
    'cancelled': {
      title: '❌ تم إلغاء الطلب',
      body: `الطلب #${orderNumber} تم إلغاؤه`
    }
  };
  
  const notification = messages[status];
  if (notification) {
    await sendLocalNotification(
      notification.title,
      notification.body,
      { type: 'order_status', orderNumber, status }
    );
  }
}

// استخدام:
await notifyOrderStatus('on_the_way', '12345');


// =====================================================
// 4. إرسال إشعار عند استلام رسالة في الدردشة
// =====================================================

// في src/pages/OrderChat.jsx:
async function onNewMessage(message, senderName) {
  // لا ترسل إشعار إذا التطبيق مفتوح
  if (document.hidden) {
    await sendLocalNotification(
      `رسالة جديدة من ${senderName} 💬`,
      message.text,
      { type: 'message', orderId: message.orderId }
    );
  }
}


// =====================================================
// 5. إشعار تذكير بالعربة
// =====================================================

// تذكير المستخدم بالعربة إذا لم يكمل الطلب:
async function remindAboutCart() {
  const cart = JSON.parse(localStorage.getItem('wasel_cart') || '[]');
  
  if (cart.length > 0) {
    await sendLocalNotification(
      'لديك منتجات في العربة! 🛒',
      `${cart.length} منتج في انتظارك. أكمل طلبك الآن!`,
      { type: 'cart_reminder' }
    );
  }
}

// جدولة التذكير بعد 30 دقيقة:
setTimeout(remindAboutCart, 30 * 60 * 1000);


// =====================================================
// 6. إشعارات العروض والخصومات
// =====================================================

async function notifySpecialOffer(productName, discount) {
  await sendLocalNotification(
    `🔥 عرض خاص: خصم ${discount}%`,
    `احصل على ${productName} بسعر مخفض اليوم فقط!`,
    { type: 'offer', productName }
  );
}


// =====================================================
// 7. عرض جميع الإشعارات
// =====================================================

async function showNotificationHistory() {
  const notifications = await getPendingNotifications();
  console.log('All notifications:', notifications);
  
  // يمكن عرضها في صفحة خاصة
  return notifications;
}


// =====================================================
// 8. مسح الإشعارات
// =====================================================

async function clearNotifications() {
  await clearAllNotifications();
  console.log('Notifications cleared');
}


// =====================================================
// 9. تفعيل/تعطيل الإشعارات من الإعدادات
// =====================================================

// في src/pages/Settings.jsx:
async function toggleNotifications(enabled) {
  localStorage.setItem('wasel_notifications_enabled', enabled);
  
  if (enabled) {
    await initPushNotifications();
  } else {
    // تعطيل الإشعارات
    await clearAllNotifications();
  }
}


// =====================================================
// 10. جدولة إشعار في وقت محدد
// =====================================================

import { PushNotifications } from '@capacitor/push-notifications';

async function scheduleNotification(title, body, date) {
  await PushNotifications.schedule({
    notifications: [
      {
        title: title,
        body: body,
        id: Date.now(),
        schedule: { at: date },
        sound: 'default',
        smallIcon: 'ic_stat_icon_config_sample'
      }
    ]
  });
}

// مثال: إشعار بعد ساعة
const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);
await scheduleNotification(
  'تذكير: تتبع طلبك',
  'لا تنسى متابعة حالة طلبك',
  oneHourLater
);
