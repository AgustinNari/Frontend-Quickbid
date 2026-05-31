import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, radius, fontSize, fontWeight, layout } from '../theme';
import BottomNavBar, { NavTab, BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { FadeIn } from '../components/FadeIn';
import { perfilApi, EstadisticasData } from '../api/perfil';

type Props = NativeStackScreenProps<RootStackParamList, 'Estadisticas'>;

// Mapa de período frontend → backend
type PeriodoFE = 'mes' | 'trimestre' | 'año' | 'total';
const PERIODO_API: Record<PeriodoFE, 'mes' | 'trimestre' | 'anual'> = {
  mes:       'mes',
  trimestre: 'trimestre',
  año:       'anual',
  total:     'anual', // backend no tiene 'total' — usamos anual como fallback
};

const PERIODOS: { id: PeriodoFE; label: string }[] = [
  { id: 'mes',       label: 'Mes'       },
  { id: 'trimestre', label: 'Trimestre' },
  { id: 'año',       label: 'Año'       },
  { id: 'total',     label: 'Total'     },
];

function formatMonto(valor: number): string {
  return '$' + valor.toLocaleString('es-AR');
}

// ── Gráfico de barras ─────────────────────────────────────────────────────────

const BAR_MAX_H = 90;
const BAR_WIDTH = 14;

function BarChart({ puntos }: { puntos: { etiqueta: string; valor: number }[] }) {
  if (puntos.length === 0) {
    return (
      <View style={chartStyles.empty}>
        <Text style={chartStyles.emptyText}>Sin datos para el período</Text>
      </View>
    );
  }
  const maxValor = Math.max(...puntos.map(p => p.valor), 1);
  return (
    <View style={chartStyles.wrap}>
      {puntos.map((p, i) => {
        const isLast = i === puntos.length - 1;
        const h = Math.max(4, Math.round((p.valor / maxValor) * BAR_MAX_H));
        return (
          <View key={i} style={chartStyles.col}>
            <View style={chartStyles.barTrack}>
              <View style={[
                chartStyles.bar,
                { height: h, backgroundColor: isLast ? colors.primary : '#93C5FD' },
              ]} />
            </View>
            <Text style={chartStyles.label} numberOfLines={1}>{p.etiqueta}</Text>
          </View>
        );
      })}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: BAR_MAX_H + 20,
    paddingTop: 4,
  },
  col: { alignItems: 'center', flex: 1 },
  barTrack: { height: BAR_MAX_H, justifyContent: 'flex-end' },
  bar:   { width: BAR_WIDTH, borderRadius: 3 },
  label: { fontSize: 9, color: colors.textSubtle, marginTop: 4, fontWeight: '500' },
  empty: { height: BAR_MAX_H + 20, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: fontSize.sm, color: colors.textSubtle },
});

// ── Ícono de tendencia ────────────────────────────────────────────────────────

function TrendIcon({ pos }: { pos: boolean }) {
  const color = pos ? '#16A34A' : '#DC2626';
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      {pos
        ? <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        : <Polyline points="23 18 13.5 8.5 8.5 13.5 1 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      }
    </Svg>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────────────────

export default function EstadisticasScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<NavTab>('subastas');
  const [periodo,   setPeriodo]   = useState<PeriodoFE>('mes');
  const [data,      setData]      = useState<EstadisticasData | null>(null);
  const [loading,   setLoading]   = useState(true);

  const cargar = useCallback(async (p: PeriodoFE) => {
    setLoading(true);
    try {
      const res = await perfilApi.getEstadisticas(PERIODO_API[p]);
      if (res.data) setData(res.data);
    } catch {
      // sin conexión — mantiene datos anteriores
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(periodo); }, [periodo, cargar]);

  const totalPujado  = data?.totalPujado  ?? 0;
  const totalPagado  = data?.totalPagado  ?? 0;
  const pctExito     = data?.porcentajeExito ?? 0;
  const serie        = data?.serieHistorica ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.titulo}>Estadísticas</Text>
        <Text style={styles.subtitulo}>Resumen de tu actividad en QuickBid.</Text>

        {/* Tabs de período */}
        <View style={styles.tabsRow}>
          {PERIODOS.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[styles.tab, periodo === p.id && styles.tabActive]}
              onPress={() => setPeriodo(p.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, periodo === p.id && styles.tabLabelActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FadeIn>
            {/* Total pujado */}
            <View style={styles.totalCard}>
              <View style={styles.totalHeader}>
                <Text style={styles.totalLabel}>TOTAL PUJADO</Text>
                <TrendIcon pos={totalPujado >= 0} />
              </View>
              <Text style={styles.totalMonto}>{formatMonto(totalPujado)}</Text>
              <Text style={styles.totalVariacion}>ARS · Período: {periodo}</Text>
            </View>

            {/* Métricas */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>TASA DE ÉXITO</Text>
                <Text style={styles.metricValor}>{pctExito}%</Text>
                <Text style={[styles.metricVar, { color: pctExito >= 50 ? '#16A34A' : '#DC2626' }]}>
                  {pctExito >= 50 ? 'Por encima promedio' : 'Por debajo promedio'}
                </Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>TOTAL PAGADO</Text>
                <Text style={styles.metricValor}>{formatMonto(totalPagado)}</Text>
                <Text style={[styles.metricVar, { color: colors.textMuted }]}>
                  en compras ganadas
                </Text>
              </View>
            </View>

            {/* Gráfico */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitulo}>ACTIVIDAD POR PERÍODO</Text>
              <BarChart puntos={serie} />
            </View>
          </FadeIn>
        )}

      </ScrollView>

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

  titulo:    { fontSize: fontSize['4xl'], fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.xs },
  subtitulo: { fontSize: fontSize.base, color: colors.textMuted, marginBottom: spacing.base },

  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  tab:            { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.md },
  tabActive:      { backgroundColor: colors.primary },
  tabLabel:       { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textMuted },
  tabLabelActive: { color: colors.white, fontWeight: fontWeight.semibold },

  totalCard: {
    backgroundColor: '#0F172A',
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.base,
  },
  totalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  totalLabel:     { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: '#94A3B8', letterSpacing: 0.8 },
  totalMonto:     { fontSize: 32, fontWeight: fontWeight.bold, color: colors.white, marginBottom: spacing.xs },
  totalVariacion: { fontSize: fontSize.sm, color: '#94A3B8' },

  metricsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.base },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    gap: spacing.xs,
  },
  metricLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.textSubtle, letterSpacing: 0.5 },
  metricValor: { fontSize: fontSize['4xl'], fontWeight: fontWeight.bold, color: colors.text },
  metricVar:   { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  chartTitulo: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textSubtle,
    letterSpacing: 0.8,
    marginBottom: spacing.base,
  },
});
