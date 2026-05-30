import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, { NavTab } from '../components/BottomNavBar';
import { colors, spacing, radius, fontSize, controlHeight } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SeleccionTipoPago'>;

// ── Iconos ────────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CardIcon({ active }: { active: boolean }) {
  const c = active ? colors.primary : colors.textMuted;
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={c} strokeWidth="1.7" />
      <Path d="M2 10h20" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

function BankIcon({ active }: { active: boolean }) {
  const c = active ? colors.primary : colors.textMuted;
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M3 10h18M5 6l7-3 7 3" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 10v11M10 10v11M14 10v11M18 10v11" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

function CheckDocIcon({ active }: { active: boolean }) {
  const c = active ? colors.primary : colors.textMuted;
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2" stroke={c} strokeWidth="1.7" />
      <Path d="M8 10h8M8 14h5M8 6h8" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

function RadioIcon({ active }: { active: boolean }) {
  return (
    <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <Circle cx="11" cy="11" r="10" stroke={active ? colors.primary : colors.border} strokeWidth="1.8" />
      {active && <Circle cx="11" cy="11" r="6" fill={colors.primary} />}
    </Svg>
  );
}

// ── Opciones ──────────────────────────────────────────────────────────────────

type PaymentType = 'card' | 'bank' | 'check';

const OPTIONS: { id: PaymentType; name: string; desc: string }[] = [
  { id: 'card',  name: 'Crédito / Débito',     desc: 'Visa, Mastercard, Amex.'         },
  { id: 'bank',  name: 'Cuenta Bancaria',       desc: 'Transferencia vía CBU o CVU.'   },
  { id: 'check', name: 'Cheque Certificado',    desc: 'Depósito físico o de caja.'     },
];

const ICONS: Record<PaymentType, (active: boolean) => React.ReactNode> = {
  card:  (a) => <CardIcon     active={a} />,
  bank:  (a) => <BankIcon     active={a} />,
  check: (a) => <CheckDocIcon active={a} />,
};

// ── Pantalla ──────────────────────────────────────────────────────────────────

export default function SeleccionTipoPagoScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<PaymentType>('card');
  const [activeTab, setActiveTab] = useState<NavTab>('subastas');

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.brand}>QuickBid</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.title}>Seleccionar tipo</Text>
        <Text style={styles.subtitle}>Elige el método que deseas vincular hoy.</Text>

        {OPTIONS.map(opt => {
          const active = selected === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => setSelected(opt.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                {ICONS[opt.id](active)}
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionName, active && styles.optionNameActive]}>
                  {opt.name}
                </Text>
                <Text style={styles.optionDesc}>{opt.desc}</Text>
              </View>
              <RadioIcon active={active} />
            </TouchableOpacity>
          );
        })}

      </ScrollView>

      {/* Botón fijo antes de la navbar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btn}
          activeOpacity={0.85}
          onPress={() => {
            if (selected === 'card')  navigation.navigate('NuevaTarjeta');
            if (selected === 'bank')  navigation.navigate('CuentaBancaria');
            if (selected === 'check') navigation.navigate('ChequeCertificado');
          }}>
          <Text style={styles.btnText}>Siguiente</Text>
        </TouchableOpacity>
      </View>

      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} />

    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

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
  brand:   { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.primary },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 28,
    paddingBottom: spacing.xl,
  },

  title:    { fontSize: fontSize['4xl'], fontWeight: 'bold', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: fontSize.base, color: colors.textMuted, marginBottom: 28 },

  // Opciones
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderMuted,
    padding: spacing.base,
    marginBottom: 14,
    gap: 14,
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.base,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.infoSoft,
  },

  optionText: { flex: 1 },
  optionName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textLabel,
    marginBottom: 3,
  },
  optionNameActive: {
    color: colors.primary,
  },
  optionDesc: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },

  // Footer con botón
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    backgroundColor: colors.background,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.base,
    height: controlHeight.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: colors.textInverse, fontSize: fontSize.lg, fontWeight: '600' },
});
