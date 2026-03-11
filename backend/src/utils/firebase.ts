
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// Expects FIREBASE_SERVICE_ACCOUNT to be a JSON string of the service account key
// OR standard GOOGLE_APPLICATION_CREDENTIALS path
if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } else {
            // Fallback to default (Google Cloud environment or GOOGLE_APPLICATION_CREDENTIALS)
            console.log('Attempting to initialize Firebase Admin with default credentials...');
            admin.initializeApp();
        }
    } catch (error) {
        console.error('FIREBASE ADMIN INIT FAILED:', error);
    }
}

export const firebaseAdmin = admin;
export const fcm = admin.messaging();
export const firestore = admin.firestore();
