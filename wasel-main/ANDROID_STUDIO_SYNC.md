# 🔄 مزامنة التطبيق مع Android Studio

## ✅ المتطلبات الأساسية

```bash
✅ Android Studio مثبت
✅ Java JDK 11+ مثبت
✅ Android SDK مثبت (API 30+)
✅ Gradle مثبت (يأتي مع Android Studio)
```

---

## 🚀 خطوات المزامنة السريعة

### الخطوة 1️⃣: فتح Android Studio

```
1. افتح Android Studio
2. اختر: File → Open
3. انتقل إلى المشروع:
   C:\Users\HP ENVY 15\Downloads\wasel-main\wasel-main\android
4. اضغط: Open
```

**ستظهر رسالة تقول:**
```
"Gradle project needs to be built"
```

### الخطوة 2️⃣: المزامنة مع Gradle

Android Studio **سيسأل بشكل تلقائي** عن مزامنة Gradle:

```
اختر: Sync Now (أو اضغط Sync الأزرق في الأعلى)
```

**ماذا يحدث:**
- ✅ تحميل جميع المكتبات
- ✅ تجميع الـ dependencies
- ✅ معالجة ملفات الإعداد
- ⏱️ قد يستغرق 2-5 دقائق (المرة الأولى)

### الخطوة 3️⃣: الانتظار حتى انتهاء المزامنة

```
مؤشرات النجاح ✅:
┌─────────────────────────────────────┐
│ BUILD SUCCESSFUL (في الأسفل)       │
│ Sync completed successfully         │
│ لا توجد أخطاء حمراء                 │
└─────────────────────────────────────┘
```

**إذا حدثت مشاكل:**
```
❌ BUILD FAILED
→ اذهب إلى الخطوة "استكشاف الأخطاء" أدناه
```

---

## 📋 التحقق من الإعدادات

### ✅ تحقق من SDK المثبت

```
1. File → Settings (أو Ctrl+Alt+S)
2. Appearance & Behavior → System Settings → Android SDK
3. تحقق من:
   ✅ SDK 30 أو أعلى
   ✅ SDK Tools (Platform Tools, Build Tools)
   ✅ Emulator (اختياري)
```

### ✅ تحقق من JDK

```
1. File → Project Structure
2. SDK Location
3. تأكد:
   ✅ Android SDK Path صحيح
   ✅ JDK Path صحيح (Java 11+)
   ✅ NDK Path موجود (اختياري)
```

### ✅ تحقق من local.properties

```
ملف: android/local.properties
محتوى المتوقع:
────────────────────────────
sdk.dir=C:\\Users\\HP ENVY 15\\AppData\\Local\\Android\\Sdk
────────────────────────────

ملاحظة: يتم إنشاؤه تلقائياً عند الفتح
```

---

## 🏗️ بناء التطبيق

### الطريقة 1️⃣: من Android Studio

```
1. اختر: Build → Build Bundle(s) / APK(s)
2. اختر: Build APK
3. انتظر الانتهاء
4. ستظهر رسالة:
   "APK(s) generated successfully"
```

**المسار:**
```
android/app/build/outputs/apk/release/app-release.apk
```

### الطريقة 2️⃣: من Terminal

```bash
# من المجلد الرئيسي
npm run build:apk

# أو من مجلد Android
cd android
./gradlew build -x lint --warning-mode=summary
```

---

## 📱 تشغيل على جهاز حقيقي

### تحضير الجهاز

```
على هاتفك الأندرويد:

1. Settings → About Phone
2. ابحث عن "Build Number"
3. اضغط 7 مرات على "Build Number"
   (سيظهر: "You are now a developer")

4. عودة → System → Developer Options
5. قعّل: "USB Debugging"
6. قعّل: "Install via USB"
7. اتصل بـ USB بالجهاز الكمبيوتر
```

### تشغيل التطبيق

```
من Android Studio:

1. اختر: Run → Run 'app'
2. اختر: جهازك من القائمة
3. اضغط: OK
4. انتظر البناء والتثبيت (1-2 دقيقة)
5. التطبيق سيبدأ تلقائياً
```

---

## 🔍 استكشاف الأخطاء

### ❌ خطأ: "Gradle sync failed"

**الحل:**
```
1. File → Invalidate Caches and Restart
2. انتظر حتى يغلق ويعاد فتح
3. ثم اضغط Sync Again
```

### ❌ خطأ: "SDK not found"

**الحل:**
```
1. File → Settings → Android SDK
2. اضغط: Edit
3. اختر مسار SDK الصحيح:
   C:\Users\HP ENVY 15\AppData\Local\Android\Sdk
```

