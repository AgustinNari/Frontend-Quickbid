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

export type NativePrivateDraftFile = {
  uri: string;
  name: string;
  type: string;
  sizeBytes: number;
};

type DocumentModule = {
  downloadAndShare(
    url: string,
    authorization: string,
    fallbackFilename: string | null,
  ): Promise<NativeDownloadedFile>;
  canReadUri(uri: string): Promise<boolean>;
  copyUriToPrivateDraftStorage(
    uri: string,
    suggestedName: string,
  ): Promise<NativePrivateDraftFile>;
  deletePrivateDraftFile(uri: string): Promise<boolean>;
};

export const connectivityModule =
  Platform.OS === 'android'
    ? (NativeModules.QuickBidConnectivity as ConnectivityModule | undefined)
    : undefined;

export const documentModule =
  Platform.OS === 'android'
    ? (NativeModules.QuickBidDocument as DocumentModule | undefined)
    : undefined;

export async function canReadLocalUri(uri: string) {
  if (!documentModule) return true;
  try {
    return await documentModule.canReadUri(uri);
  } catch {
    return false;
  }
}

export async function copyUriToPrivateDraftStorage(
  uri: string,
  suggestedName: string,
) {
  if (!documentModule) {
    throw new Error('El almacenamiento privado de borradores no esta disponible.');
  }
  return documentModule.copyUriToPrivateDraftStorage(uri, suggestedName);
}

export async function deletePrivateDraftFile(uri: string) {
  if (!documentModule) return false;
  try {
    return await documentModule.deletePrivateDraftFile(uri);
  } catch {
    return false;
  }
}
