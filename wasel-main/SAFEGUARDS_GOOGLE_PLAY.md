# Google Play Store Readiness Checklist

To ensure your app is ready for Google Play, please verify the following information in your project.

## 1. Package Name and ID
- Ensure your `applicationId` in `android/app/build.gradle` is unique (e.g., `com.wasel.app`).
- Ensure it matches the package name in `android/app/src/main/AndroidManifest.xml`.

## 2. App Icons and Splash Screen
- **Icons**: Check `android/app/src/main/res/mipmap-*` folders. You should have icons for all densities (hdpi, xhdpi, xxhdpi, etc.).
- **Splash Screen**: Ensure your Splash Screen is configured in `capacitor.config.ts` or `android/app/src/main/res/drawable/splash.png`.

## 3. Permissions
- Open `android/app/src/main/AndroidManifest.xml`.
- Ensure you only request necessary permissions.
- Common permissions:
  ```xml
  <uses-permission android:name="android.permission.INTERNET" />
  ```
- If you don't need Camera/Location, remove them to simplify Privacy Policy requirements.

## 4. Signing (Keystore)
- You need a Release Keystore to build the final APK/AAB.
- Do NOT share your keystore or password with anyone.
- Generate it using Android Studio: `Build > Generate Signed Bundle / APK`.

## 5. Privacy Policy
- Google Play requires a Privacy Policy URL.
- Ensure your app has a link to it inside the app (e.g., in the Login screen or Profile).

## 6. App Content (Data Safety)
- You will need to fill out the "Data Safety" form in Google Play Console.
- Disclose that you collect:
  - Name, Email (for Account Management).
  - Phone Number (for Delivery).
  - Location (if you track delivery address).

## 7. Supabase & Backend
- Ensure your Supabase project is "Production" ready (not paused).
- Ensure your `VITE_SUPABASE_ANON_KEY` and URL are correct in the built app.

## 8. Build Command
To generate the final bundle for Google Play:
1. Open `android` folder in Android Studio.
2. Go to `Build > Generate Signed Bundle / APK`.
3. Choose `Android App Bundle` (AAB).
4. Select your KeyStore.
5. Build 'Release'.

---
**Technical Note for Wasel:**
We have updated the app to include:
- **Supabase Stories**: You can now manage local stories via the Admin Panel.
- **Supabase Reviews**: Clients can rate orders.
- **Optimized UI**: Packages, Home, and Login are now cleaner and faster.
