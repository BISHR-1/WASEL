/**
 * نظام الترجمة الشامل للتطبيق
 * Comprehensive Translation System
 */

export const translations = {
  // Navigation & Common
  home: { ar: 'الرئيسية', en: 'Home' },
  restaurants: { ar: 'المطاعم', en: 'Restaurants' },
  gifts: { ar: 'الهدايا', en: 'Gifts' },
  packages: { ar: 'الباقات', en: 'Packages' },
  electronics: { ar: 'الإلكترونيات', en: 'Electronics' },
  supermarket: { ar: 'السوبرماركت', en: 'Supermarket' },
  sweets: { ar: 'الحلويات', en: 'Sweets' },
  cart: { ar: 'السلة', en: 'Cart' },
  account: { ar: 'الحساب', en: 'Account' },
  profile: { ar: 'الملف الشخصي', en: 'Profile' },
  
  // Auth
  login: { ar: 'تسجيل الدخول', en: 'Login' },
  signup: { ar: 'إنشاء حساب', en: 'Sign Up' },
  logout: { ar: 'تسجيل الخروج', en: 'Logout' },
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  password: { ar: 'كلمة المرور', en: 'Password' },
  forgotPassword: { ar: 'نسيت كلمة المرور؟', en: 'Forgot Password?' },
  alreadyHaveAccount: { ar: 'لدي حساب', en: 'I have an account' },
  dontHaveAccount: { ar: 'ليس لدي حساب', en: "Don't have an account" },
  
  // Products
  addToCart: { ar: 'أضف للسلة', en: 'Add to Cart' },
  addToFavorites: { ar: 'أضف للمفضلة', en: 'Add to Favorites' },
  removeFromFavorites: { ar: 'إزالة من المفضلة', en: 'Remove from Favorites' },
  price: { ar: 'السعر', en: 'Price' },
  description: { ar: 'الوصف', en: 'Description' },
  quantity: { ar: 'الكمية', en: 'Quantity' },
  
  // Cart
  emptyCart: { ar: 'السلة فارغة', en: 'Cart is Empty' },
  subtotal: { ar: 'المجموع الفرعي', en: 'Subtotal' },
  deliveryFee: { ar: 'رسوم التوصيل', en: 'Delivery Fee' },
  total: { ar: 'المجموع', en: 'Total' },
  checkout: { ar: 'إتمام الطلب', en: 'Checkout' },
  removeItem: { ar: 'إزالة', en: 'Remove' },
  
  // Order
  orderDetails: { ar: 'تفاصيل الطلب', en: 'Order Details' },
  orderNumber: { ar: 'رقم الطلب', en: 'Order Number' },
  orderStatus: { ar: 'حالة الطلب', en: 'Order Status' },
  pending: { ar: 'قيد الانتظار', en: 'Pending' },
  confirmed: { ar: 'مؤكد', en: 'Confirmed' },
  preparing: { ar: 'قيد التجهيز', en: 'Preparing' },
  onTheWay: { ar: 'في الطريق', en: 'On the Way' },
  delivered: { ar: 'تم التوصيل', en: 'Delivered' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
  
  // Profile
  myOrders: { ar: 'طلباتي', en: 'My Orders' },
  myFavorites: { ar: 'مفضلاتي', en: 'My Favorites' },
  myAddresses: { ar: 'عناويني', en: 'My Addresses' },
  settings: { ar: 'الإعدادات', en: 'Settings' },
  notifications: { ar: 'الإشعارات', en: 'Notifications' },
  
  // Settings
  language: { ar: 'اللغة', en: 'Language' },
  darkMode: { ar: 'الوضع الليلي', en: 'Dark Mode' },
  enableNotifications: { ar: 'تفعيل الإشعارات', en: 'Enable Notifications' },
  appVersion: { ar: 'إصدار التطبيق', en: 'App Version' },
  
  // Address
  addAddress: { ar: 'إضافة عنوان', en: 'Add Address' },
  editAddress: { ar: 'تعديل العنوان', en: 'Edit Address' },
  deleteAddress: { ar: 'حذف العنوان', en: 'Delete Address' },
  addressLabel: { ar: 'اسم العنوان', en: 'Address Label' },
  street: { ar: 'الشارع', en: 'Street' },
  building: { ar: 'رقم المبنى', en: 'Building Number' },
  floor: { ar: 'الطابق', en: 'Floor' },
  notes: { ar: 'ملاحظات', en: 'Notes' },
  
  // Payment
  payment: { ar: 'الدفع', en: 'Payment' },
  payWithPayPal: { ar: 'الدفع عبر PayPal', en: 'Pay with PayPal' },
  completeViaWhatsApp: { ar: 'إكمال عبر واتساب', en: 'Complete via WhatsApp' },
  paymentSuccess: { ar: 'تم الدفع بنجاح', en: 'Payment Successful' },
  paymentFailed: { ar: 'فشل الدفع', en: 'Payment Failed' },
  
  // Pages
  howItWorks: { ar: 'كيف نعمل', en: 'How It Works' },
  whyWasel: { ar: 'لماذا واصل ستور', en: 'Why Wasel Store' },
  termsAndConditions: { ar: 'الشروط والأحكام', en: 'Terms & Conditions' },
  transparency: { ar: 'الشفافية', en: 'Transparency' },
  contact: { ar: 'تواصل معنا', en: 'Contact Us' },
  
  // Messages
  welcomeBack: { ar: 'مرحباً بعودتك!', en: 'Welcome Back!' },
  addedToCart: { ar: 'تمت الإضافة للسلة', en: 'Added to Cart' },
  addedToFavorites: { ar: 'تمت الإضافة للمفضلة', en: 'Added to Favorites' },
  removedFromFavorites: { ar: 'تمت الإزالة من المفضلة', en: 'Removed from Favorites' },
  orderPlaced: { ar: 'تم إنشاء الطلب', en: 'Order Placed' },
  error: { ar: 'حدث خطأ', en: 'An Error Occurred' },
  success: { ar: 'نجح!', en: 'Success!' },
  confirm: { ar: 'تأكيد', en: 'Confirm' },
  cancel: { ar: 'إلغاء', en: 'Cancel' },
  save: { ar: 'حفظ', en: 'Save' },
  edit: { ar: 'تعديل', en: 'Edit' },
  delete: { ar: 'حذف', en: 'Delete' },
  search: { ar: 'بحث', en: 'Search' },
  filter: { ar: 'تصفية', en: 'Filter' },
  sort: { ar: 'ترتيب', en: 'Sort' },
  
  // Support Chat
  supportChat: { ar: 'دعم واصل ستور', en: 'Wasel Store Support' },
  askQuestion: { ar: 'اسأل سؤالك...', en: 'Ask your question...' },
  send: { ar: 'إرسال', en: 'Send' },
  
  // Wasel Tagline
  waselTagline: { ar: 'نوصّل حبك لحد الباب 💙', en: 'Delivering love to your doorstep 💙' },
  
  // Common phrases
  loading: { ar: 'جاري التحميل...', en: 'Loading...' },
  noResults: { ar: 'لا توجد نتائج', en: 'No Results' },
  tryAgain: { ar: 'حاول مرة أخرى', en: 'Try Again' },
  back: { ar: 'رجوع', en: 'Back' },
  next: { ar: 'التالي', en: 'Next' },
  previous: { ar: 'السابق', en: 'Previous' },
  viewAll: { ar: 'عرض الكل', en: 'View All' },
  viewDetails: { ar: 'عرض التفاصيل', en: 'View Details' },
  
  // Numbers & Currency
  syp: { ar: 'ل.س', en: 'SYP' },
  usd: { ar: 'دولار', en: 'USD' },
  items: { ar: 'عناصر', en: 'items' },
  item: { ar: 'عنصر', en: 'item' },

  // Restaurant specific translations
  restaurants_subtitle: { ar: 'اكتشف أفضل المطاعم القريبة منك', en: 'Discover the best restaurants near you' },
  search_restaurant_placeholder: { ar: 'ابحث عن مطعم...', en: 'Search for a restaurant...' },
  cuisine_type: { ar: 'نوع المطبخ', en: 'Cuisine type' },
  all_types: { ar: 'جميع الأنواع', en: 'All types' },
  view_menu: { ar: 'عرض القائمة', en: 'View menu' }
};

/**
 * الحصول على الترجمة
 */
export function translate(key, language = 'ar') {
  if (!translations[key]) {
    console.warn(`Translation missing for key: ${key}`);
    return key;
  }
  return translations[key][language] || translations[key]['ar'] || key;
}

/**
 * ترجمة النصوص الديناميكية باستخدام Web Translation API (مجاني)
 */
export async function translateText(text, targetLang = 'en') {
  // للنصوص القصيرة، نستخدم ترجمة بسيطة
  if (text.length < 3) return text;
  
  try {
    // استخدام Google Translate API (بدون key للاستخدام البسيط)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }
    
    return text;
  } catch (error) {
    console.warn('Translation failed:', error);
    return text;
  }
}

/**
 * ترجمة نص مع cache
 */
const translationCache = {};

export async function getCachedTranslation(text, targetLang = 'en') {
  const cacheKey = `${text}_${targetLang}`;
  
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }
  
  const translated = await translateText(text, targetLang);
  translationCache[cacheKey] = translated;
  
  return translated;
}
