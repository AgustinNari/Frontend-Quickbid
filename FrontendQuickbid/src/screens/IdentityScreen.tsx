import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, radius, fontSize, controlHeight } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { authApi } from '../api/auth';
import { ApiError } from '../api/client';
import { useNetwork } from '../context/NetworkContext';
import { MobileImage, pickImages } from '../mobile/mediaPicker';
import { ImageUploadPreview } from '../components/ImageUploadPreview';

type Props = NativeStackScreenProps<RootStackParamList, 'Identity'>;

function IdCardIcon() {
  return (
    <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <Rect
        x="4"
        y="12"
        width="40"
        height="28"
        rx="3"
        stroke={colors.primary}
        strokeWidth="2"
      />
      <Rect
        x="10"
        y="20"
        width="12"
        height="12"
        rx="1.5"
        stroke={colors.primary}
        strokeWidth="1.8"
      />
      <Line
        x1="26"
        y1="22"
        x2="38"
        y2="22"
        stroke={colors.primary}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Line
        x1="26"
        y1="27"
        x2="38"
        y2="27"
        stroke={colors.primary}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Line
        x1="26"
        y1="32"
        x2="34"
        y2="32"
        stroke={colors.primary}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function BarcodeIcon() {
  return (
    <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <Line
        x1="8"
        y1="12"
        x2="8"
        y2="36"
        stroke={colors.primary}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Line
        x1="13"
        y1="12"
        x2="13"
        y2="36"
        stroke={colors.primary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Line
        x1="17"
        y1="12"
        x2="17"
        y2="36"
        stroke={colors.primary}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Line
        x1="22"
        y1="12"
        x2="22"
        y2="36"
        stroke={colors.primary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Line
        x1="26"
        y1="12"
        x2="26"
        y2="36"
        stroke={colors.primary}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Line
        x1="30"
        y1="12"
        x2="30"
        y2="36"
        stroke={colors.primary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Line
        x1="34"
        y1="12"
        x2="34"
        y2="36"
        stroke={colors.primary}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Line
        x1="39"
        y1="12"
        x2="39"
        y2="36"
        stroke={colors.primary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

type UploadBoxProps = {
  label: string;
  description: string;
  icon: React.ReactNode;
  image: MobileImage | null;
  onPress: () => void;
  onRemove: () => void;
};

function UploadBox({
  label,
  description,
  icon,
  image,
  onPress,
  onRemove,
}: UploadBoxProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <Text style={styles.sectionDesc}>{description}</Text>
      {image ? (
        <ImageUploadPreview
          image={image}
          onRemove={onRemove}
          onReplace={onPress}
        />
      ) : (
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <>
            {icon}
            <Text style={styles.uploadText}>Presiona para subir</Text>
            <Text style={styles.uploadFormats}>
              Formatos: JPG, JPEG, PNG, WebP
            </Text>
          </>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function IdentityScreen({ route, navigation }: Props) {
  const { email } = route.params;

  const [frontImage, setFrontImage] = useState<MobileImage | null>(null);
  const [backImage, setBackImage] = useState<MobileImage | null>(null);
  const [loading, setLoading] = useState(false);
  const { confirmHeavyAction } = useNetwork();

  async function seleccionarImagen(
    fallbackBaseName: string,
    setter: (asset: MobileImage) => void,
  ) {
    const [image] = await pickImages({
      selectionLimit: 1,
      quality: 0.8,
      fallbackBaseName,
    });
    if (image) setter(image);
  }

  function handleSelectFront() {
    seleccionarImagen('dni-frente', setFrontImage);
  }
  function handleSelectBack() {
    seleccionarImagen('dni-dorso', setBackImage);
  }

  async function handleCompletar() {
    if (!frontImage || !backImage) {
      Alert.alert('Fotos requeridas', 'Subí el frente y el dorso del DNI.');
      return;
    }

    if (!(await confirmHeavyAction())) return;
    setLoading(true);
    try {
      await authApi.etapa2(email, frontImage, backImage);
      navigation.navigate('Verifying');
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : 'No se pudo contactar a QuickBid. Revisá tu conexión e intentá nuevamente.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Identidad</Text>
        <Text style={styles.subtitle}>Paso 2 de 3: Verificación de DNI</Text>

        <UploadBox
          label="Frente del DNI"
          description="Asegurate de que los datos sean legibles."
          icon={<IdCardIcon />}
          image={frontImage}
          onPress={handleSelectFront}
          onRemove={() => setFrontImage(null)}
        />

        <UploadBox
          label="Dorso del DNI"
          description="Verificá que el código de barras esté nítido."
          icon={<BarcodeIcon />}
          image={backImage}
          onPress={handleSelectBack}
          onRemove={() => setBackImage(null)}
        />

        <View style={styles.spacer} />

        <TouchableOpacity
          style={styles.btn}
          activeOpacity={0.85}
          onPress={handleCompletar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.btnText}>Completar registro</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 28,
    paddingBottom: spacing['2xl'],
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    marginBottom: 28,
  },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    borderRadius: radius.base,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFF',
    gap: spacing.xs,
  },
  uploadText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  uploadFormats: { fontSize: fontSize.sm, color: colors.textSubtle },
  spacer: { minHeight: 16 },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.base,
    height: controlHeight.base,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  btnText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
});
