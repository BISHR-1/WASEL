# ⚡ أوامر المزامنة السريعة

## 🎯 الأوامر الأساسية

### 1️⃣ فتح المشروع في Android Studio

```bash
# من Terminal (cmd أو PowerShell):

# الطريقة 1: استخدام Android Studio مباشرة
"C:\Program Files\Android\Android Studio\bin\studio.exe" "C:\Users\HP ENVY 15\Downloads\wasel-main\wasel-main\android"

# أو من المشروع الرئيسي:
cd "C:\Users\HP ENVY 15\Downloads\wasel-main\wasel-main"
npx open android
```

### 2️⃣ مزامنة Gradle يدوياً

```bash
# من مجلد Android
cd android
./gradlew sync

# أو
./gradlew build --dry-run
```

### 3️⃣ بناء APK

```bash
# الأوامر من المشروع الرئيسي
npm run build:apk

# أو من مجلد Android
cd android
./gradlew assembleRelease
```

---

## 🔍 التحقق من الإعدادات

### تحقق من Java

```bash
java -version
# يجب أن يكون Java 11+
```

### تحقق من Android SDK

```bash
# قائمة المشاريع المثبتة
"$env:LOCALAPPDATA\Android\Sdk\tools\bin\sdkmanager" --list

# أو من Android Studio:
# File → Settings → Android SDK
```

### تحقق من Gradle

```bash
cd android
./gradlew --version
```

---

## 🚀 سيناريو المزامنة الكامل

### خطوة بخطوة:

```bash
# 1. اذهب للمشروع الرئيسي
cd "C:\Users\HP ENVY 15\Downloads\wasel-main\wasel-main"

# 2. نظّف الملفات القديمة
cd android
./gradlew clean

# 3. عودة للرئيسي
cd ..

# 4. فتح في Android Studio (افتح يدوياً أو استخدم الأمر أعلاه)
# ثم اضغط Sync Now

# 5. بعد نجاح Sync، بناء:
npm run build:apk

# 6. اختبار على جهاز
npm run sync:android
```

---

## 📊 حالة المشروع الحالية

```
✅ Capacitor معدّ
✅ capacitor.config.ts محدث (PayPal ready)
✅ package.json محدث (npm scripts جاهزة)
✅ Android files موجودة وجاهزة

الحالة: جاهز للمزامنة والبناء ✅
```

---

## 🎁 Scripts الجديدة المتاحة

```json
{
  "build:android": "capacitor build android",
  "sync:android": "capacitor sync android",
  "build:apk": "cd android && ./gradlew assembleRelease",
  "build:aab": "cd android && ./gradlew bundleRelease",
  "deploy:functions": "supabase functions deploy"
}
```

---

## 🔗 الملفات ذات الصلة

- [ANDROID_STUDIO_SYNC.md](ANDROID_STUDIO_SYNC.md) - شرح مفصّل
- [ANDROID_SETUP_GUIDE.md](ANDROID_SETUP_GUIDE.md) - إعدادات متقدمة
- [PAYPAL_LIVE_SETUP.md](PAYPAL_LIVE_SETUP.md) - إعداد الدفع
- [START_HERE_IMPLEMENTATION.md](START_HERE_IMPLEMENTATION.md) - خطة كاملة
