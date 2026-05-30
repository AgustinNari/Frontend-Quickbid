import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, radius, fontSize, fontWeight, layout } from '../theme';
import BottomNavBar, { NavTab, BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { MOCK_NOTIFICACIONES, Notificacion, NotifTipo } from '../mocks/notificaciones';

type Props = NativeStackScreenProps<RootStackParamList, 'Notificaciones'>;

// ── Iconos por tipo ───────────────────────────────────────────────────────────

function IconSubasta() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L2 7l10 5 10-5-10-5z" stroke={colors.white} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M2 17l10 5 10-5" stroke={colors.white} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 12l10 5 10-5" stroke={colors.white} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconConsigna() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M9 12l2 2 4-4" stroke={colors.white} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={colors.white} strokeWidth="1.8" />
    </Svg>
  );
}

function IconPago() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={colors.white} strokeWidth="1.8" />
      <Path d="M2 10h20" stroke={colors.white} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function IconCatalogo() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={colors.white} strokeWidth="1.8" />
      <Path d="M7 8h10M7 12h10M7 16h6" stroke={colors.white} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function IconPuja() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M12 19V5M5 12l7-7 7 7" stroke={colors.white} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Config visual por tipo ────────────────────────────────────────────────────

const TIPO_CONFIG: Record<NotifTipo, { bg: string; icon: React.ReactNode }> = {
  subasta:  { bg: colors.primary,  icon: <IconSubasta /> },
  consigna: { bg: '#16A34A',       icon: <IconConsigna /> },
  puja:     { bg: '#D97706',       icon: <IconPuja /> },
  pago:     { bg: '#16A34A',       icon: <IconPago /> },
  catalogo: { bg: colors.textMuted, icon: <IconCatalogo /> },
};

// ── Tabs ──────────────────────────────────────────────────────────────────────

type TabFiltro = 'todo' | 'subasta' | 'consigna' | 'pago';

const TABS: { id: TabFiltro; label: string }[] = [
  { id: 'todo',     label: 'Todo'      },
  { id: 'subasta',  label: 'Subastas'  },
  { id: 'consigna', label: 'Consignas' },
  { id: 'pago',     label: 'Pagos'     },
];

// ── Ítem de notificación ──────────────────────────────────────────────────────

function NotifItem({ notif }: { notif: Notificacion }) {
  const cfg = TIPO_CONFIG[notif.tipo];
  return (
    <TouchableOpacity style={[styles.item, !notif.leida && styles.itemUnread]} activeOpacity={0.7}>
      <View style={[styles.iconCircle, { backgroundColor: cfg.bg }]}>
        {cfg.icon}
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.itemTitulo} numberOfLines={1}>{notif.titulo}</Text>
        <Text style={styles.itemCuerpo} numberOfLines={2}>{notif.cuerpo}</Text>
        <Text style={styles.itemHora}>{notif.hora}</Text>
      </View>
      {!notif.leida && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────────────────

export default function NotificacionesScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<NavTab>('notif');
  const [filtro, setFiltro] = useState<TabFiltro>('todo');
  const [notifs, setNotifs] = useState(MOCK_NOTIFICACIONES);

  const filtradas = useMemo(() => {
    if (filtro === 'todo') return notifs;
    if (filtro === 'subasta') return notifs.filter(n => n.tipo === 'subasta' || n.tipo === 'puja');
    if (filtro === 'consigna') return notifs.filter(n => n.tipo === 'consigna' || n.tipo === 'catalogo');
    if (filtro === 'pago') return notifs.filter(n => n.tipo === 'pago');
    return notifs;
  }, [notifs, filtro]);

  const sinLeer = notifs.filter(n => !n.leida).length;

  const grupos = useMemo(() => {
    const map: Record<string, Notificacion[]> = {};
    for (const n of filtradas) {
      if (!map[n.grupo]) map[n.grupo] = [];
      map[n.grupo].push(n);
    }
    return map;
  }, [filtradas]);

  const marcarTodoLeido = () => {
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
  };

  const isEmpty = filtradas.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader />

      {/* Subheader */}
      <View style={styles.subheader}>
        <View style={styles.subheaderLeft}>
          <Text style={styles.titulo}>Notificaciones</Text>
          {sinLeer > 0 && (
            <Text style={styles.sinLeer}>{sinLeer} sin leer</Text>
          )}
        </View>
        {sinLeer > 0 && (
          <TouchableOpacity onPress={marcarTodoLeido} activeOpacity={0.7}>
            <Text style={styles.marcarLeido}>Marcar todo leído</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, filtro === tab.id && styles.tabActive]}
            onPress={() => setFiltro(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, filtro === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isEmpty ? (
        /* Empty state */
        <View style={styles.emptyWrap}>
          <View style={styles.emptyCircle}>
            <Svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <Path d="M9 12l2 2 4-4" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <Circle cx="12" cy="12" r="9" stroke="#16A34A" strokeWidth="2" />
            </Svg>
          </View>
          <Text style={styles.emptyTitle}>Estás al día</Text>
          <Text style={styles.emptyBody}>No tenés notificaciones.{'\n'}Te avisamos cuando pase algo.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {['HOY', 'AYER', 'ESTA SEMANA'].map(grupo => {
            const items = grupos[grupo];
            if (!items?.length) return null;
            return (
              <View key={grupo}>
                <Text style={styles.grupoLabel}>{grupo}</Text>
                {items.map(n => <NotifItem key={n.id} notif={n} />)}
              </View>
            );
          })}
        </ScrollView>
      )}

      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} navigation={navigation} />
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  subheader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  subheaderLeft: { gap: 2 },
  titulo: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  sinLeer: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  marcarLeido: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  tab: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  tabLabelActive: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },

  // Lista
  scroll: {
    paddingTop: spacing.base,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg,
  },
  grupoLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textSubtle,
    letterSpacing: 0.8,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  itemUnread: {
    backgroundColor: colors.infoSoft,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemBody: {
    flex: 1,
    gap: 3,
  },
  itemTitulo: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  itemCuerpo: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 18,
  },
  itemHora: {
    fontSize: fontSize.xs,
    color: colors.textSubtle,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
    flexShrink: 0,
  },

  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    paddingBottom: BOTTOM_NAV_HEIGHT,
  },
  emptyCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  emptyBody: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
