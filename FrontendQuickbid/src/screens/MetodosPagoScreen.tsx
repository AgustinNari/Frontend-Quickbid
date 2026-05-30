import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, { NavTab, BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { colors, spacing, radius, fontSize, shadow } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'MetodosPago'>;

const SCREEN_W = Dimensions.get('window').width;

// ── Iconos ────────────────────────────────────────────────────────────────────

function CardIcon() {
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={colors.textMuted} strokeWidth="1.6" />
      <Path d="M2 10h20" stroke={colors.textMuted} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function BankIcon() {
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M3 10h18M5 6l7-3 7 3" stroke={colors.textMuted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 10v11M10 10v11M14 10v11M18 10v11" stroke={colors.textMuted} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function CheckDocIcon() {
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2" stroke={colors.textMuted} strokeWidth="1.6" />
      <Path d="M8 10h8M8 14h5M8 6h8" stroke={colors.textMuted} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function DotsIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5"  r="1.3" fill={colors.textMuted} />
      <Circle cx="12" cy="12" r="1.3" fill={colors.textMuted} />
      <Circle cx="12" cy="19" r="1.3" fill={colors.textMuted} />
    </Svg>
  );
}

function StarIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={colors.textMuted} strokeWidth="1.6" strokeLinejoin="round"
      />
    </Svg>
  );
}

function TrashIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
        stroke={colors.danger} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Datos hardcodeados — TODO: reemplazar con datos reales del backend ─────────

type PaymentMethod = {
  id: number;
  type: 'card' | 'bank' | 'check';
  name: string;
  details: string;
  isPrincipal: boolean;
};

const MOCK_METHODS: PaymentMethod[] = [
  { id: 1, type: 'card',  name: 'Visa Signature',      details: 'Termina en 1009 • Vence 08/26',    isPrincipal: true  },
  { id: 2, type: 'bank',  name: 'Cuenta Corriente',    details: 'Banco Galicia •••• 5590',           isPrincipal: false },
  { id: 3, type: 'check', name: 'Cheque Certificado',  details: 'Verificación pendiente • ID: 299',  isPrincipal: false },
];

// ── Item de método de pago ────────────────────────────────────────────────────

type ItemProps = {
  method: PaymentMethod;
  onDotsPress: (ref: TouchableOpacity | null) => void;
};

function PaymentItem({ method, onDotsPress }: ItemProps) {
  const dotsRef = useRef<TouchableOpacity>(null);
  const icons   = { card: <CardIcon />, bank: <BankIcon />, check: <CheckDocIcon /> };

  return (
    <View style={styles.itemRow}>
      <View style={styles.itemIconWrap}>{icons[method.type]}</View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{method.name}</Text>
        <Text style={styles.itemDetails}>{method.details}</Text>
        {method.isPrincipal && (
          <View style={styles.principalBadge}>
            <Text style={styles.principalText}>PRINCIPAL</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        ref={dotsRef}
        onPress={() => onDotsPress(dotsRef.current)}
        style={styles.dotsBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <DotsIcon />
      </TouchableOpacity>
    </View>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────────────────

export default function MetodosPagoScreen({ navigation }: Props) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos,    setMenuPos]    = useState({ top: 0, right: 0 });
  const [activeTab,  setActiveTab]  = useState<NavTab>('subastas');

  const handleDotsPress = (id: number, btn: TouchableOpacity | null) => {
    btn?.measureInWindow((x, y, width, height) => {
      setMenuPos({
        top:   y + height + 4,
        right: SCREEN_W - x - width,
      });
      setOpenMenuId(id);
    });
  };

  const closeMenu = () => setOpenMenuId(null);

  return (
    <SafeAreaView style={styles.safe}>

      <ScreenHeader onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Métodos de pago</Text>
        <Text style={styles.subtitle}>Gestiona tus métodos de pago.</Text>

        {/* Encabezado de sección */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Elementos guardados</Text>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={() => navigation.navigate('SeleccionTipoPago')}>
            <Text style={styles.addBtnText}>+ Agregar nuevo</Text>
          </TouchableOpacity>
        </View>

        {/* Lista */}
        <View style={styles.listCard}>
          {MOCK_METHODS.map((m, index) => (
            <View key={m.id}>
              <PaymentItem
                method={m}
                onDotsPress={(ref) => handleDotsPress(m.id, ref)}
              />
              {index < MOCK_METHODS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal del menú — cubre toda la pantalla para cerrar al tocar fuera */}
      <Modal
        visible={openMenuId !== null}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        {/* Backdrop flex:1 — cualquier toque fuera del menú lo cierra */}
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={closeMenu}
          activeOpacity={1}
        >
          {/* Menú envuelto en TouchableOpacity sin onPress — absorbe toques para no cerrar */}
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.dropdown, { top: menuPos.top, right: menuPos.right }]}
          >
            <TouchableOpacity style={styles.dropdownItem} onPress={closeMenu}>
              <Text style={styles.dropdownText}>Fijar como principal</Text>
              <StarIcon />
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity style={styles.dropdownItem} onPress={closeMenu}>
              <Text style={styles.dropdownDanger}>Borrar método</Text>
              <TrashIcon />
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} navigation={navigation} />

    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg,
  },

  title:    { fontSize: fontSize['4xl'], fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: fontSize.base, color: colors.textMuted, marginBottom: 28 },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  addBtnText: { color: colors.textInverse, fontSize: fontSize.sm, fontWeight: '600' },

  listCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  divider: { height: 1, backgroundColor: colors.background, marginHorizontal: spacing.base },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    gap: spacing.md,
  },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo:    { flex: 1 },
  itemName:    { fontSize: fontSize.base, fontWeight: '600', color: colors.text, marginBottom: 2 },
  itemDetails: { fontSize: fontSize.sm, color: colors.textMuted },

  principalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 5,
  },
  principalText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textInverse, letterSpacing: 0.5 },

  dotsBtn: { padding: 4 },

  // Dropdown via Modal
  dropdown: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    minWidth: 190,
    ...shadow.lg,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    gap: spacing.md,
  },
  dropdownText:    { fontSize: fontSize.base, color: colors.text },
  dropdownDanger:  { fontSize: fontSize.base, color: colors.danger, fontWeight: '500' },
  dropdownDivider: { height: 1, backgroundColor: colors.background },
});
