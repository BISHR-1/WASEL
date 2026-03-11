
import { logEvent, setUserProperties } from "firebase/analytics";
import { analytics } from "../lib/firebase";

/**
 * Log a custom analytics event.
 * @param {string} eventName 
 * @param {object} params 
 */
export const logAnalyticsEvent = (eventName, params = {}) => {
    if (!analytics) return;
    try {
        logEvent(analytics, eventName, params);
        console.log(`[Analytics] ${eventName}`, params);
    } catch (error) {
        console.error("[Analytics] Error logging event:", error);
    }
};

/**
 * Log when specific screen is viewed.
 * @param {string} screenName 
 */
export const logScreenView = (screenName) => {
    logAnalyticsEvent('screen_view', {
        firebase_screen: screenName,
        screen_name: screenName
    });
};

/**
 * Set user properties for segmentation.
 * @param {object} properties 
 */
export const setUserSegments = (properties) => {
    if (!analytics) return;
    try {
        setUserProperties(analytics, properties);
    } catch (error) {
        console.error("[Analytics] Error setting user properties:", error);
    }
};
