/**
 * Animation Presets
 * ═════════════════════════════════════════════════════════════════════════
 * إعدادات مسبقة للأنيميشنات المختلفة مع معايير الحجم والتوقيت المثلى
 */

export const ANIMATION_PRESETS = {
  // محفظة - عند إضافة أموال
  walletAddMoney: {
    path: '/animitions/wallet-coins-drop.json',
    width: 120,
    height: 120,
    loop: false,
    trigger: 'immediate',
    duration: 2000,
  },

  // إشعارات - زر الجرس
  notificationBell: {
    path: '/animitions/notification-bell.json',
    width: 32,
    height: 32,
    loop: true,
    trigger: 'immediate',
    speed: 1.2,
  },

  // تحميل الصفحة
  pageLoading: {
    path: '/animitions/page-loading.json',
    width: 80,
    height: 80,
    loop: true,
    trigger: 'immediate',
    hideWhenDone: false,
  },

  // معالجة الدفع
  paymentProcessing: {
    path: '/animitions/payment-processing.json',
    width: 100,
    height: 100,
    loop: true,
    trigger: 'immediate',
  },

  // تم تطبيق كود الخصم
  couponApplied: {
    path: '/animitions/coupon-applied.json',
    width: 80,
    height: 80,
    loop: false,
    trigger: 'immediate',
    hideWhenDone: true,
  },

  // إضافة للسلة بنجاح
  addToCartSuccess: {
    path: '/animitions/add-to-cart-pop.json',
    width: 100,
    height: 100,
    loop: false,
    trigger: 'immediate',
    hideWhenDone: true,
    duration: 1500,
  },

  // الإعجاب بالمنتج
  heartBurst: {
    path: '/animitions/heart-burst.json',
    width: 100,
    height: 100,
    loop: false,
    trigger: 'onClick',
    hideWhenDone: true,
  },

  // اكتمال الطلب بنجاح
  orderSuccess: {
    path: '/animitions/order-success.json',
    width: 150,
    height: 150,
    loop: false,
    trigger: 'immediate',
    duration: 3000,
  },

  // نجاح الدفع
  paymentSuccess: {
    path: '/animitions/order-success.json',
    width: 150,
    height: 150,
    loop: false,
    trigger: 'immediate',
    hideWhenDone: true,
    duration: 2500,
  },

  // عضوية VIP/بريميوم
  premiumCrown: {
    path: '/animitions/premium-crown.json',
    width: 100,
    height: 100,
    loop: true,
    trigger: 'immediate',
    speed: 0.8,
  },

  // حالات الطلب
  statusCooking: {
    path: '/animitions/status-cooking.json',
    width: 60,
    height: 60,
    loop: true,
    trigger: 'immediate',
    speed: 1.1,
  },

  statusPending: {
    path: '/animitions/status-pending.json',
    width: 60,
    height: 60,
    loop: true,
    trigger: 'immediate',
  },

  statusDelivering: {
    path: '/animitions/status-delivering.json',
    width: 60,
    height: 60,
    loop: true,
    trigger: 'immediate',
    speed: 1.2,
  },

  // سلة فارغة
  emptyCart: {
    path: '/animitions/empty-cart.json',
    width: 150,
    height: 150,
    loop: 'once',
    trigger: 'immediate',
  },

  // لا توجد طلبات
  emptyOrders: {
    path: '/animitions/empty-orders.json',
    width: 150,
    height: 150,
    loop: 'once',
    trigger: 'immediate',
  },
};

/**
 * حساب حجم الأنيميشن بناءً على حجم الشاشة
 * بدون تكبير مفرط على الشاشات الكبيرة
 */
export const getResponsiveAnimationSize = (baseSize) => {
  const width = window.innerWidth;
  if (width < 640) {
    return Math.round(baseSize * 0.8); // 80% على الموبايل
  }
  if (width < 1024) {
    return baseSize; // كما هي على الأجهزة اللوحية
  }
  return Math.round(baseSize * 1.1); // 110% على سطح المكتب (أقصى)
};

/**
 * إنشاء اتحاد الأنيميشنات مع Framer Motion
 * للعب أنيميشن عند حدث معين
 */
export const animationVariants = {
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: 0.3, type: 'spring', stiffness: 300, damping: 30 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
    transition: { duration: 0.3 },
  },
  bounce: {
    animate: {
      y: [0, -10, 0],
      transition: { duration: 0.6, repeat: Infinity },
    },
  },
};
