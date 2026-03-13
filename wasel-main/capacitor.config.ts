import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wasel.app',
  appName: 'Wasel',
  webDir: 'dist',
  // ✅ تكوين الخادم للموبايل مع دعم PayPal Live
  server: {
    androidScheme: 'https',
    cleartext: false, // ✅ HTTPS فقط للـ production
    // ✅ دعم جميع الـ origins للدفع
    allowNavigation: [
      'www.paypal.com',
      'api-m.paypal.com',
      'www.wasel.life',
      'ofdqkracfqakbtjjmksa.supabase.co',
      'checkout.paypal.com'
    ]
  },
  plugins: {
    // ✅ HTTP Plugin لـ API calls الآمنة
    CapacitorHttp: {
      enabled: true
    },
    // ✅ Browser plugin للـ Redirect PayPal
    Browser: {
      enabled: true
    },
    // ✅ Push Notifications - عرض الإشعارات أثناء فتح التطبيق
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
