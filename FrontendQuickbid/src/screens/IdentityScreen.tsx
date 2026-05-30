import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, radius, fontSize, controlHeight } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Identity'>;

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IdCardIcon() {
  return (
    <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <Rect x="4" y="12" width="40" height="28" rx="3" stroke={colors.primary} strokeWidth="2" />
      <Rect x="10" y="20" width="12" height="12" rx="1.5" stroke={colors.primary} strokeWidth="1.8" />
      <Line x1="26" y1="22" x2="38" y2="22" stroke={colors.primary} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="26" y1="27" x2="38" y2="27" stroke={colors.primary} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="26" y1="32" x2="34" y2="32" stroke={colors.primary} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function BarcodeIcon() {
  return (
    <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <Line x1="8"  y1="12" x2="8"  y2="36" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="13" y1="12" x2="13" y2="36" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="17" y1="12" x2="17" y2="36" stroke={colors.primary} strokeWidth="3"   strokeLinecap="round" />
      <Line x1="22" y1="12" x2="22" y2="36" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="26" y1="12" x2="26" y2="36" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="30" y1="12" x2="30" y2="36" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="34" y1="12" x2="34" y2="36" stroke={colors.primary} strokeWidth="3"   strokeLinecap="round" />
      <Line x1="39" y1="12" x2="39" y2="36" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

type UploadBoxProps = {
  label: string;
  description: string;
  icon: React.ReactNode;
  image: string | null;
  onPress: () => void;
};

function UploadBox({ label, description, icon, image, onPress }: UploadBoxProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <Text style={styles.sectionDesc}>{description}</Text>
      <TouchableOpacity style={styles.uploadBox} onPress={onPress} activeOpacity={0.7}>
        {image ? (
          <Image source={{ uri: image }} style={styles.preview} resizeMode="cover" />
        ) : (
          <>
            {icon}
            <Text style={styles.uploadText}>Presiona para subir</Text>
            <Text style={styles.uploadFormats}>Formatos: JPG, PNG</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function IdentityScreen({ navigation }: Props) {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage,  setBackImage]  = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.brand}>QuickBid</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Títulos */}
        <Text style={styles.title}>Identidad</Text>
        <Text style={styles.subtitle}>Paso 2 de 3: Verificación de DNI</Text>

        {/* Frente del DNI */}
        <UploadBox
          label="Frente del DNI"
          description="Asegúrate de que los datos sean legibles."
          icon={<IdCardIcon />}
          image={frontImage}
          onPress={() => {}}
        />

        {/* Dorso del DNI */}
        <UploadBox
          label="Dorso del DNI"
          description="Verifica que el código de barras esté nítido."
          icon={<BarcodeIcon />}
          image={backImage}
          onPress={() => {}}
        />

        <View style={styles.spacer} />

        {/* Botón */}
        <TouchableOpacity style={styles.btn} activeOpacity={0.85} onPress={() => navigation.navigate('Verifying')}>
          <Text style={styles.btnText}>Completar registro</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
    gap: spacing.xs,
  },
  backBtn: { padding: 2 },
  brand: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.primary },

  // Scroll
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 28,
    paddingBottom: spacing['2xl'],
  },

  // Títulos
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

  // Secciones
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

  // Upload box
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
  uploadFormats: {
    fontSize: fontSize.sm,
    color: colors.textSubtle,
  },
  preview: {
    width: '100%',
    height: 160,
    borderRadius: radius.md,
  },

  spacer: { minHeight: 16 },

  // Botón
  btn: {
    flexDirection: 'row',
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
