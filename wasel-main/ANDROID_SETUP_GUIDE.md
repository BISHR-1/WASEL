# 📱 Android Studio Setup Guide - Wasel PayPal Integration

## 🎯 الهدف
إعداد تطبيق Android مع دعم دفع PayPal Live و Supabase

---

## ✅ المتطلبات

- [ ] Android Studio مثبت (أحدث إصدار)
- [ ] Java 11+ مثبت
- [ ] Gradle مثبت
- [ ] Git مثبت
- [ ] SDK API 24+ (minimum)

---

## 🚀 الخطوة 1: فتح المشروع

### أ. فتح Android Folder
```bash
1. افتح Android Studio
2. File → Open
3. اختر: wasel-main/android/
4. انتظر Gradle sync (قد يستغرق عدة دقائق)
```

### ب. التحقق من الـ Gradle Version
```bash
# في Terminal في Android Studio
cd android
./gradlew --version

# يجب أن يكون: 8.0+
```

---

## 🔧 الخطوة 2: تحديث Android Configurations

### أ. تحديث android/build.gradle
```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.0.2'
        classpath 'com.google.gms:google-services:4.3.15'
        classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.0'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://repo.maven.apache.org/maven2' }
        maven { url 'https://maven.google.com' }
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
```

### ب. تحديث android/app/build.gradle
```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services'
apply plugin: 'kotlin-android'

android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.wasel.app"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
        
        manifestPlaceholders = [
            'PAYPAL_CLIENT_ID': 'YOUR_LIVE_CLIENT_ID',
            'APP_SCHEME': 'https',
            'APP_HOST': 'www.wasel.life'
        ]
    }
    
    signingConfigs {
        release {
            storeFile file("keystore.jks")
            storePassword System.getenv("KEYSTORE_PASSWORD") ?: "wasel-keystore"
            keyAlias "wasel-key"
            keyPassword System.getenv("KEY_PASSWORD") ?: "wasel-key-password"
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            debuggable true
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_11
        targetCompatibility JavaVersion.VERSION_11
    }
    
    kotlinOptions {
        jvmTarget = "11"
    }
}

dependencies {
    // Capacitor & Plugins
    implementation 'com.getcapacitor:android:6.0.0'
    implementation 'com.getcapacitor:android-plugins:6.0.0'
    
    // PayPal
    implementation 'com.paypal.checkout:android-sdk:0.10.0'
    
    // Supabase
    implementation 'io.github.supabase:gotrue-kt:2.0.2'
    implementation 'io.github.supabase:supabase-kt:2.0.2'
    
    // Google Play Services
    implementation 'com.google.gms:google-services:4.3.15'
    
    // AndroidX
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.lifecycle:lifecycle-runtime-ktx:2.6.1'
    implementation 'androidx.security:security-crypto:1.1.0-alpha06'
    
    // Networking
    implementation 'com.squareup.okhttp3:okhttp:4.11.0'
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    
    // Testing
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}
```

### ج. تحديث android/app/src/main/AndroidManifest.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.wasel.app">

    <!-- ✅ Permissions مطلوبة -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <!-- ✅ Features مطلوبة للـ PayPal -->
    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />

    <!-- ✅ Queries للـ PayPal URLs -->
    <queries>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="https" />
        </intent>
        <intent>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.APP_LAUNCHER" />
        </intent>
    </queries>

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="false">

        <!-- ✅ MainActivity -->
        <activity
            android:name="com.getcapacitor.android.Bridge"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme"
            android:launchMode="singleTask"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <!-- ✅ Deep linking for Wasel -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="www.wasel.life" />
            </intent-filter>
        </activity>

        <!-- ✅ PayPal Return/Cancel Activity -->
        <activity
            android:name="com.paypal.checkout.RedirectActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="www.wasel.life"
                    android:path="/payment-success" />
                <data
                    android:scheme="https"
                    android:host="www.wasel.life"
                    android:path="/cart" />
            </intent-filter>
        </activity>

        <!-- ✅ Firebase Services (Optional) -->
        <service
            android:name="com.google.firebase.messaging.FirebaseMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>
    </application>
</manifest>
```

---

## 🔐 الخطوة 3: إنشاء Keystore (للـ Release Build)

### أ. إنشاء Keystore
```bash
# في Terminal
cd android/app

# أنشئ keystore
keytool -genkey -v -keystore keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias wasel-key

# سيطلب منك:
# Keystore password: wasel-keystore
# Key password: wasel-key-password
# معلومات الشركة: Wasel
```

### ب. احفظ الـ Keystore بأمان
```bash
# لا تشاركه مع أحد!
# احفظه في مكان آمن:
# android/app/keystore.jks

# وأضف كلمات المرور في:
# ~/.gradle/gradle.properties

KEYSTORE_PASSWORD=wasel-keystore
KEY_PASSWORD=wasel-key-password
```

---

## 🔧 الخطوة 4: تكوين PayPal للموبايل

### أ. إضافة PayPal Client ID في Build
```gradle
// في android/app/build.gradle
defaultConfig {
    // ...
    manifestPlaceholders = [
        'PAYPAL_CLIENT_ID': 'YOUR_LIVE_CLIENT_ID_HERE'
    ]
}
```

### ب. إضافة PayPal Receiver Activity
```kotlin
// في MainActivity.kt
package com.wasel.app

import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import com.getcapacitor.android.Bridge
import android.content.Intent
import android.net.Uri

