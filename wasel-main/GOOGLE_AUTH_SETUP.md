# Google OAuth Setup Guide for Wasel App

## ✅ ما تم إنجازه:

### 1. Web Implementation
- ✅ تثبيت `@react-oauth/google`
- ✅ إضافة `GoogleOAuthProvider` في `App.jsx`
- ✅ إنشاء `GoogleLoginButton` component
- ✅ إضافة Google Login في صفحة `Home`
- ✅ Client ID: `251985599218-608bl35pbtifshb7iv0d9prngmsc4sv1.apps.googleusercontent.com`

### 2. Android Implementation
- ✅ إضافة Google Play Services dependencies
- ✅ تحديث `AndroidManifest.xml` مع Google Sign-In permissions
- ✅ إنشاء `capacitorGoogleAuth.js` utility
- ✅ إعداد build.gradle مع Google dependencies

## 🔧 الخطوات المتبقية:

### للـ Production:
1. **الحصول على Android Client ID**:
   - اذهب إلى Google Cloud Console
   - اختر Credentials
   - أنشئ Android OAuth 2.0 Client ID
   - استخدم:
     - Package: `com.wasel.app`
     - SHA-1: `DA:39:A3:EE:5E:6B:4B:0D:32:55:BF:EF:95:60:18:90:AF:D8:07:09`

2. **إنشاء `google-services.json`**:
   - ضعه في: `android/app/google-services.json`

3. **تحديث Backend**:
   - تأكد أن Backend يدعم Google OAuth
   - اطلب endpoint لتحقق من Google tokens

4. **التوقيع على APK** (للـ Production):
   ```bash
   cd android
   keytool -genkey -v -keystore wasel-release.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias wasel
   .\gradlew.bat assembleRelease
   ```

## 🚀 الاستخدام:

### Web:
```jsx
import GoogleLoginButton from '@/components/GoogleLoginButton';

<GoogleLoginButton />
```

### Android (Capacitor):
```jsx
import { signInWithGoogle, signOutGoogle } from '@/lib/capacitorGoogleAuth';

// Sign in
const user = await signInWithGoogle();

// Sign out
await signOutGoogle();
```

## 📝 Environment Variables:
في `.env`:
```
VITE_GOOGLE_CLIENT_ID=251985599218-608bl35pbtifshb7iv0d9prngmsc4sv1.apps.googleusercontent.com
VITE_GOOGLE_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID (بعد الحصول عليه)
```

## 🎯 URLs المسموحة:
في Google Cloud Console، أضف:
- JavaScript origins: `http://localhost:5173`, `http://localhost`
- Redirect URIs: `http://localhost:5173/`, `http://localhost/`
- (أضف رابط موقعك الفعلي عند النشر)
