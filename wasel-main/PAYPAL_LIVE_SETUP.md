# 🚀 دليل إعداد PayPal Live وربط Supabase + Android

## 📋 المتطلبات قبل البدء

### 1. PayPal Business Account
- ✅ حساب PayPal Business
- ✅ رابط للـ Dashboard: https://developer.paypal.com/dashboard/

### 2. Supabase Setup
- ✅ Supabase Project يعمل
- ✅ Supabase Functions مفعلة

### 3. Android Studio
- ✅ Android Studio مثبت
- ✅ Gradle مثبت

---

## 🔧 الخطوة 1: الحصول على Live PayPal Credentials

### أ. Log In إلى PayPal Developer
```
1. اذهب إلى: https://developer.paypal.com/dashboard/
2. Log in بحسابك Business
3. انتقل إلى: Apps & Credentials
4. اختر: Live (ليس Sandbox)
```

### ب. Copy الرموز السرية
```
📌 Client ID (Live)
📌 Secret (Live)

⚠️ احفظها بأمان - لا تشاركها مع أحد!
```

---

## 🌐 الخطوة 2: تحديث Supabase Environment Variables

### أ. اذهب إلى Supabase Dashboard
```
1. https://app.supabase.com/
2. اختر مشروع wasel
3. Settings → Functions → Environment Variables
```

### ب. أضف/حدّث المتغيرات
```bash
# ضع الـ Live Credentials هنا
PAYPAL_CLIENT_ID = <your-live-client-id>
PAYPAL_CLIENT_SECRET = <your-live-client-secret>
PAYPAL_ENV = live
PAYPAL_ALLOWED_ORIGIN = https://www.wasel.life
```

### مثال من Supabase Console
```
Key: PAYPAL_ENV
Value: live

Key: PAYPAL_CLIENT_ID
Value: AQxxxxxxxxxxxxx...

Key: PAYPAL_CLIENT_SECRET
Value: EJxxxxxxxxxxxxx...
```

---

## 📝 الخطوة 3: التحقق من Supabase Functions

### أ. فحص create-paypal-order Function
```bash
cd wasel-main
supabase functions list

# يجب أن تجد:
# ✅ create-paypal-order
# ✅ create-paypal-payment
# ✅ capture-paypal-payment
```

### ب. التأكد من أن Function يستخدم البيئة الصحيحة
```typescript
// الملف: supabase/functions/create-paypal-order/index.ts
const PAYPAL_ENV = Deno.env.get('PAYPAL_ENV') || 'sandbox'
const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID')
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET')

// ✅ يجب أن يقرأ من البيئة الحقيقية
```

### ج. نشر الـ Function بأحدث كود
```bash
supabase functions deploy create-paypal-order
supabase functions deploy create-paypal-payment
supabase functions deploy capture-paypal-payment
```

---

## 🧪 الخطوة 4: اختبار على Sandbox أولاً (حذري)

### أ. استخدم Sandbox أولاً
```bash
# في Supabase:
PAYPAL_ENV = sandbox  # اختبر أولاً

# بطاقات اختبار PayPal:
Email: sb-xxxxx@personal.example.com
Password: test_password
```

### ب. اختبر في المتصفح
```bash
1. npm run dev
2. اذهب إلى http://localhost:5173
3. أضف منتج
4. اختر PayPal
5. استخدم بطاقة Sandbox test
6. تحقق من النجاح
```

### ج. فحص الـ Logs
```bash
supabase functions logs create-paypal-order

# يجب أن ترى:
✅ Payment successful
✅ Order created
✅ بدون أخطاء
```

---

## ✅ الخطوة 5: تفعيل Live Mode

### ⚠️ تحذير مهم!
```
لا تفعل Live Mode حتى تكون متأكداً من النجاح على Sandbox
```

### أ. تحديث إلى Live
```bash
# في Supabase Dashboard
PAYPAL_ENV = live  # ✅ نعم، هذا الآن حقيقي
```

### ب. أضف Return URLs إلى PayPal
```
في PayPal Developer Dashboard:

App Settings:
- Return URL: https://www.wasel.life/payment-success
- Cancel URL: https://www.wasel.life/cart?payment=cancelled
- Webhook URL: https://your-supabase-url/functions/v1/create-paypal-payment
```

---

## 📱 الخطوة 6: مزامنة مع Android Studio

### أ. فتح المشروع في Android Studio
```bash
1. File → Open
2. اختر: wasel-main/android/
3. انتظر Gradle sync
```

### ب. تحديث android/app/build.gradle
```gradle
android {
    defaultConfig {
        applicationId "com.wasel.app"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    // PayPal Checkout
    implementation 'com.paypal.checkout:android-sdk:0.10.+'
    
    // Supabase
    implementation 'io.github.supabase:gotrue-kt:<latest>'
}
```

### ج. تحديث ملف الـ WebView (Capacitor)
```typescript
// android/app/src/main/kotlin/MainActivity.kt

import com.getcapacitor.android.Bridge

public class MainActivity: BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // تفعيل CORS للـ PayPal
        bridge.webView.settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        
        // تفعيل JavaScript
        bridge.webView.settings.javaScriptEnabled = true
    }
}
```

