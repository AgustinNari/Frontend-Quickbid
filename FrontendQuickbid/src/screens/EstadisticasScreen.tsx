import React, { useCallback, useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, { BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { EmptyState, Icon, Loader } from '../ui';
import {
  colors,
  fontSize,
  fontWeight,
  layout,
  radius,
  spacing,
} from '../theme';
import { usuarioApi } from '../api/usuario';
import { userFacingError } from '../api/client';
import { EstadisticasUsuario, PeriodoEstadisticas } from '../types/usuario';

type Props = NativeStackScreenProps<RootStackParamList, 'Estadisticas'>;

const PERIODOS: { id: PeriodoEstadisticas; label: string }[] = [
  { id: 'mes', label: 'Mes' },
  { id: 'trimestre', label: 'Trimestre' },
  { id: 'anual', label: 'Anual' },
  { id: 'total', label: 'Total' },
];

export default function EstadisticasScreen({ navigation }: Props) {
  const [periodo, setPeriodo] = useState<PeriodoEstadisticas>('mes');
  const [data, setData] = useState<EstadisticasUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await usuarioApi.estadisticas(periodo));
    } catch (loadError) {
      setData(null);
      setError(userFacingError(loadError, 'No pudimos cargar las estadisticas.'));
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Estadisticas</Text>
        <Text style={styles.subtitle}>
          Resumen real de tu actividad en QuickBid.
        </Text>
        <View style={styles.tabs}>
          {PERIODOS.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.tab, periodo === item.id && styles.tabActive]}
              onPress={() => setPeriodo(item.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  periodo === item.id && styles.tabTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <Loader label="Cargando estadisticas..." />
        ) : error || !data ? (
          <EmptyState
            icon={<Icon name="alert" size={48} color={colors.textSubtle} />}
            title="No pudimos cargar tus estadisticas"
            description={error ?? 'No hay datos disponibles.'}
            actionLabel="Reintentar"
            onAction={cargar}
          />
        ) : (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>TOTAL PUJADO</Text>
              <Text style={styles.heroValue}>{money(data.totalPujado)}</Text>
              <Text style={styles.heroMeta}>
                {data.cantidadPujas} pujas en {data.subastasParticipadas}{' '}
                subastas
              </Text>
            </View>
            <View style={styles.metrics}>
              <Metric label="Tasa de exito" value={`${data.tasaExito}%`} />
              <Metric label="Total pagado" value={money(data.totalPagado)} />
              <Metric label="Compras" value={String(data.cantidadCompras)} />
              <Metric
                label="Consignaciones"
                value={String(data.vendedorConsignador.consignaciones)}
              />
              <Metric
                label="Consignaciones vendidas"
                value={String(data.vendedorConsignador.vendidas)}
              />
              <Metric
                label="Total liquidado"
                value={money(data.vendedorConsignador.totalLiquidado)}
              />
            </View>
            <View style={styles.chartCard}>
              <Text style={styles.sectionLabel}>ACTIVIDAD MENSUAL</Text>
              {data.actividadMensual.length === 0 ? (
                <Text style={styles.emptyText}>
                  Sin actividad para este período.
                </Text>
              ) : (
                <View style={styles.chart}>
                  {data.actividadMensual.map(activity => (
                    <ActivityBar
                      key={activity.mes}
                      label={activity.mes}
                      value={activity.pujas + activity.compras}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
      <BottomNavBar activeTab="menu" navigation={navigation} />
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function ActivityBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.barColumn}>
      <View
        style={[styles.bar, { height: Math.max(8, Math.min(90, value * 16)) }]}
      />
      <Text style={styles.barLabel}>{label.slice(5)}</Text>
    </View>
  );
}

function money(value: number) {
  return `$ ${value.toLocaleString('es-AR')}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: layout.screenPaddingHorizontal,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.xl,
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.base,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: 4,
    marginBottom: spacing.xl,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: fontSize.sm, color: colors.textMuted },
  tabTextActive: { color: colors.white, fontWeight: fontWeight.semibold },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.base,
  },
  heroLabel: {
    color: colors.infoSoft,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  heroValue: {
    color: colors.white,
    fontSize: 32,
    fontWeight: fontWeight.bold,
    marginVertical: spacing.xs,
  },
  heroMeta: { color: colors.infoSoft, fontSize: fontSize.sm },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metric: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.base,
  },
  metricLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  metricValue: {
    fontSize: fontSize.xl,
    color: colors.text,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.base,
    marginTop: spacing.xl,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 120,
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: 14, backgroundColor: colors.primary, borderRadius: radius.sm },
  barLabel: { fontSize: 9, color: colors.textSubtle, marginTop: spacing.xs },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
