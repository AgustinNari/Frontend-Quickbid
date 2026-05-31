/**
 * URL base del backend.
 *
 * Con `adb reverse tcp:8080 tcp:8080` el celular tuneliza el tráfico directo a la PC.
 * Esto permite usar localhost en todos los casos mientras el cable esté conectado.
 *
 * Sin cable (solo WiFi): cambiar a la IP local de la PC, ej: 'http://192.168.X.X:8080'
 * El script dev-start.ps1 actualiza este archivo automáticamente.
 */
export const BASE_URL = 'http://localhost:8080';
