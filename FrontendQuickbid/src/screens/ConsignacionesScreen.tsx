import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, radius, fontSize, fontWeight, layout } from '../theme';
import BottomNavBar, { NavTab, BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { EmptyState, Icon, Loader, Badge, Typography } from '../ui';
import { consignacionesApi } from '../api/consignaciones';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  ConsignacionResumenUi,
  ConsignacionTab,
  mapConsignacionResumen,
} from '../mappers/consignaciones';

type Props = NativeStackScreenProps<RootStackParamList, 'Consignaciones'>;

const TABS: { id: ConsignacionTab; label: string }[] = [
  { id: 'activas', label: 'Activas' },
  { id: 'rechazadas', label: 'Rechazadas' },
  { id: 'vendidas', label: 'Vendidas' },
];

export default function ConsignacionesScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<NavTab>('consignar');
  const [tab, setTab] = useState<ConsignacionTab>('activas');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ConsignacionResumenUi[]>([]);
  const { isGuest, estadoCuenta } = useAuth();

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    setError(null);
    try {
      const page = await consignacionesApi.listar({ filtro: tab, page: 0, size: 30 });
      setItems(page.content.map(mapConsignacionResumen));
    } catch (err) {
      setError(readableError(err));
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isGuest, tab]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => ({
    activas: tab === 'activas' ? items.length : undefined,
    rechazadas: tab === 'rechazadas' ? items.length : undefined,
    vendidas: tab === 'vendidas' ? items.length : undefined,
  }), [items.length, tab]);

  if (isGuest) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="lock" size={48} color={colors.textSubtle} />}
            title="Consignaciones protegidas"
            description="Inicia sesion para crear solicitudes y consultar el seguimiento de tus bienes."
            actionLabel="Iniciar sesion"
            onAction={() => navigation.navigate('LimitedAccess')}
          />
        </View>
        <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} navigation={navigation} />
      </SafeAreaView>
    );
  }

  if (estadoCuenta === 'bloqueada_permanente') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="alert" size={48} color={colors.danger} />}
            title="Cuenta bloqueada"
            description="La cuenta bloqueada no puede acceder a consignaciones."
            actionLabel="Ver estado"
            onAction={() => navigation.navigate('LimitedAccess')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      <View style={styles.headerBlock}>
        <Text style={styles.titulo}>Mis consignaciones</Text>
        <Text style={styles.subtitulo}>
          Seguimiento real de tus solicitudes en QuickBid.
        </Text>
        {estadoCuenta === 'restriccion_multa' ? (
          <View style={styles.warningBox}>
            <Icon name="info" size={17} color={colors.warning} />
            <Typography style={styles.warningText}>
              Tu cuenta tiene restriccion por multa, pero podes consultar y crear consignaciones.
            </Typography>
          </View>
        ) : null}

        <View style={styles.tabsRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tab, tab === t.id && styles.tabActive]}
              onPress={() => setTab(t.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, tab === t.id && styles.tabLabelActive]}>
                {t.label}{counts[t.id] != null ? ` (${counts[t.id]})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <Loader fullScreen label="Cargando consignaciones..." />
      ) : error ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="alert" size={48} color={colors.danger} />}
            title="No pudimos cargar tus consignaciones"
            description={error}
            actionLabel="Reintentar"
            onAction={() => load()}
          />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="inbox" size={48} color={colors.textSubtle} />}
            title="No hay consignaciones aca"
            description="Cuando cargues una solicitud, el seguimiento va a aparecer en esta seccion."
            actionLabel="Consignar un bien"
            onAction={() => navigation.navigate('AltaConsignacion')}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} />}
        >
          {items.map(item => (
            <ConsignacionItem
              key={item.id}
              item={item}
              onVerDetalle={() => navigation.navigate('ConsignacionDetail', { id: item.id })}
            />
          ))}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => navigation.navigate('AltaConsignacion')}>
        <Icon name="plus" size={28} color={colors.white} />
      </TouchableOpacity>

      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} navigation={navigation} />
    </SafeAreaView>
  );
}

function ConsignacionItem({ item, onVerDetalle }: { item: ConsignacionResumenUi; onVerDetalle: () => void }) {
  return (
    <View style={itemStyles.card}>
      <View style={itemStyles.thumb}>
        <Icon name="image" size={28} color={colors.textSubtle} />
      </View>
      <View style={itemStyles.info}>
        <View style={itemStyles.titleRow}>
          <Text style={itemStyles.nombre} numberOfLines={1}>{item.titulo}</Text>
          <Badge tone={item.badgeTone} variant="soft">{item.estadoLabel.toUpperCase()}</Badge>
        </View>
        <Text style={itemStyles.precio}>{item.valorLabel}</Text>
        <Text style={itemStyles.detalle}>{item.detalle}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onVerDetalle}>
          <Text style={itemStyles.verDetalle}>Ver detalle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function readableError(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'QuickBid no esta disponible. Probalo de nuevo en unos minutos.';
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
  precio: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  detalle: { fontSize: fontSize.sm, color: colors.textMuted },
  verDetalle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.primary, marginTop: 2 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerBlock: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  scroll: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.base,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg,
  },
  errorWrap: { flex: 1, paddingHorizontal: layout.screenPaddingHorizontal },
  titulo: { fontSize: fontSize['4xl'], fontWeight: fontWeight.bold, color: colors.text },
  subtitulo: { fontSize: fontSize.base, color: colors.textMuted },
  warningBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warningText: { flex: 1, fontSize: fontSize.sm, color: colors.text, lineHeight: fontSize.sm * 1.45 },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 4,
    marginTop: spacing.sm,
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
