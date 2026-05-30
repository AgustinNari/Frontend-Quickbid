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
import { colors, spacing, radius, fontSize, controlHeight } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Verifying'>;

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IdVerifyIcon() {
  return (
    <Svg width="80" height="60" viewBox="0 0 80 60" fill="none">
      <Rect x="2" y="8" width="76" height="44" rx="5" stroke={colors.border} strokeWidth="2" fill={colors.surfaceMuted} />
      <Circle cx="22" cy="30" r="10" stroke={colors.border} strokeWidth="1.8" />
      <Path d="M18 30l3 3 5-5" stroke={colors.border} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="38" y="22" width="28" height="3" rx="1.5" fill={colors.borderMuted} />
      <Rect x="38" y="29" width="22" height="3" rx="1.5" fill={colors.borderMuted} />
      <Rect x="38" y="36" width="16" height="3" rx="1.5" fill={colors.borderMuted} />
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

  // Contenido
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
  },

  // Icono
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    marginBottom: 36,
  },
  progressTrack: {
    width: '60%',
    height: 4,
    backgroundColor: colors.borderMuted,
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  verifyingText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: '500',
  },

  // Textos
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  body: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.base,
  },
  highlight: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.base,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSubtle,
    textAlign: 'center',
    marginBottom: 'auto',
    marginTop: spacing.xs,
  },

  // Botón
  btn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radius.base,
    height: controlHeight.base,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing['2xl'],
  },
  btnText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
});
