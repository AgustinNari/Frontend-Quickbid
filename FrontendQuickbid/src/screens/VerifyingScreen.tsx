import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
} from 'react-native';
import Svg, { Rect, Circle, Path } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Verifying'>;

const BLUE = '#0055D1';

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IdVerifyIcon() {
  return (
    <Svg width="80" height="60" viewBox="0 0 80 60" fill="none">
      <Rect x="2" y="8" width="76" height="44" rx="5" stroke="#D1D5DB" strokeWidth="2" fill="#F9FAFB" />
      <Circle cx="22" cy="30" r="10" stroke="#D1D5DB" strokeWidth="1.8" />
      <Path d="M18 30l3 3 5-5" stroke="#D1D5DB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="38" y="22" width="28" height="3" rx="1.5" fill="#E5E7EB" />
      <Rect x="38" y="29" width="22" height="3" rx="1.5" fill="#E5E7EB" />
      <Rect x="38" y="36" width="16" height="3" rx="1.5" fill="#E5E7EB" />
    </Svg>
  );
}

export default function VerifyingScreen({ navigation }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(progress, { toValue: 0, duration: 0,    useNativeDriver: false }),
      ])
    ).start();
  }, [progress]);

  const barWidth = progress.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.brand}>QuickBid</Text>
      </View>

      <View style={styles.container}>

        {/* Ícono + barra animada */}
        <View style={styles.iconWrap}>
          <IdVerifyIcon />
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: barWidth }]} />
          </View>
          <Text style={styles.verifyingText}>Verificando...</Text>
        </View>

        {/* Textos */}
        <Text style={styles.title}>Estamos validando{'\n'}tus datos</Text>

        <Text style={styles.body}>
          ¡Casi listo! Estamos revisando los documentos que subiste.
        </Text>

        <Text style={styles.highlight}>
          Te enviaremos un correo electrónico{'\n'}
          una vez que verifiquemos tu identidad.
        </Text>

        <Text style={styles.body}>
          En ese mail encontrarás un enlace{'\n'}para generar tu clave de acceso.
        </Text>

        <Text style={styles.hint}>
          No olvides revisar tu carpeta de correo no deseado.
        </Text>

        {/* Botón */}
        <TouchableOpacity
          style={styles.btn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.btnText}>Volver al Login</Text>
        </TouchableOpacity>

      </View>
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

  // Contenido
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },

  // Icono
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 36,
  },
  progressTrack: {
    width: '60%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BLUE,
    borderRadius: 2,
  },
  verifyingText: {
    fontSize: 13,
    color: BLUE,
    marginTop: 8,
    fontWeight: '500',
  },

  // Textos
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  highlight: {
    fontSize: 14,
    fontWeight: '600',
    color: BLUE,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 'auto',
    marginTop: 8,
  },

  // Botón
  btn: {
    flexDirection: 'row',
    backgroundColor: BLUE,
    borderRadius: 10,
    height: 52,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
