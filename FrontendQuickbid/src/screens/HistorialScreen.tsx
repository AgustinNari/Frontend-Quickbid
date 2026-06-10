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
import { HistorialUsuarioItem } from '../types/usuario';

type Props = NativeStackScreenProps<RootStackParamList, 'Historial'>;
const PAGE_SIZE = 20;

export default function HistorialScreen({ navigation }: Props) {
  const [items, setItems] = useState<HistorialUsuarioItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (nextPage = 0) => {
    nextPage === 0 ? setLoading(true) : setLoadingMore(true);
    setError(null);
    try {
      const response = await usuarioApi.historial(nextPage, PAGE_SIZE);
      setItems(previous =>
        nextPage === 0 ? response.content : [...previous, ...response.content],
      );
      setPage(response.page);
      setTotalPages(response.totalPages);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No pudimos cargar el historial.',
      );
      if (nextPage === 0) setItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />
      {loading ? (
        <Loader fullScreen label="Cargando historial..." />
      ) : error && items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={<Icon name="alert" size={48} color={colors.textSubtle} />}
            title="No pudimos cargar tu historial"
            description={error}
            actionLabel="Reintentar"
            onAction={() => cargar()}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Historial de subastas</Text>
          <Text style={styles.subtitle}>Tus pujas y compras registradas.</Text>
          {items.length === 0 ? (
            <EmptyState
              icon={<Icon name="clock" size={48} color={colors.textSubtle} />}
              title="Sin actividad"
              description="Todavia no tenes pujas ni compras en tu historial."
            />
          ) : (
            <>
              {items.map((item, index) => (
                <HistoryCard
                  key={`${item.tipo}-${item.subastaId}-${item.itemCatalogoId}-${item.fecha}-${index}`}
                  item={item}
                />
              ))}
              {error ? <Text style={styles.moreError}>{error}</Text> : null}
              {page + 1 < totalPages ? (
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => cargar(page + 1)}
                  disabled={loadingMore}
                >
                  <Text style={styles.moreText}>
                    {loadingMore ? 'Cargando...' : 'Ver mas'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </ScrollView>
      )}
      <BottomNavBar activeTab="menu" navigation={navigation} />
    </SafeAreaView>
  );
}

function HistoryCard({ item }: { item: HistorialUsuarioItem }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.overline}>
          {formatDate(item.fecha)} - {item.tipo.toUpperCase()}
        </Text>
        <View style={styles.stateBadge}>
          <Text style={styles.stateText}>
            {item.estado.replaceAll('_', ' ')}
          </Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>
        Subasta #{item.subastaId} - Lote #{item.itemCatalogoId}
      </Text>
      <Text style={styles.meta}>
        {item.productoId ? `Producto #${item.productoId}` : 'Actividad de puja'}
      </Text>
      <Text style={styles.amount}>
        {item.moneda} {item.monto.toLocaleString('es-AR')}
      </Text>
    </View>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('es-AR');
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  emptyWrap: { flex: 1, paddingHorizontal: layout.screenPaddingHorizontal },
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
    color: colors.textMuted,
    fontSize: fontSize.base,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  overline: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  stateBadge: {
    backgroundColor: colors.infoSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  stateText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.sm,
  },
  meta: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 3 },
  amount: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  moreButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.base,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  moreText: { color: colors.primary, fontWeight: fontWeight.semibold },
  moreError: {
    color: colors.danger,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
});