public class MainActivity: BridgeActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // ✅ تفعيل WebView للـ PayPal
        val webView = webView as WebView
        webView.settings.apply {
            javaScriptEnabled = true
            javaScriptCanOpenWindowsAutomatically = true
            supportMultipleWindows()
            mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            domStorageEnabled = true
        }
        
        // ✅ معالجة PayPal Redirects
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                if (url != null && (
                    url.contains("paypal.com") ||
                    url.contains("checkout.paypal.com")
                )) {
                    // افتح في متصفح خارجي
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                    return true
                }
                return false
            }
        }
        
        // معالجة Intent من PayPal
        handlePayPalReturn(intent)
    }
    
    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let { handlePayPalReturn(it) }
    }
    
    private fun handlePayPalReturn(intent: Intent) {
        val data = intent.data
        if (data != null && data.path?.contains("payment-success") == true) {
            val orderId = data.getQueryParameter("order_id")
            val status = data.getQueryParameter("status")
            
            // أرسل message إلى WebView
            evaluateJavascript("""
                window.postMessage({
                    type: 'PAYMENT_COMPLETE',
                    orderId: '$orderId',
                    status: '$status'
                }, '*');
            """.trimIndent(), null)
        }
    }
}
```

---

## 📱 الخطوة 5: المزامنة مع Android Studio

### أ. Sync Gradle
```bash
# في Android Studio Terminal
cd android
./gradlew clean

# أو من القائمة:
File → Sync Now
```

### ب. تحديث الـ Plugins
```bash
1. في Android Studio
2. Tools → SDK Manager
3. تحقق من:
   - ✅ Android SDK 34 (API Level 34)
   - ✅ Google Play Services
   - ✅ Kotlin plugin

4. اضغط Apply ثم OK
```

### ج. Capacitor Sync
```bash
# في project root
npm run sync:android

# هذا سينسخ الـ web files إلى android
```

---

## 🏗️ الخطوة 6: البناء (Build)

### أ. Debug Build
```bash
# سريع للاختبار
cd android
./gradlew clean assembleDebug

# APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### ب. Release Build
```bash
# للـ Production
npm run build:apk

# أو يدوياً:
cd android
./gradlew clean assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

### ج. Build Bundle (لـ Google Play)
```bash
# للنشر على Google Play Store
npm run build:aab

# أو:
cd android
./gradlew bundleRelease

# Bundle location:
# android/app/build/outputs/bundle/release/app-release.aab
```

---

## 📦 الخطوة 7: الاختبار على جهاز

### أ. تثبيت على جهاز فعلي
```bash
# ضع جهاز Android مع USB Debugging مفعل

# ثبّت APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# أو اضغط Run في Android Studio
Run → Run 'app'
```

### ب. اختبر عملية الدفع
```
1. افتح التطبيق
2. أضف منتج
3. اذهب للدفع
4. اختر PayPal
5. يجب أن تذهب لـ PayPal
6. بعد الدفع، عودة للتطبيق
7. تحقق من تأكيد الدفع
```

### ج. فحص الـ Logs
```bash
# في Android Studio:
View → Tool Windows → Logcat

# ابحث عن:
✅ PAYMENT_SUCCESS
✅ Order created
❌ بدون أخطاء PayPal
```

---

## 🌍 الخطوة 8: النشر على Google Play

### أ. إعداد Google Play Account
```
1. اذهب إلى Google Play Console
2. Create New Application
3. ملأ معلومات التطبيق
4. نسخة الخصوصية
5. الـ API keys
```

### ب. إنشاء Signed Bundle
```bash
# بناء Release Bundle
npm run build:aab

# الملف:
# android/app/build/outputs/bundle/release/app-release.aab
```

### ج. رفع على Google Play
```
1. في Google Play Console
2. Release → Create new release
3. أرفع app-release.aab
4. ملأ Release notes
5. Publish
```

---

## ✅ قائمة التحقق النهائية

- [ ] Android Studio جاهز
- [ ] Gradle synced بنجاح
- [ ] PayPal Client ID محدث
- [ ] Keystore أنشئ بأمان
- [ ] Capacitor synced
- [ ] Debug Build نجح
- [ ] Release Build نجح
- [ ] APK مثبت على جهاز
- [ ] عملية دفع اختبرت وعملت
- [ ] جاهز للنشر

---

## 🐛 استكشاف الأخطاء الشائعة

### المشكلة: "Gradle sync failed"
```
الحل:
1. حمّل أحدث Gradle:
   ./gradlew wrapper --gradle-version 8.0.2

2. نظّف الـ cache:
   ./gradlew clean

3. Sync مرة أخرى
```

### المشكلة: "PayPal not working"
```
الحل:
1. تأكد من Client ID صحيح
2. تأكد من HTTPS in Release
3. تأكد من Permissions في Manifest
4. فحص الـ Logs
```

### المشكلة: "APK not building"
```
الحل:
1. تحقق من Java version: 11+
2. تأكد من SDK version صحيح
3. حمّل أحدث Build Tools
```

---

## 🎉 الخلاصة

```
✅ Android Setup اكتمل
✅ PayPal مفعل للموبايل
✅ الدفع يعمل بشكل آمن
✅ جاهز للنشر على Play Store

🚀 الآن يمكنك نشر التطبيق!
```

---

**آخر تحديث:** 5 فبراير 2026
**الحالة:** جاهز للإنتاج ✅