### ❌ خطأ: "Java not found" أو "JDK not found"

**الحل:**
```
1. تأكد من تثبيت Java 11+:
   java -version
   
2. إذا لم يكن مثبتاً:
   - حمّل من: https://adoptium.net/
   - نصّب Java 11 أو أعلى

3. في Android Studio:
   File → Project Structure → SDK Location
   - اختر JDK الصحيح
```

### ❌ خطأ: "Build failed: Method not found"

**الحل:**
```
1. في Terminal من المشروع:
   cd android
   ./gradlew clean

2. عودة لـ Android Studio وكرر Sync
```

### ❌ خطأ: "Device not recognized"

**الحل:**
```
1. تأكد من USB Debugging مفعّل على الجهاز
2. اضغط OK إذا ظهرت نافذة على الجهاز تطلب الموافقة
3. في Windows، اضغط: Run → devmgmt.msc
   - تحقق من جهازك تحت "Android Devices"
4. إذا رأيت علامة صفراء، نصّب الـ drivers المناسبة
```

---

## 🎯 قائمة التحقق

```
التحضير:
□ Android Studio مثبت
□ SDK مثبت (API 30+)
□ Java 11+ مثبت

المزامنة:
□ تم فتح مجلد android/
□ ظهرت رسالة Sync
□ اضغطت Sync Now
□ انتظرت 2-5 دقائق

التحقق:
□ BUILD SUCCESSFUL (بدون أخطاء حمراء)
□ المشروع يظهر في Sidebar بشكل صحيح
□ لا توجد أخطاء في Logcat

التشغيل:
□ جهازك متصل بـ USB
□ USB Debugging مفعّل
□ اخترت Run → Run 'app'
□ التطبيق ظهر على الجهاز
```

---

## ⚡ نصائح مهمة

### 🔐 الأمان

```
⚠️ تذكر:
- لا تشارك SDK path مع أحد
- الـ Credentials آمنة (في Supabase، ليس في الكود)
- HTTPS مفعّل في capacitor.config.ts
```

### ⚙️ الأداء

```
للمزامنة الأسرع:
1. تأكد من أن الإنترنت سريع
2. لا تشغّل برامج ثقيلة أثناء المزامنة
3. أغلق Android Studio الأخرى إن وجدت
```

### 🛠️ التطوير

```
أثناء التطوير:
1. استخدم Android Emulator بدل الجهاز الحقيقي (أسرع في البداية)
2. استخدم Logcat لرؤية الأخطاء: View → Tool Windows → Logcat
3. اختبر على Sandbox قبل Live
```

---

## 📲 الخطوات بعد المزامنة

### الخطوة 1: اختبار Sandbox
```
في Supabase:
1. تأكد من: PAYPAL_ENV = sandbox
2. شغّل التطبيق من Android Studio
3. اختبر تدفق الدفع كاملاً
4. استخدم بطاقات الاختبار من PayPal
```

### الخطوة 2: الانتقال لـ Live
```
بعد التأكد من نجاح Sandbox:
1. غيّر: PAYPAL_ENV = live
2. انشر الـ Functions
3. بناء APK جديد
4. اختبر بحذر
```

### الخطوة 3: النشر على Play Store
```
عندما تكون جاهزاً:
1. اتبع: ANDROID_SETUP_GUIDE.md
2. قسم: "Google Play Deployment"
3. تحضير المتجر والنشر
```

---

## 🎊 تم! 

**عندما تكمل كل الخطوات:**
```
✅ مشروعك متزامن مع Android Studio
✅ يمكنك بناء APK أو AAB
✅ يمكنك تشغيل على جهازك
✅ جاهز للاختبار
✅ جاهز للنشر
```

---

## 📞 المساعدة السريعة

| المشكلة | الحل السريع |
|--------|-----------|
| Gradle لم يتزامن | File → Invalidate Caches and Restart |
| جهاز لم يظهر | تأكد من USB Debugging وأعد الاتصال |
| بناء فشل | cd android && ./gradlew clean |
| لا أملك Java | احمل من adoptium.net وثبّت |
| SDK غير موجود | File → Settings → Android SDK → Edit |

---

## 🚀 الخطوة التالية

**بعد نجاح المزامنة:**
```
1. اقرأ: QUICK_START_30_MIN.md
2. اتبع: PAYPAL_LIVE_SETUP.md
3. بناء: npm run build:apk
4. اختبر على جهازك
5. انشر على Play Store (اختياري)
```

**مستند الدعم:** ANDROID_SETUP_GUIDE.md

---

**تم! 🎉 مشروعك الآن متزامن مع Android Studio بالكامل!**
