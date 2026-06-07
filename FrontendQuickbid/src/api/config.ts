/**
 * Default for iOS, adb reverse, and local development.
 * Android Emulator can use ANDROID_EMULATOR_API_BASE_URL when port reverse is
 * not available. Keep URL selection centralized here.
 */
export const API_BASE_URL = 'http://localhost:8080';

export const ANDROID_EMULATOR_API_BASE_URL = 'http://10.0.2.2:8080';
