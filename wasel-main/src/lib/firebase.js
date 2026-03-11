
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getRemoteConfig } from "firebase/remote-config";
import { getAuth } from "firebase/auth";

// TODO: Replace with your Firebase project configuration
// Get these from Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzqSyD...",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-app.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-app",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-app.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ABCDEF"
};

const hasValidFirebaseConfig = () => {
    const invalidMarkers = ["your-app", "G-ABCDEF", "1:123456789:web:abcdef", "AIzqSyD..."];
    return (
        !!firebaseConfig.apiKey &&
        !!firebaseConfig.projectId &&
        !!firebaseConfig.appId &&
        !invalidMarkers.some((marker) =>
            Object.values(firebaseConfig).some((value) => typeof value === "string" && value.includes(marker))
        )
    );
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const analytics = hasValidFirebaseConfig() ? getAnalytics(app) : null;
export const remoteConfig = hasValidFirebaseConfig() ? getRemoteConfig(app) : null;
export const auth = hasValidFirebaseConfig() ? getAuth(app) : null;

// Configure Remote Config
if (remoteConfig) {
    remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour default
    remoteConfig.defaultConfig = {
        "promo_banner_text": "Welcome to Wasel!",
        "enable_new_checkout": false
    };
} else {
    console.warn("[Firebase] Skipped analytics/remote config initialization: missing valid Firebase env config.");
}

export default app;
