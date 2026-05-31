import { Platform } from 'react-native';

/**
 * URL base del backend.
 * - iOS Simulator  → localhost funciona directo
 * - Android Emulator → la máquina host es 10.0.2.2
 * - Dispositivo físico → usar la IP local de la máquina (ej: 192.168.x.x)
 */
export const BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
