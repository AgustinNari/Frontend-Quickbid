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
import BottomNavBar, { NavTab } from '../components/BottomNavBar';

type Props = NativeStackScreenProps<RootStackParamList, 'MetodosPago'>;

const BLUE        = '#0055D1';
const SCREEN_W    = Dimensions.get('window').width;

// ── Iconos ────────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CardIcon() {
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke="#6B7280" strokeWidth="1.6" />
      <Path d="M2 10h20" stroke="#6B7280" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function BankIcon() {
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M3 10h18M5 6l7-3 7 3" stroke="#6B7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 10v11M10 10v11M14 10v11M18 10v11" stroke="#6B7280" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function CheckDocIcon() {
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2" stroke="#6B7280" strokeWidth="1.6" />
      <Path d="M8 10h8M8 14h5M8 6h8" stroke="#6B7280" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function DotsIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5"  r="1.3" fill="#6B7280" />
      <Circle cx="12" cy="12" r="1.3" fill="#6B7280" />
      <Circle cx="12" cy="19" r="1.3" fill="#6B7280" />
    </Svg>
  );
}

function StarIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke="#6B7280" strokeWidth="1.6" strokeLinejoin="round"
      />
    </Svg>
  );
}

function TrashIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
        stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.brand}>QuickBid</Text>
      </View>

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
    paddingTop: 24,
    paddingBottom: 32,
  },

  title:    { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 28 },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  addBtn: {
    backgroundColor: BLUE,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo:    { flex: 1 },
  itemName:    { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  itemDetails: { fontSize: 12, color: '#6B7280' },

  principalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: BLUE,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 5,
  },
  principalText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },

  dotsBtn: { padding: 4 },

  // Dropdown via Modal
  dropdown: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 190,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dropdownText:    { fontSize: 14, color: '#111827' },
  dropdownDanger:  { fontSize: 14, color: '#EF4444', fontWeight: '500' },
  dropdownDivider: { height: 1, backgroundColor: '#F3F4F6' },
});
