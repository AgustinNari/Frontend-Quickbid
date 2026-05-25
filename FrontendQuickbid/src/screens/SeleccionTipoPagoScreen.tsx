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

type Props = NativeStackScreenProps<RootStackParamList, 'SeleccionTipoPago'>;

const BLUE = '#0055D1';

// ── Iconos ────────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CardIcon({ active }: { active: boolean }) {
  const c = active ? BLUE : '#6B7280';
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={c} strokeWidth="1.7" />
      <Path d="M2 10h20" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

function BankIcon({ active }: { active: boolean }) {
  const c = active ? BLUE : '#6B7280';
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M3 10h18M5 6l7-3 7 3" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 10v11M10 10v11M14 10v11M18 10v11" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

function CheckDocIcon({ active }: { active: boolean }) {
  const c = active ? BLUE : '#6B7280';
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
      <Circle cx="11" cy="11" r="10" stroke={active ? BLUE : '#D1D5DB'} strokeWidth="1.8" />
      {active && <Circle cx="11" cy="11" r="6" fill={BLUE} />}
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
  safe: { flex: 1, backgroundColor: '#F3F4F6' },

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
  brand:   { fontSize: 18, fontWeight: 'bold', color: BLUE },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
  },

  title:    { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 28 },

  // Opciones
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 14,
    gap: 14,
  },
  optionActive: {
    borderColor: BLUE,
    backgroundColor: '#FFFFFF',
  },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#EFF6FF',
  },

  optionText: { flex: 1 },
  optionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 3,
  },
  optionNameActive: {
    color: BLUE,
  },
  optionDesc: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Footer con botón
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F3F4F6',
    paddingBottom: 16,
  },
  btn: {
    backgroundColor: BLUE,
    borderRadius: 10,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
