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
import BottomNavBar, {
  NavTab,
  BOTTOM_NAV_HEIGHT,
} from '../components/BottomNavBar';
import { colors, spacing, radius, fontSize, controlHeight } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'SeleccionTipoPago'>;

function CardIcon({ active }: { active: boolean }) {
  const c = active ? colors.primary : colors.textMuted;
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="2"
        stroke={c}
        strokeWidth="1.7"
      />
      <Path d="M2 10h20" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

function BankIcon({ active }: { active: boolean }) {
  const c = active ? colors.primary : colors.textMuted;
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M3 10h18M5 6l7-3 7 3"
        stroke={c}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 10v11M10 10v11M14 10v11M18 10v11"
        stroke={c}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CheckDocIcon({ active }: { active: boolean }) {
  const c = active ? colors.primary : colors.textMuted;
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Rect
        x="4"
        y="2"
        width="16"
        height="20"
        rx="2"
        stroke={c}
        strokeWidth="1.7"
      />
      <Path
        d="M8 10h8M8 14h5M8 6h8"
        stroke={c}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function RadioIcon({ active }: { active: boolean }) {
  return (
    <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <Circle
        cx="11"
        cy="11"
        r="10"
        stroke={active ? colors.primary : colors.border}
        strokeWidth="1.8"
      />
      {active && <Circle cx="11" cy="11" r="6" fill={colors.primary} />}
    </Svg>
  );
}

type PaymentType = 'card' | 'bank' | 'check';

const OPTIONS: { id: PaymentType; name: string; desc: string }[] = [
  { id: 'card', name: 'Crédito / Débito', desc: 'Visa, Mastercard, Amex.' },
  { id: 'bank', name: 'Cuenta Bancaria', desc: 'Transferencia vía CBU o CVU.' },
  {
    id: 'check',
    name: 'Cheque Certificado',
    desc: 'Depósito físico o de caja.',
  },
];

const ICONS: Record<PaymentType, (active: boolean) => React.ReactNode> = {
  card: a => <CardIcon active={a} />,
  bank: a => <BankIcon active={a} />,
  check: a => <CheckDocIcon active={a} />,
};

export default function SeleccionTipoPagoScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<PaymentType>('card');
  const [activeTab, setActiveTab] = useState<NavTab>('subastas');

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Seleccionar tipo</Text>
        <Text style={styles.subtitle}>
          Elegí el método que deseás vincular hoy.
        </Text>

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
                <Text
                  style={[styles.optionName, active && styles.optionNameActive]}
                >
                  {opt.name}
                </Text>
                <Text style={styles.optionDesc}>{opt.desc}</Text>
              </View>
              <RadioIcon active={active} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btn}
          activeOpacity={0.85}
          onPress={() => {
            if (selected === 'card') navigation.navigate('NuevaTarjeta');
            if (selected === 'bank') navigation.navigate('CuentaBancaria');
            if (selected === 'check') navigation.navigate('ChequeCertificado');
          }}
        >
          <Text style={styles.btnText}>Siguiente</Text>
        </TouchableOpacity>
      </View>

      <BottomNavBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 28,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg,
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

  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    paddingBottom: spacing.base,
    marginBottom: BOTTOM_NAV_HEIGHT,
    backgroundColor: colors.background,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.base,
    height: controlHeight.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
});
