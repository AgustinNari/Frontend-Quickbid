import { NativeModules, Platform } from 'react-native';

export type NativeNetworkState = {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: 'wifi' | 'cellular' | 'ethernet' | 'vpn' | 'none' | 'unknown';
};

type ConnectivityModule = {
  getCurrentState(): Promise<NativeNetworkState>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
};

export type NativeDownloadedFile = {
  filename: string;
  contentType: string;
  sizeBytes: number;
  shared: boolean;
};

type DocumentModule = {
  downloadAndShare(
    url: string,
    authorization: string,
    fallbackFilename: string | null,
  ): Promise<NativeDownloadedFile>;
};

export const connectivityModule =
  Platform.OS === 'android'
    ? (NativeModules.QuickBidConnectivity as ConnectivityModule | undefined)
    : undefined;

export const documentModule =
  Platform.OS === 'android'
    ? (NativeModules.QuickBidDocument as DocumentModule | undefined)
    : undefined;
