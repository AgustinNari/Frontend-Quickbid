import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, radius, fontSize, fontWeight, layout } from '../theme';
import BottomNavBar, { NavTab, BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { MOCK_ESTADISTICAS, PeriodoStats } from '../mocks/estadisticas';

type Props = NativeStackScreenProps<RootStackParamList, 'Estadisticas'>;

const MESES = ['E','F','M','A','M','J','J','A','S','O','N','D'];

const PERIODOS: { id: PeriodoStats; label: string }[] = [
  { id: 'mes',       label: 'Mes'       },
  { id: 'trimestre', label: 'Trimestre' },
  { id: 'año',       label: 'Año'       },
  { id: 'total',     label: 'Total'     },
];

// ── Gráfico de barras ─────────────────────────────────────────────────────────

const BAR_MAX_H = 90;
const BAR_WIDTH = 14;

function BarChart({ valores }: { valores: number[] }) {
  return (
    <View style={chartStyles.wrap}>
      {valores.map((v, i) => {
        const isLast = i === valores.length - 1;
        const h = Math.max(4, Math.round(v * BAR_MAX_H));
        return (
          <View key={i} style={chartStyles.col}>
            <View style={chartStyles.barTrack}>
              <View style={[
                chartStyles.bar,
                { height: h, backgroundColor: isLast ? colors.primary : '#93C5FD' },
              ]} />
            </View>
            <Text style={chartStyles.label}>{MESES[i]}</Text>
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
  barTrack: {
    height: BAR_MAX_H,
    justifyContent: 'flex-end',
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: 3,
  },
  label: {
    fontSize: 9,
    color: colors.textSubtle,
    marginTop: 4,
    fontWeight: '500',
  },
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
  const [periodo, setPeriodo] = useState<PeriodoStats>('mes');

  const data = MOCK_ESTADISTICAS[periodo];

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

        {/* Total invertido */}
        <View style={styles.totalCard}>
          <View style={styles.totalHeader}>
            <Text style={styles.totalLabel}>TOTAL INVERTIDO</Text>
            <TrendIcon pos={data.variacionPos} />
          </View>
          <Text style={styles.totalMonto}>{data.totalInvertido}</Text>
          <Text style={styles.totalVariacion}>
            ARS · <Text style={{ color: data.variacionPos ? '#4ADE80' : '#F87171' }}>{data.variacion}</Text>
          </Text>
        </View>

        {/* Métricas */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>TASA DE VICTORIAS</Text>
            <Text style={styles.metricValor}>{data.tasaVictorias}%</Text>
            <Text style={[styles.metricVar, { color: data.tasaVictoriasPos ? '#16A34A' : '#DC2626' }]}>
              {data.tasaVictoriasVar}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>PUJA PROMEDIO</Text>
            <Text style={styles.metricValor}>{data.pujaPromedio}</Text>
            <Text style={[styles.metricVar, { color: data.pujaPromedioPos ? '#16A34A' : '#DC2626' }]}>
              {data.pujaPromedioVar}
            </Text>
          </View>
        </View>

        {/* Gráfico */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitulo}>GASTOS POR MES</Text>
          <BarChart valores={data.gastosPorMes} />
        </View>

        {/* Segmento top */}
        <Text style={styles.seccionLabel}>SEGMENTO TOP</Text>
        <View style={styles.segmentoCard}>
          <View style={styles.segmentoIconWrap}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path d="M12 2L2 7l10 5 10-5-10-5z" stroke={colors.primary} strokeWidth="1.8" strokeLinejoin="round" />
              <Path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke={colors.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <View style={styles.segmentoInfo}>
            <Text style={styles.segmentoNombre}>{data.segmentoTop.nombre}</Text>
            <Text style={styles.segmentoDetalle}>{data.segmentoTop.detalle}</Text>
          </View>
          <Text style={styles.segmentoPct}>{data.segmentoTop.porcentaje}%</Text>
        </View>

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

  // Total card — fondo oscuro
  totalCard: {
    backgroundColor: '#0F172A',
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.base,
  },
  totalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: '#94A3B8', letterSpacing: 0.8 },
  totalMonto: { fontSize: 32, fontWeight: fontWeight.bold, color: colors.white, marginBottom: spacing.xs },
  totalVariacion: { fontSize: fontSize.sm, color: '#94A3B8' },

  // Métricas
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

  // Chart
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

  // Segmento top
  seccionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textSubtle,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  segmentoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  segmentoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.base,
    backgroundColor: colors.infoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentoInfo: { flex: 1, gap: 3 },
  segmentoNombre: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  segmentoDetalle: { fontSize: fontSize.sm, color: colors.textMuted },
  segmentoPct: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold, color: colors.primary },
});
