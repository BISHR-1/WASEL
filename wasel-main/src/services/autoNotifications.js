/**
 * 🔔 نظام الإشعارات التلقائية
 * Auto Notifications System
 * 
 * يرسل إشعارات تلقائية بناءً على سلوك المستخدم
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// تخزين معرفات المؤقتات
const timers = {
  cartReminder: null,
  browsingReminder: null,
  dailyOffer: null
};

// رسائل الإشعارات - عشوائية وجذابة
const CART_REMINDER_MESSAGES = [
  {
    title: '🛒 سلتك تنتظرك!',
    body: 'لديك منتجات رائعة في السلة، لا تدعها تفوتك!'
  },
  {
    title: '⏰ لا تنسَ طلبك!',
    body: 'منتجاتك المفضلة لا تزال في السلة، أكمل الطلب الآن!'
  },
  {
    title: '🎁 عرض خاص لك!',
    body: 'أكمل طلبك الآن واحصل على توصيل سريع!'
  },
  {
    title: '💫 سلتك تشتاق إليك!',
    body: 'المنتجات التي اخترتها بانتظارك، هيا أكمل الطلب!'
  },
  {
    title: '🚀 طلبك على بعد خطوة!',
    body: 'لديك منتجات في السلة، أكمل الدفع واستلم طلبك!'
  }
];

const WELCOME_BACK_MESSAGES = [
  {
    title: '👋 مرحباً بعودتك!',
    body: 'اشتقنالك! تفقد أحدث العروض والمنتجات الجديدة'
  },
  {
    title: '🌟 أهلاً بك من جديد!',
    body: 'اكتشف عروضنا الحصرية اليوم!'
  },
  {
    title: '💚 واصل ستور يرحب بك!',
    body: 'لدينا منتجات جديدة وعروض مميزة بانتظارك'
  }
];

const DAILY_OFFER_MESSAGES = [
  {
    title: '🔥 عرض اليوم!',
    body: 'خصومات حصرية لفترة محدودة، لا تفوتها!'
  },
  {
    title: '⭐ صفقة اليوم المميزة!',
    body: 'اكتشف عروضنا الخاصة لهذا اليوم'
  },
  {
    title: '🎉 عروض لا تُقاوم!',
    body: 'تخفيضات رائعة على منتجاتك المفضلة'
  }
];

/**
 * الحصول على رسالة عشوائية
 */
const getRandomMessage = (messages) => {
  return messages[Math.floor(Math.random() * messages.length)];
};

/**
 * إرسال إشعار محلي
 */
const sendLocalNotification = async (id, title, body, data = {}) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('📱 Local notifications work only on native platforms');
    return;
  }

  try {
    // طلب الإذن أولاً
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== 'granted') {
      console.log('❌ Local notification permission not granted');
      return;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: id,
          title: title,
          body: body,
          schedule: { at: new Date(Date.now() + 1000) }, // بعد ثانية
          sound: 'default',
          channelId: 'wasel_notifications',
          extra: data
        }
      ]
    });
    
    console.log('✅ Local notification scheduled:', title);
  } catch (error) {
    console.error('❌ Error sending local notification:', error);
  }
};

/**
 * 🛒 تذكير السلة المتروكة
 * يُرسل بعد 30 دقيقة من إضافة منتج للسلة بدون إكمال الشراء
 */
export const startCartReminderTimer = () => {
  // إلغاء المؤقت السابق إن وجد
  if (timers.cartReminder) {
    clearTimeout(timers.cartReminder);
  }

  // جدولة التذكير بعد 30 دقيقة
  timers.cartReminder = setTimeout(async () => {
    const cart = JSON.parse(localStorage.getItem('wasel_cart') || '[]');
    
    if (cart.length > 0) {
      const message = getRandomMessage(CART_REMINDER_MESSAGES);
      const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
      
      await sendLocalNotification(
        1001,
        message.title,
        `${message.body} (${totalItems} منتج في السلة)`,
        { type: 'cart_reminder', action: 'open_cart' }
      );
    }
  }, 30 * 60 * 1000); // 30 دقيقة
  
  console.log('⏰ Cart reminder timer started (30 min)');
};

/**
 * 🛒 تذكير السلة بعد ساعة
 */
export const startExtendedCartReminder = () => {
  setTimeout(async () => {
    const cart = JSON.parse(localStorage.getItem('wasel_cart') || '[]');
    
    if (cart.length > 0) {
      await sendLocalNotification(
        1002,
        '😢 منتجاتك وحيدة!',
        'سلة التسوق تنتظرك منذ وقت طويل، لا تتركها!',
        { type: 'cart_reminder_extended', action: 'open_cart' }
      );
    }
  }, 60 * 60 * 1000); // ساعة واحدة
};

/**
 * ✅ إلغاء مؤقت السلة (عند إكمال الشراء)
 */
export const cancelCartReminder = () => {
  if (timers.cartReminder) {
    clearTimeout(timers.cartReminder);
    timers.cartReminder = null;
    console.log('🛑 Cart reminder cancelled');
  }
};

/**
 * 👋 إشعار الترحيب بالعودة
 * يُرسل عندما يعود المستخدم بعد غياب 24 ساعة
 */
