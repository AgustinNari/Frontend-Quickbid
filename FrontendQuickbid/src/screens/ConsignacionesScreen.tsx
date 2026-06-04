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
import { colors, spacing, radius, fontSize, fontWeight, layout } from '../theme';
import BottomNavBar, { NavTab, BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { MOCK_CONSIGNACIONES, Consignacion, EstadoConsignacion } from '../mocks/consignaciones';

type Props = NativeStackScreenProps<RootStackParamList, 'Consignaciones'>;

// ── Tipos de tab ──────────────────────────────────────────────────────────────

type TabId = EstadoConsignacion;

const TABS: { id: TabId; label: string }[] = [
  { id: 'activa',    label: 'Activas'    },
  { id: 'rechazada', label: 'Rechazadas' },
  { id: 'vendida',   label: 'Vendidas'   },
];

// ── Ícono vacío ───────────────────────────────────────────────────────────────

function EmptyIcon() {
  return (
    <Svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <Rect x="8" y="8" width="56" height="56" rx="14" fill={colors.infoSoft} />
      <Path
        d="M36 22L22 29l14 7 14-7-14-7z"
        stroke={colors.primary} strokeWidth="2" strokeLinejoin="round"
      />
      <Path
        d="M22 43l14 7 14-7M22 36l14 7 14-7"
        stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Ícono imagen placeholder ──────────────────────────────────────────────────

function ThumbPlaceholder() {
  return (
    <View style={itemStyles.thumb}>
      <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="3" width="18" height="18" rx="3" stroke={colors.textSubtle} strokeWidth="1.5" />
        <Circle cx="8.5" cy="8.5" r="1.5" fill={colors.textSubtle} />
        <Path d="M21 15l-5-5L5 21" stroke={colors.textSubtle} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function Badge({ count }: { count: number }) {
  return (
    <View style={itemStyles.badge}>
      <Text style={itemStyles.badgeText}>{count}</Text>
    </View>
  );
}

// ── Fila de item ──────────────────────────────────────────────────────────────

function ConsignacionItem({ item, onVerDetalle }: { item: Consignacion; onVerDetalle: () => void }) {
  return (
    <View style={itemStyles.card}>
      <ThumbPlaceholder />
      <View style={itemStyles.info}>
        <View style={itemStyles.titleRow}>
          <Text style={itemStyles.nombre} numberOfLines={1}>{item.nombre}</Text>
          {item.badge != null && item.badge > 0 && <Badge count={item.badge} />}
        </View>
        <Text style={itemStyles.precio}>{item.precio}</Text>
        <Text style={itemStyles.detalle}>{item.detalle}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onVerDetalle}>
          <Text style={itemStyles.verDetalle}>Ver detalle ›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const itemStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    marginBottom: spacing.md,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  info: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nombre: { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  badge: {
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.white },
  precio: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  detalle: { fontSize: fontSize.sm, color: colors.textMuted },
  verDetalle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.primary, marginTop: 2 },
});

// ── Estado vacío ──────────────────────────────────────────────────────────────

const STEPS = [
  { n: '1', titulo: 'Cargá el bien',      sub: 'Fotos + datos del objeto' },
  { n: '2', titulo: 'Validamos origen',   sub: 'Revisión interna en 1-3 días' },
  { n: '3', titulo: 'Coordiná la venta',  sub: 'Ponlo desde el 25% de la cuenta' },
];

function EmptyState({ onConsignar }: { onConsignar: () => void }) {
  return (
    <View style={emptyStyles.wrap}>
      <EmptyIcon />
      <Text style={emptyStyles.titulo}>Todavía no consignes</Text>
      <Text style={emptyStyles.sub}>
        Subí tu primer bien y lo ponemos{'\n'}en subasta en 48 horas.
      </Text>

      <View style={emptyStyles.steps}>
        {STEPS.map((s, i) => (
          <View key={i} style={emptyStyles.step}>
            <View style={emptyStyles.stepNum}>
              <Text style={emptyStyles.stepNumText}>{s.n}</Text>
            </View>
            <View style={emptyStyles.stepInfo}>
              <Text style={emptyStyles.stepTitulo}>{s.titulo}</Text>
              <Text style={emptyStyles.stepSub}>{s.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={emptyStyles.btn} activeOpacity={0.85} onPress={onConsignar}>
        <Text style={emptyStyles.btnText}>Consignar mi primer bien</Text>
      </TouchableOpacity>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: spacing.xl * 2 },
  titulo: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.text, marginTop: spacing.xl, textAlign: 'center' },
  sub: { fontSize: fontSize.base, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },
  steps: { width: '100%', marginTop: spacing.xl * 1.5, gap: spacing.base },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  stepNum: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNumText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.white },
  stepInfo: { flex: 1, paddingTop: 4 },
  stepTitulo: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  stepSub: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  btn: {
    marginTop: spacing.xl * 1.5,
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  btnText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.white },
});

// ── Pantalla ──────────────────────────────────────────────────────────────────

export default function ConsignacionesScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<NavTab>('consignar');
  const [tab, setTab] = useState<TabId>('activa');

  const items = MOCK_CONSIGNACIONES.filter(c => c.estado === tab);

  const counts: Record<TabId, number> = {
    activa:    MOCK_CONSIGNACIONES.filter(c => c.estado === 'activa').length,
    rechazada: MOCK_CONSIGNACIONES.filter(c => c.estado === 'rechazada').length,
    vendida:   MOCK_CONSIGNACIONES.filter(c => c.estado === 'vendida').length,
  };

  const activasCount = counts.activa;
  const vendidaMes = 1; // mock

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.titulo}>Mis consignaciones</Text>
        {activasCount > 0 && (
          <Text style={styles.subtitulo}>
            {activasCount} activa{activasCount !== 1 ? 's' : ''} · {vendidaMes} publicada este mes
          </Text>
        )}

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tab, tab === t.id && styles.tabActive]}
              onPress={() => setTab(t.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, tab === t.id && styles.tabLabelActive]}>
                {t.label}
                <Text style={[styles.tabCount, tab === t.id && styles.tabCountActive]}>
                  {' '}({counts[t.id]})
                </Text>
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lista o empty */}
        {items.length === 0
          ? <EmptyState onConsignar={() => navigation.navigate('AltaConsignacion')} />
          : items.map(item => (
              <ConsignacionItem
                key={item.id}
                item={item}
                onVerDetalle={() => navigation.navigate('ConsignacionDetail', { id: item.id })}
              />
            ))
        }

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => navigation.navigate('AltaConsignacion')}>
        <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <Path d="M12 5v14M5 12h14" stroke={colors.white} strokeWidth="2.2" strokeLinecap="round" />
        </Svg>
      </TouchableOpacity>

      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} navigation={navigation} />
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.xl,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg,
  },

  titulo: { fontSize: fontSize['4xl'], fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.xs },
  subtitulo: { fontSize: fontSize.base, color: colors.textMuted, marginBottom: spacing.base },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  tabActive: { backgroundColor: colors.primary },
  tabLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textMuted },
  tabLabelActive: { color: colors.white, fontWeight: fontWeight.semibold },
  tabCount: { fontSize: fontSize.sm, color: colors.textSubtle },
  tabCountActive: { color: 'rgba(255,255,255,0.75)' },

  // FAB
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: BOTTOM_NAV_HEIGHT + spacing.base,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
});
