import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, radius, fontSize, fontWeight, layout } from '../theme';
import BottomNavBar, { NavTab, BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { notificacionesApi, NotificacionData } from '../api/notificaciones';
import { FadeIn } from '../components/FadeIn';

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

// ── Config visual por tipo (mapeado desde tipos del backend) ──────────────────

type NotifTipoVisual = 'subasta' | 'consigna' | 'puja' | 'pago' | 'catalogo';

const TIPO_CONFIG: Record<NotifTipoVisual, { bg: string; icon: React.ReactNode }> = {
  subasta:  { bg: colors.primary,   icon: <IconSubasta /> },
  consigna: { bg: '#16A34A',        icon: <IconConsigna /> },
  puja:     { bg: '#D97706',        icon: <IconPuja /> },
  pago:     { bg: '#16A34A',        icon: <IconPago /> },
  catalogo: { bg: colors.textMuted, icon: <IconCatalogo /> },
};

/** Mapea el tipo del backend al visual del frontend */
function tipoVisual(tipo: string): NotifTipoVisual {
  if (tipo === 'puja_superada' || tipo === 'puja_ganada') return 'puja';
  if (tipo === 'subasta_por_comenzar')                    return 'subasta';
  if (tipo === 'catalogo_nuevo')                          return 'catalogo';
  if (tipo === 'consignacion_aprobada' || tipo === 'consignacion_rechazada' || tipo === 'documentacion_solicitada' || tipo === 'acuerdo_pendiente') return 'consigna';
  if (tipo === 'medio_pago_verificado' || tipo === 'multa_asignada')        return 'pago';
  return 'subasta';
}

/** Título legible desde el tipo del backend */
function tituloDesde(tipo: string): string {
  const map: Record<string, string> = {
    puja_superada:             'Tu puja fue superada',
    puja_ganada:               'Ganaste la subasta',
    subasta_por_comenzar:      'Subasta por comenzar',
    catalogo_nuevo:            'Nuevo catálogo disponible',
    consignacion_aprobada:     'Consignación aprobada',
    consignacion_rechazada:    'Consignación rechazada',
    documentacion_solicitada:  'Documentación requerida',
    acuerdo_pendiente:         'Acuerdo pendiente',
    medio_pago_verificado:     'Medio de pago verificado',
    multa_asignada:            'Multa asignada',
  };
  return map[tipo] ?? tipo;
}

/** Grupo (HOY / AYER / ESTA SEMANA) desde la fecha */
function grupoDesde(fechaIso: string): string {
  const ahora = new Date();
  const fecha = new Date(fechaIso);
  const diffMs = ahora.getTime() - fecha.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDias === 0) return 'HOY';
  if (diffDias === 1) return 'AYER';
  return 'ESTA SEMANA';
}

/** Hora legible desde fecha ISO */
function horaDesde(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

/** Tipo interno de la pantalla (derivado del backend) */
interface Notificacion {
  id: number;
  tipo: NotifTipoVisual;
  categoria: 'subastas' | 'transacciones';
  titulo: string;
  cuerpo: string;
  hora: string;
  grupo: string;
  leida: boolean;
}

function adaptarNotificacion(n: NotificacionData): Notificacion {
  return {
    id:        n.id,
    tipo:      tipoVisual(n.tipo),
    categoria: n.categoria,
    titulo:    tituloDesde(n.tipo),
    cuerpo:    n.mensaje,
    hora:      horaDesde(n.fechaCreacion),
    grupo:     grupoDesde(n.fechaCreacion),
    leida:     n.leida,
  };
}

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
  const [filtro,    setFiltro]    = useState<TabFiltro>('todo');
  const [notifs,    setNotifs]    = useState<Notificacion[]>([]);
  const [noLeidas,  setNoLeidas]  = useState(0);
  const [loading,   setLoading]   = useState(true);

  const cargar = useCallback(async (tab: TabFiltro) => {
    try {
      setLoading(true);
      // Traemos todas las notificaciones y filtramos localmente
      // para evitar pérdida de datos cuando 'consigna' y 'pago' comparten
      // la misma categoría API ('transacciones') pero son tipos visuales distintos.
      const res = await notificacionesApi.listar({});
      if (res.data) {
        let items = res.data.notificaciones.map(adaptarNotificacion);
        if (tab === 'subasta')  items = items.filter(n => n.tipo === 'subasta' || n.tipo === 'puja' || n.tipo === 'catalogo');
        if (tab === 'consigna') items = items.filter(n => n.tipo === 'consigna');
        if (tab === 'pago')     items = items.filter(n => n.tipo === 'pago');
        setNotifs(items);
        setNoLeidas(res.data.noLeidas);
      }
    } catch {
      // sin conexión: mantiene la lista anterior
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(filtro); }, [filtro, cargar]);

  const filtradas = notifs; // ya filtradas por la API
  const sinLeer = noLeidas;

  const grupos = useMemo(() => {
    const map: Record<string, Notificacion[]> = {};
    for (const n of filtradas) {
      if (!map[n.grupo]) map[n.grupo] = [];
      map[n.grupo].push(n);
    }
    return map;
  }, [filtradas]);

  const marcarTodoLeido = async () => {
    try {
      await notificacionesApi.marcarLeida('all');
      setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch { /* ignorar */ }
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

      {loading ? (
        <View style={styles.emptyWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isEmpty ? (
        /* Empty state */
        <FadeIn style={{ flex: 1 }}>
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
        </FadeIn>
      ) : (
        <FadeIn style={{ flex: 1 }}>
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
        </FadeIn>
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
