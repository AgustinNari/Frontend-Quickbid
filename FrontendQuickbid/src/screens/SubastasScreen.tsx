import React, { useMemo, useState } from 'react';
import { View, SafeAreaView, ScrollView, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  Heading,
  Body,
  Caption,
  Typography,
  TextField,
  Icon,
  EmptyState,
  ScreenContainer,
} from '../ui';
import { colors, spacing, layout } from '../theme';
import BottomNavBar, { NavTab } from '../components/BottomNavBar';
import { SubastaCard } from '../components/SubastaCard';
import { FilterChips, FilterOption } from '../components/FilterChips';
import { MOCK_SUBASTAS } from '../mocks/subastas';
import { SubastaSegmento, SEGMENTO_LABEL, SubastaResumen } from '../types/subasta';

type Props = NativeStackScreenProps<RootStackParamList, 'Subastas'>;

/**
 * Pantalla principal de subastas (tarea #10 del Trello).
 *
 * Muestra:
 *  - Header con brand y subtítulo.
 *  - Buscador (filtra por título y rematador).
 *  - Chips de segmento (Todos / Arte / Joyas / ...).
 *  - Sección "Activas" (subastas en vivo).
 *  - Sección "Próximas".
 *  - EmptyState si el filtro deja la lista vacía.
 *  - BottomNavBar pegado al fondo.
 *
 * Datos: mockeados desde `src/mocks/subastas.ts`. Cuando el endpoint
 * `GET /api/subastas` esté listo, reemplazar `MOCK_SUBASTAS` por
 * una llamada con TanStack Query.
 */
export default function SubastasScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [segmento, setSegmento] = useState<SubastaSegmento | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('subastas');

  // Opciones de filtro derivadas de los segmentos disponibles.
  const segmentoOptions = useMemo<FilterOption<SubastaSegmento>[]>(
    () => [
      { value: null, label: 'Todas' },
      ...(Object.entries(SEGMENTO_LABEL) as [SubastaSegmento, string][]).map(
        ([value, label]) => ({ value, label }),
      ),
    ],
    [],
  );

  // Filtrado cliente-side (mientras no haya backend).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_SUBASTAS.filter((s) => {
      if (segmento && s.segmento !== segmento) return false;
      if (q) {
        const haystack = `${s.titulo} ${s.rematador} ${s.ubicacion}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [query, segmento]);

  const activas = filtered.filter((s) => s.estado === 'activa');
  const proximas = filtered.filter((s) => s.estado === 'proxima');
  const isEmpty = filtered.length === 0;

  const handleOpenSubasta = (s: SubastaResumen) => {
    // Cuando esté hecha la pantalla de detalle (tarea #11) navegamos a ella.
    Alert.alert(s.titulo, 'El detalle de la subasta todavía no está implementado.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="h2" primary>
          QuickBid
        </Typography>
        <Icon name="bell" size={22} color={colors.textMuted} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Heading>Subastas</Heading>
          <Body muted>
            Descubrí piezas únicas en remates en vivo y próximos.
          </Body>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <TextField
            placeholder="Buscar por título, rematador, ubicación..."
            leftIcon={<Icon name="search" color={colors.textSubtle} />}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            containerStyle={styles.searchContainer}
          />
        </View>

        {/* Filtros de segmento */}
        <FilterChips
          options={segmentoOptions}
          value={segmento}
          onChange={setSegmento}
          style={styles.filters}
        />

        {/* Vacío */}
        {isEmpty ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon={<Icon name="inbox" size={48} color={colors.textSubtle} />}
              title="Sin resultados"
              description={
                query
                  ? `No encontramos subastas que coincidan con "${query}".`
                  : 'Probá quitar los filtros para ver más subastas.'
              }
              actionLabel="Limpiar filtros"
              onAction={() => {
                setQuery('');
                setSegmento(null);
              }}
            />
          </View>
        ) : null}

        {/* Activas */}
        {activas.length > 0 ? (
          <Section
            title="En vivo"
            count={activas.length}
            tone="danger"
          >
            {activas.map((s) => (
              <SubastaCard
                key={s.id}
                subasta={s}
                onPress={() => handleOpenSubasta(s)}
              />
            ))}
          </Section>
        ) : null}

        {/* Próximas */}
        {proximas.length > 0 ? (
          <Section title="Próximas" count={proximas.length}>
            {proximas.map((s) => (
              <SubastaCard
                key={s.id}
                subasta={s}
                onPress={() => handleOpenSubasta(s)}
              />
            ))}
          </Section>
        ) : null}
      </ScrollView>

      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
}

// ── Sección con título + contador + slot de hijos ────────────────────────────

type SectionProps = {
  title: string;
  count?: number;
  tone?: 'danger' | 'neutral';
  children: React.ReactNode;
};

function Section({ title, count, tone = 'neutral', children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          {tone === 'danger' ? <View style={styles.livePulse} /> : null}
          <Typography variant="overline" color={colors.text}>
            {title.toUpperCase()}
          </Typography>
        </View>
        {count != null ? (
          <Caption muted>
            {count} {count === 1 ? 'subasta' : 'subastas'}
          </Caption>
        ) : null}
      </View>

      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  scroll: {
    paddingBottom: spacing['2xl'],
  },
  intro: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.xl,
    paddingBottom: spacing.base,
    gap: spacing.xs,
  },
  searchWrap: {
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  searchContainer: {
    marginBottom: spacing.sm,
  },
  filters: {
    marginBottom: spacing.lg,
  },
  emptyWrap: {
    minHeight: 320,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingHorizontal,
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  sectionContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    gap: spacing.base,
  },
});
