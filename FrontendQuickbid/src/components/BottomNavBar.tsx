import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';

const BLUE  = '#0055D1';
const GRAY  = '#6B7280';
const WHITE = '#FFFFFF';

const BAR_HEIGHT    = 68;
const LOGO_SIZE     = 64;
const LOGO_OVERHANG = 26; // cuánto sobresale el logo por encima de la barra

// ── Iconos ────────────────────────────────────────────────────────────────────

function BellIcon({ active }: { active: boolean }) {
  const c = active ? BLUE : GRAY;
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function PlusCircleIcon({ active }: { active: boolean }) {
  const c = active ? BLUE : GRAY;
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
      <Path d="M12 8v8M8 12h8" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function BagIcon({ active }: { active: boolean }) {
  const c = active ? BLUE : GRAY;
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 6h18" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M16 10a4 4 0 0 1-8 0" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function MenuIcon({ active }: { active: boolean }) {
  const c = active ? BLUE : GRAY;
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Line x1="3" y1="6"  x2="21" y2="6"  stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="12" x2="21" y2="12" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="18" x2="21" y2="18" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type NavTab = 'notif' | 'consignar' | 'subastas' | 'compras' | 'menu';

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onPress: () => void;
};

function NavItem({ icon, label, active, onPress }: NavItemProps) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      {icon}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Componente ────────────────────────────────────────────────────────────────

type Props = {
  activeTab?: NavTab;
  onTabPress?: (tab: NavTab) => void;
};

export default function BottomNavBar({ activeTab = 'subastas', onTabPress }: Props) {
  const press = (tab: NavTab) => onTabPress?.(tab);

  return (
    // El wrapper ocupa espacio en el layout (no es absolute)
    // Su altura = LOGO_OVERHANG + BAR_HEIGHT
    <View style={styles.wrapper}>

      {/* Logo central — posicionado absolute dentro del wrapper, sobresale hacia arriba */}
      <View style={styles.centerElevated}>
        <TouchableOpacity
          style={styles.centerCircle}
          onPress={() => press('subastas')}
          activeOpacity={0.85}
        >
          <Image
            source={require('../assets/images/navBarLogo.png')}
            style={styles.centerLogo}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Barra blanca */}
      <View style={styles.bar}>
        <NavItem icon={<BellIcon       active={activeTab === 'notif'}     />} label="NOTIF."    active={activeTab === 'notif'}     onPress={() => press('notif')}     />
        <NavItem icon={<PlusCircleIcon active={activeTab === 'consignar'} />} label="CONSIGNAR" active={activeTab === 'consignar'} onPress={() => press('consignar')} />

        {/* Espacio central con el label */}
        <TouchableOpacity style={styles.centerSpace} onPress={() => press('subastas')} activeOpacity={0.7}>
          <Text style={[styles.label, activeTab === 'subastas' && styles.labelActive]}>SUBASTAS</Text>
        </TouchableOpacity>

        <NavItem icon={<BagIcon  active={activeTab === 'compras'} />} label="COMPRAS" active={activeTab === 'compras'} onPress={() => press('compras')} />
        <NavItem icon={<MenuIcon active={activeTab === 'menu'}    />} label="MENÚ"    active={activeTab === 'menu'}    onPress={() => press('menu')}    />
      </View>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Wrapper en flujo normal — empuja el contenido hacia arriba
  wrapper: {
    height: LOGO_OVERHANG + BAR_HEIGHT,
  },

  // Logo: absolute dentro del wrapper, centrado, zIndex alto
  centerElevated: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  centerCircle: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 0,
  },
  centerLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },

  // Barra blanca — empieza después del overhang
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BAR_HEIGHT,
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'flex-end',
    paddingBottom: 14,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 12,
  },

  item:        { flex: 1, alignItems: 'center', gap: 4 },
  centerSpace: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },

  label: {
    fontSize: 10,
    fontWeight: '500',
    color: GRAY,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: BLUE,
    fontWeight: '700',
  },
});
