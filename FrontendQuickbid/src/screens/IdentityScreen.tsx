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

type Props = NativeStackScreenProps<RootStackParamList, 'Identity'>;

const BLUE = '#0055D1';

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IdCardIcon() {
  return (
    <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <Rect x="4" y="12" width="40" height="28" rx="3" stroke={BLUE} strokeWidth="2" />
      <Rect x="10" y="20" width="12" height="12" rx="1.5" stroke={BLUE} strokeWidth="1.8" />
      <Line x1="26" y1="22" x2="38" y2="22" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="26" y1="27" x2="38" y2="27" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="26" y1="32" x2="34" y2="32" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function BarcodeIcon() {
  return (
    <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <Line x1="8"  y1="12" x2="8"  y2="36" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="13" y1="12" x2="13" y2="36" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="17" y1="12" x2="17" y2="36" stroke={BLUE} strokeWidth="3"   strokeLinecap="round" />
      <Line x1="22" y1="12" x2="22" y2="36" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="26" y1="12" x2="26" y2="36" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="30" y1="12" x2="30" y2="36" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="34" y1="12" x2="34" y2="36" stroke={BLUE} strokeWidth="3"   strokeLinecap="round" />
      <Line x1="39" y1="12" x2="39" y2="36" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" />
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
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  backBtn: { padding: 2 },
  brand: { fontSize: 18, fontWeight: 'bold', color: BLUE },

  // Scroll
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },

  // Títulos
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 28,
  },

  // Secciones
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },

  // Upload box
  uploadBox: {
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFF',
    gap: 8,
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '600',
    color: BLUE,
  },
  uploadFormats: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  preview: {
    width: '100%',
    height: 160,
    borderRadius: 8,
  },

  spacer: { minHeight: 16 },

  // Botón
  btn: {
    flexDirection: 'row',
    backgroundColor: BLUE,
    borderRadius: 10,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
