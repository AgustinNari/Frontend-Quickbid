import {
  Alert,
  Linking,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {
  Asset,
  ImagePickerResponse,
  ImageLibraryOptions,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';

type PickImagesOptions = {
  selectionLimit?: number;
  quality?: ImageLibraryOptions['quality'];
  fallbackBaseName: string;
};

export type MobileImage = {
  uri: string;
  name: string;
  type: string;
  sizeBytes?: number;
};

export async function pickImages({
  selectionLimit = 1,
  quality = 0.9,
  fallbackBaseName,
}: PickImagesOptions): Promise<MobileImage[]> {
  const source = await chooseSource();
  if (!source) return [];
  if (source === 'camera' && !(await requestCameraPermission())) return [];

  let response: ImagePickerResponse;
  try {
    response =
      source === 'camera'
        ? await launchCamera({
            mediaType: 'photo',
            quality,
            cameraType: 'back',
            saveToPhotos: false,
          })
        : await launchImageLibrary({
            mediaType: 'photo',
            quality,
            selectionLimit,
          });
  } catch {
    Alert.alert(
      'No se pudo obtener la imagen',
      'Intentá nuevamente o elegí otra imagen.',
    );
    return [];
  }

  if (response.didCancel) return [];
  if (response.errorCode) {
    Alert.alert('No se pudo obtener la imagen', pickerError(response.errorCode));
    return [];
  }

  const images = (response.assets ?? [])
    .map((asset, index) => normalizeAsset(asset, `${fallbackBaseName}-${index + 1}`))
    .filter((asset): asset is MobileImage => asset !== null);
  if (images.length === 0) {
    Alert.alert('Imagen no disponible', 'No pudimos leer la imagen elegida.');
  }
  return images;
}

function chooseSource() {
  return new Promise<'camera' | 'gallery' | null>(resolve => {
    Alert.alert(
      'Agregar imagen',
      'Podés tomar una foto nueva o elegir una imagen existente.',
      [
        { text: 'Tomar foto', onPress: () => resolve('camera') },
        { text: 'Elegir desde galería', onPress: () => resolve('gallery') },
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}

async function requestCameraPermission() {
  if (Platform.OS !== 'android') return true;
  if (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA))
    return true;
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    {
      title: 'Permiso para usar la cámara',
      message:
        'QuickBid necesita la cámara para fotografiar el documento o el bien que querés cargar.',
      buttonPositive: 'Permitir',
      buttonNegative: 'Ahora no',
    },
  );
  if (result === PermissionsAndroid.RESULTS.GRANTED) return true;
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    Alert.alert(
      'Cámara bloqueada',
      'Habilitá el permiso de cámara desde la configuración para tomar fotos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir configuración', onPress: () => Linking.openSettings() },
      ],
    );
  } else {
    Alert.alert(
      'Permiso no concedido',
      'Podés volver a intentarlo o elegir una imagen desde la galería.',
    );
  }
  return false;
}

function normalizeAsset(asset: Asset, fallbackBaseName: string): MobileImage | null {
  if (!asset.uri) return null;
  if (asset.fileSize != null && asset.fileSize > MAX_IMAGE_SIZE_BYTES) {
    Alert.alert(
      'Imagen demasiado grande',
      'Elegí una imagen de hasta 10 MB.',
    );
    return null;
  }
  const type = asset.type ?? 'image/jpeg';
  if (!SUPPORTED_IMAGE_TYPES.has(type)) {
    Alert.alert(
      'Formato no compatible',
      'Elegí una imagen JPG, JPEG, PNG o WebP.',
    );
    return null;
  }
  const extension = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  return {
    uri: asset.uri,
    name: asset.fileName ?? `${fallbackBaseName}.${extension}`,
    type,
    sizeBytes: asset.fileSize,
  };
}

function pickerError(code: string) {
  if (code === 'camera_unavailable')
    return 'La cámara no está disponible en este dispositivo.';
  if (code === 'permission')
    return 'No hay permiso para usar la cámara. Podés habilitarlo desde la configuración.';
  return 'Intentá nuevamente o elegí otra imagen.';
}

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
