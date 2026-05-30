import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, Animated,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, { NavTab } from '../components/BottomNavBar';
import { colors, spacing, radius, fontSize, controlHeight } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ValidandoPago'>;

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PaymentCheckIcon() {
  return (
    <Svg width="80" height="60" viewBox="0 0 80 60" fill="none">
      {/* Tarjeta */}
      <Rect x="2" y="8" width="76" height="44" rx="5" stroke={colors.border} strokeWidth="2" fill={colors.surfaceMuted} />
      {/* Círculo con check */}
      <Circle cx="40" cy="30" r="13" stroke={colors.primary} strokeWidth="1.8" fill="none" />
      <Path d="M34 30l4 4 8-8" stroke={colors.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function ValidandoPagoScreen({ navigation }: Props) {
  const progress  = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = React.useState<NavTab>('subastas');

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: 1400, useNativeDriver: false }),
        Animated.timing(progress, { toValue: 0, duration: 0,    useNativeDriver: false }),
      ])
    ).start();
  }, [progress]);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <SafeAreaView style={styles.safe}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.brand}>QuickBid</Text>
      </View>

      <View style={styles.container}>

        {/* Ícono + barra */}
        <View style={styles.iconCard}>
          <PaymentCheckIcon />
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: barWidth }]} />
          </View>
          <Text style={styles.verifyingLabel}>VERIFICANDO...</Text>
        </View>

        <Text style={styles.title}>Validando tu medio de pago</Text>
        <Text style={styles.body}>
          Nuestro equipo está revisando la validez de la información proporcionada.
        </Text>

        {/* Caja info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>¿Qué sigue ahora?</Text>
          <Text style={styles.infoBody}>
            Si todo es correcto, recibirás un mail de confirmación para comenzar a operar.
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={styles.btn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('MetodosPago')}>
          <Text style={styles.btnText}>Volver a mis métodos</Text>
        </TouchableOpacity>

      </View>

      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },

  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, paddingHorizontal: spacing.base, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.borderMuted, gap: spacing.xs,
  },
  backBtn: { padding: 2 },
  brand:   { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.primary },

  container: {
    flex: 1, paddingHorizontal: spacing.xl, paddingTop: 36, paddingBottom: spacing.xl, alignItems: 'center',
  },

  iconCard: {
    alignItems: 'center', backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xl, padding: spacing.xl, width: '100%', marginBottom: spacing['2xl'],
  },
  progressTrack: {
    width: '60%', height: 4, backgroundColor: colors.borderMuted,
    borderRadius: 2, marginTop: 18, overflow: 'hidden',
  },
  progressFill:   { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  verifyingLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.primary, marginTop: 10, letterSpacing: 1 },

  title: {
    fontSize: fontSize['3xl'], fontWeight: 'bold', color: colors.text,
    textAlign: 'center', marginBottom: spacing.md,
  },
  body: {
    fontSize: fontSize.base, color: colors.textMuted, textAlign: 'center',
    lineHeight: 22, marginBottom: spacing.xl,
  },

  infoBox: {
    backgroundColor: colors.infoSoft, borderRadius: radius.lg,
    padding: spacing.base, width: '100%', gap: 6,
  },
  infoTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  infoBody:  { fontSize: fontSize.sm, color: colors.primary, textAlign: 'center', lineHeight: 20 },

  btn: {
    backgroundColor: colors.primary, borderRadius: radius.base, height: controlHeight.base,
    width: '100%', alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: colors.textInverse, fontSize: fontSize.lg, fontWeight: '600' },
});
