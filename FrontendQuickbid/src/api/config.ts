export const API_BASE_URL = 'http://localhost:8080';

export const ANDROID_EMULATOR_API_BASE_URL = 'http://10.0.2.2:8080';

export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export const ANDROID_EMULATOR_WS_BASE_URL = ANDROID_EMULATOR_API_BASE_URL.replace(/^http/, 'ws');