### د. تحديث capacitor.config.ts
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wasel.app',
  appName: 'Wasel',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false // ✅ HTTPS فقط للـ Live
  },
  plugins: {
    WebView: {
      allowFileAccess: false,
      allowUniversalAccessFromFileURLs: false,
    }
  }
};

export default config;
```

### هـ. تحديث android/app/src/main/AndroidManifest.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest ...>
    <!-- PayPal URLs -->
    <queries>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="https" />
        </intent>
    </queries>

    <application ...>
        <!-- PayPal Intent Handler -->
        <activity
            android:name="com.paypal.checkout.RedirectActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="www.wasel.life" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### و. بناء APK
```bash
cd android
./gradlew assembleRelease

# سيتم إنشاء:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔗 الخطوة 7: ربط الـ Frontend بـ Supabase Functions

### أ. تحديث src/api/paypal.js
```javascript
import { supabase } from '@/lib/supabase';

// استخدام Supabase Functions بدلاً من API القديم
export const createPayPalOrder = async (amount, currency = 'USD', items) => {
  try {
    // ✅ استدعاء Supabase Function
    const { data, error } = await supabase.functions.invoke('create-paypal-order', {
      body: {
        amount,
        currency,
        items,
        // تأكد أنها تستخدم Live Credentials من البيئة
      }
    });

    if (error) throw error;
    
    // يجب أن تحصل على approval_url من PayPal
    return {
      order_id: data.order_id,
      approval_url: data.approval_url  // رابط دفع حقيقي من PayPal
    };
  } catch (error) {
    console.error('PayPal order error:', error);
    throw error;
  }
};
```

### ب. التأكد من متغيرات البيئة
```javascript
// .env.local (للـ development)
VITE_SUPABASE_URL=https://ofdqkracfqakbtjjmksa.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_SUPABASE_FUNCTIONS_URL=https://ofdqkracfqakbtjjmksa.supabase.co/functions/v1
```

---

## 🎯 الخطوة 8: الاختبار الكامل

### أ. على الويب (Live)
```bash
1. npm run build
2. npm run preview  # أو deploy
3. اذهب إلى https://www.wasel.life
4. جرب عملية دفع كاملة
5. تحقق من:
   ✅ Supabase Logs
   ✅ PayPal Dashboard
   ✅ الرد من PayPal
```

### ب. على الموبايل (Android)
```bash
1. قم بـ Build APK: ./gradlew assembleRelease
2. ثبّت على جهاز Android
3. جرب عملية دفع
4. تحقق من:
   ✅ إعادة التوجيه لـ PayPal
   ✅ الرجوع للتطبيق
   ✅ تأكيد الدفع
```

### ج. على Sandbox (قبل Live)
```bash
# غيّر في Supabase:
PAYPAL_ENV = sandbox

1. اختبر مع بطاقة Sandbox
2. تحقق أن كل شيء يعمل
3. فقط بعدها غيّر إلى Live
```

---

## 🔐 الخطوة 9: الأمان

### أ. تأكد من عدم تسريب الرموز السرية
```javascript
// ❌ خطأ - لا تفعل هذا!
const SECRET = "AQxxxxx...";  // في الكود

// ✅ صحيح - استخدم متغيرات البيئة
const SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
```

### ب. استخدم HTTPS فقط
```
Production: https://www.wasel.life
⚠️ PayPal لا يقبل HTTP في Live Mode
```

### ج. قيود CORS
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.wasel.life',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

---

## 📊 التحقق النهائي

### قائمة التحقق
- [ ] PayPal Live Credentials محفوظة في Supabase
- [ ] PAYPAL_ENV = live
- [ ] Return URLs مسجلة في PayPal
- [ ] Supabase Functions منشورة
- [ ] Frontend يستخدم Supabase Functions
- [ ] HTTPS فقط (بدون HTTP)
- [ ] Android APK مبني بنجاح
- [ ] اختبار Sandbox نجح
- [ ] اختبار Live نجح

---

## 🚨 استكشاف الأخطاء

### المشكلة: "INVALID_PARAMETER_SYNTAX"
```
السبب: Credentials خاطئة أو بيئة خاطئة
الحل:
1. تحقق من أن PAYPAL_ENV = live
2. تحقق من PAYPAL_CLIENT_ID و SECRET
3. تحقق من أنها من اللـ Live وليس Sandbox
```

### المشكلة: "Unauthorized"
```
السبب: CORS issue أو credentials expired
الحل:
1. تحقق من CORS headers
2. جدد الـ credentials من PayPal
3. تحقق من أن Origin مسموح في PayPal
```

### المشكلة: "Function not found"
```
السبب: Supabase Functions لم تنشر
الحل:
supabase functions deploy create-paypal-order
```

---

## ✅ الخلاصة

```
✅ Live PayPal تم تفعيله
✅ Supabase يحفظ الرموز السرية
✅ Android يعمل مع الدفع
✅ كل شيء آمن ويعمل

🎉 الآن جاهز للإنتاج!
```

---

**آخر تحديث:** 5 فبراير 2026
