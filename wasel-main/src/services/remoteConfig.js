
import { fetchAndActivate, getValue } from "firebase/remote-config";
import { remoteConfig } from "../lib/firebase";

/**
 * Fetch and activate remote config values from Firebase.
 */
export const initRemoteConfig = async () => {
    if (!remoteConfig) return;
    try {
        const activated = await fetchAndActivate(remoteConfig);
        if (activated) {
            console.log("[RemoteConfig] Fetched and activated new config.");
        } else {
            console.log("[RemoteConfig] Config already current.");
        }
    } catch (error) {
        console.error("[RemoteConfig] Error fetching config:", error);
    }
};

/**
 * Get a string value from Remote Config.
 * @param {string} key 
 * @returns {string}
 */
export const getString = (key) => {
    if (!remoteConfig) return "";
    return getValue(remoteConfig, key).asString();
};

/**
 * Get a boolean value from Remote Config.
 * @param {string} key 
 * @returns {boolean}
 */
export const getBoolean = (key) => {
    if (!remoteConfig) return false;
    return getValue(remoteConfig, key).asBoolean();
};
