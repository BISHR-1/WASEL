import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@capawesome/capacitor-google-auth';

const WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '251985599218-608bl35pbtifshb7iv0d9prngmsc4sv1.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = import.meta.env.VITE_GOOGLE_ANDROID_CLIENT_ID || WEB_CLIENT_ID;

export const initializeGoogleAuth = async () => {
  try {
    // Only initialize on native (Android/iOS) - Web uses @react-oauth/google
    if (Capacitor.getPlatform() !== 'web') {
      await GoogleAuth.initialize({
        clientId: ANDROID_CLIENT_ID,
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    }
  } catch (error) {
    console.error('Google Auth initialization error:', error);
  }
};

export const signInWithGoogle = async () => {
  try {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      // Web uses @react-oauth/google component
      throw new Error('Use GoogleLogin component for web platform');
    }
    
    // Native (Android/iOS)
    const result = await GoogleAuth.signIn();
    
    return {
      id: result.id,
      email: result.email,
      name: result.name,
      imageUrl: result.imageUrl,
      idToken: result.authentication?.idToken,
      accessToken: result.authentication?.accessToken,
    };
  } catch (error) {
    console.error('Google Sign-In error:', error);
    throw error;
  }
};

export const signOutGoogle = async () => {
  try {
    const platform = Capacitor.getPlatform();
    
    if (platform !== 'web') {
      await GoogleAuth.signOut();
    }
  } catch (error) {
    console.error('Google Sign-Out error:', error);
  }
};

export const getCurrentGoogleUser = async () => {
  try {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      return null; // Web handles this differently
    }
    
    const result = await GoogleAuth.getAccessTokens();
    return result;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};
