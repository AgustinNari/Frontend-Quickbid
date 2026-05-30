import React, { useMemo, useState } from 'react';
import { View, SafeAreaView, ScrollView, FlatList, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  Heading,
  Body,
  Typography,
  Icon,
  EmptyState,
  Loader,
} from '../ui';
import { colors, spacing, layout, radius, fontSize, fontWeight } from '../theme';
import BottomNavBar, { NavTab } from '../components/BottomNavBar';
import { SubastaCard, SubastaCardCompact } from '../components/SubastaCard';
import { FilterChips, FilterOption } from '../components/FilterChips';
import { MOCK_SUBASTAS } from '../mocks/subastas';
import {
  SubastaSegmento,
  SubastaCategoria,
  SubastaMoneda,
  SEGMENTO_LABEL,
  CATEGORIA_LABEL,
  SubastaResumen,
} from '../types/subasta';

type Props = NativeStackScreenProps<RootStackParamList, 'Subastas'>;

/**
 * Pantalla principal de subastas (tarea #10 del Trello).
 *
 * Alineada al Figma (frame "Subastas Activas", 178:1469):
 *  - Header con brand QuickBid.
 *  - Sección "Subastas Activas":
 *      • Título + toggle de moneda (Todas / ARS / USD) a la derecha.
 *      • Carrusel horizontal con cards grandes (imagen + body + botón Entrar).
 *  - Filtros de segmento (Todo, Joyas, Arte, Vehículos, ...).
 *  - Filtros de categoría (Todo, Plata, Oro, Platino, ...).
 *  - Sección "Próximas Subastas" con cards horizontales compactas.
 *  - BottomNavBar al fondo con tab "subastas" activo.
 *
 * Cuando el endpoint GET /api/subastas esté listo, reemplazar MOCK_SUBASTAS
 * por una llamada con TanStack Query y los filtros van como query params.
 */
export default function SubastasScreen({ navigation }: Props) {
  const [segmento, setSegmento] = useState<SubastaSegmento | null>(null);
  const [categoria, setCategoria] = useState<SubastaCategoria | null>(null);
  const [moneda, setMoneda] = useState<SubastaMoneda | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('subastas');

  // Opciones de filtros
  const segmentoOptions = useMemo<FilterOption<SubastaSegmento>[]>(
    () => [
      { value: null, label: 'Todo' },
      ...(Object.entries(SEGMENTO_LABEL) as [SubastaSegmento, string][]).map(
        ([value, label]) => ({ value, label }),
      ),
    ],
    [],
  );

  const categoriaOptions = useMemo<FilterOption<SubastaCategoria>[]>(
    () => [
      { value: null, label: 'Todo' },
      ...(Object.entries(CATEGORIA_LABEL) as [SubastaCategoria, string][]).map(
        ([value, label]) => ({ value, label }),
      ),
    ],
    [],
  );

  // Filtrado client-side
  const filtered = useMemo(() => {
    return MOCK_SUBASTAS.filter((s) => {
      if (segmento && s.segmento !== segmento) return false;
      if (categoria && s.categoria !== categoria) return false;
      if (moneda && s.moneda !== moneda) return false;
      return true;
    });
  }, [segmento, categoria, moneda]);

  const activas = filtered.filter((s) => s.estado === 'activa');
  const proximas = filtered.filter((s) => s.estado === 'proxima');
  const isEmpty = filtered.length === 0;

  const handleOpenSubasta = (s: SubastaResumen) => {
    navigation.navigate('SubastaDetail', { id: s.id });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="h2" primary>
          QuickBid
        </Typography>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Sección Activas: título + toggle de moneda */}
        <View style={styles.activasHeader}>
          <View style={styles.activasTitleRow}>
            <View style={styles.livePulse} />
            <Heading>Subastas Activas</Heading>
          </View>

          <View style={styles.currencyToggle}>
            <CurrencyChip
              label="ARS"
              selected={moneda === 'ARS'}
              onPress={() => setMoneda(moneda === 'ARS' ? null : 'ARS')}
            />
            <CurrencyChip
              label="USD"
              selected={moneda === 'USD'}
              onPress={() => setMoneda(moneda === 'USD' ? null : 'USD')}
            />
          </View>
        </View>

        {/* Carrusel horizontal de activas */}
        {activas.length > 0 ? (
          <FlatList
            data={activas}
            keyExtractor={(s) => s.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carrusel}
            renderItem={({ item }) => (
              <SubastaCard subasta={item} onPress={() => handleOpenSubasta(item)} />
            )}
            ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
          />
        ) : (
          <View style={styles.activasEmpty}>
            <Body muted>No hay subastas en vivo con estos filtros.</Body>
          </View>
        )}

        {/* Filtros */}
        <View style={styles.filtersWrap}>
          <FilterChips
            options={segmentoOptions}
            value={segmento}
            onChange={setSegmento}
          />
          <View style={{ height: spacing.sm }} />
          <FilterChips
            options={categoriaOptions}
            value={categoria}
            onChange={setCategoria}
          />
        </View>

        {/* Próximas */}
        <View style={styles.proximasWrap}>
          <Heading style={styles.proximasTitle}>Próximas Subastas</Heading>

          {proximas.length === 0 ? (
            isEmpty ? (
              <View style={styles.emptyWrap}>
                <EmptyState
                  icon={<Icon name="inbox" size={48} color={colors.textSubtle} />}
                  title="Sin resultados"
                  description="No encontramos subastas con esos filtros. Probá quitar alguno."
                  actionLabel="Limpiar filtros"
                  onAction={() => {
                    setSegmento(null);
                    setCategoria(null);
                    setMoneda(null);
                  }}
                />
              </View>
            ) : (
              <Body muted style={styles.metaCenter}>
                No hay subastas próximas con estos filtros.
              </Body>
            )
          ) : (
            <View style={styles.proximasList}>
              {proximas.map((s) => (
                <SubastaCardCompact
                  key={s.id}
                  subasta={s}
                  onPress={() => handleOpenSubasta(s)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
}

// ── Chip de moneda (toggle compacto) ─────────────────────────────────────────

function CurrencyChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Typography
      onPress={onPress}
      style={[
        styles.currencyChip,
        selected ? styles.currencyChipSelected : styles.currencyChipIdle,
      ]}
    >
      {label}
    </Typography>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  scroll: {
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  activasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingHorizontal,
    marginBottom: spacing.base,
  },
  activasTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  livePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  currencyToggle: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  currencyChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    borderWidth: 1,
    overflow: 'hidden',
  },
  currencyChipIdle: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderColor: colors.border,
  },
  currencyChipSelected: {
    backgroundColor: colors.primary,
    color: colors.textInverse,
    borderColor: colors.primary,
  },
  carrusel: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing.lg,
  },
  activasEmpty: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.lg,
  },
  filtersWrap: {
    marginBottom: spacing.xl,
  },
  proximasWrap: {
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  proximasTitle: {
    marginBottom: spacing.base,
  },
  proximasList: {
    gap: spacing.md,
  },
  emptyWrap: {
    minHeight: 280,
  },
  metaCenter: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