export const checkWelcomeBackNotification = async () => {
  const lastVisit = localStorage.getItem('wasel_last_visit');
  const now = Date.now();
  
  if (lastVisit) {
    const hoursSinceLastVisit = (now - parseInt(lastVisit)) / (1000 * 60 * 60);
    
    // إذا مر أكثر من 24 ساعة
    if (hoursSinceLastVisit > 24) {
      const message = getRandomMessage(WELCOME_BACK_MESSAGES);
      await sendLocalNotification(
        1003,
        message.title,
        message.body,
        { type: 'welcome_back', action: 'open_home' }
      );
    }
  }
  
  // تحديث وقت الزيارة
  localStorage.setItem('wasel_last_visit', now.toString());
};

/**
 * 🎁 إشعار العرض اليومي
 * يُرسل مرة واحدة يومياً في وقت محدد
 */
export const scheduleDailyOfferNotification = async () => {
  const lastDailyNotification = localStorage.getItem('wasel_last_daily_offer');
  const today = new Date().toDateString();
  
  // إذا لم يُرسل اليوم بعد
  if (lastDailyNotification !== today) {
    // جدولة بعد 2 ساعة من فتح التطبيق (أو وقت مناسب)
    setTimeout(async () => {
      const message = getRandomMessage(DAILY_OFFER_MESSAGES);
      await sendLocalNotification(
        1004,
        message.title,
        message.body,
        { type: 'daily_offer', action: 'open_offers' }
      );
      
      localStorage.setItem('wasel_last_daily_offer', today);
    }, 2 * 60 * 60 * 1000); // بعد ساعتين
  }
};

/**
 * 📦 إشعار تأكيد الطلب
 */
export const notifyOrderConfirmed = async (orderNumber) => {
  await sendLocalNotification(
    2001,
    '✅ تم تأكيد طلبك!',
    `طلب رقم #${orderNumber} تم تأكيده وجاري تجهيزه`,
    { type: 'order_confirmed', orderId: orderNumber }
  );
};

/**
 * 🚗 إشعار الطلب في الطريق
 */
export const notifyOrderOnTheWay = async (orderNumber) => {
  await sendLocalNotification(
    2002,
    '🚗 طلبك في الطريق!',
    `المندوب في طريقه إليك بطلب رقم #${orderNumber}`,
    { type: 'order_on_way', orderId: orderNumber }
  );
};

/**
 * 🎉 إشعار تم التوصيل
 */
export const notifyOrderDelivered = async (orderNumber) => {
  await sendLocalNotification(
    2003,
    '🎉 تم توصيل طلبك!',
    `طلب رقم #${orderNumber} وصل بنجاح. نتمنى أن تستمتع به!`,
    { type: 'order_delivered', orderId: orderNumber }
  );
};

/**
 * ⭐ تذكير بتقييم الطلب (بعد التوصيل بـ 2 ساعة)
 */
export const scheduleRatingReminder = (orderNumber) => {
  setTimeout(async () => {
    await sendLocalNotification(
      3001,
      '⭐ قيّم تجربتك!',
      'نود سماع رأيك عن طلبك الأخير، ساعدنا نتحسن!',
      { type: 'rating_reminder', orderId: orderNumber }
    );
  }, 2 * 60 * 60 * 1000); // بعد ساعتين
};

/**
 * 💰 إشعار نقاط الولاء
 */
export const notifyLoyaltyPoints = async (points) => {
  await sendLocalNotification(
    4001,
    '🎁 ربحت نقاط!',
    `حصلت على ${points} نقطة، استمر بالتسوق لتجمع المزيد!`,
    { type: 'loyalty_points' }
  );
};

/**
 * 🔥 إشعار منتج نفد وعاد
 */
export const notifyProductBackInStock = async (productName) => {
  await sendLocalNotification(
    5001,
    '🔔 المنتج متوفر الآن!',
    `"${productName}" عاد للمخزون، اطلبه قبل نفاده!`,
    { type: 'back_in_stock', productName }
  );
};

/**
 * 🎂 إشعار عيد ميلاد
 */
export const notifyBirthday = async (userName) => {
  await sendLocalNotification(
    6001,
    '🎂 عيد ميلاد سعيد!',
    `كل عام وأنت بخير ${userName}! لك هدية خاصة بانتظارك في التطبيق`,
    { type: 'birthday' }
  );
};

/**
 * 🚀 تهيئة نظام الإشعارات التلقائية
 */
export const initAutoNotifications = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('📱 Auto notifications: Browser mode - limited functionality');
    return;
  }

  try {
    // طلب إذن الإشعارات المحلية
    const permission = await LocalNotifications.requestPermissions();
    
    if (permission.display === 'granted') {
      console.log('✅ Local notifications permission granted');
      
      // إعداد المستمع للضغط على الإشعارات
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('👆 Local notification tapped:', notification);
        handleNotificationAction(notification.notification.extra);
      });
      
      // تشغيل الفحوصات
      await checkWelcomeBackNotification();
      await scheduleDailyOfferNotification();
      
      console.log('✅ Auto notifications system initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing auto notifications:', error);
  }
};

/**
 * معالجة الضغط على الإشعار
 */
const handleNotificationAction = (data) => {
  if (!data) return;
  
  switch (data.action) {
    case 'open_cart':
      window.location.href = '/Cart';
      break;
    case 'open_home':
      window.location.href = '/Home';
      break;
    case 'open_offers':
      window.location.href = '/Offers';
      break;
    case 'open_order':
      if (data.orderId) {
        window.location.href = `/Order?id=${data.orderId}`;
      }
      break;
    default:
      window.location.href = '/Home';
  }
};

export default {
  initAutoNotifications,
  startCartReminderTimer,
  cancelCartReminder,
  notifyOrderConfirmed,
  notifyOrderOnTheWay,
  notifyOrderDelivered,
  notifyLoyaltyPoints
};
