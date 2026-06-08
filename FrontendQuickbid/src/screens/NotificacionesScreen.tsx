import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { NotificacionUsuario } from '../types/usuario';

type Props = NativeStackScreenProps<RootStackParamList, 'Notificaciones'>;
type Filtro = 'todas' | 'subastas' | 'consignas' | 'pagos';

const FILTERS: { id: Filtro; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'subastas', label: 'Subastas' },
  { id: 'consignas', label: 'Consignas' },
  { id: 'pagos', label: 'Pagos' },
];

export default function NotificacionesScreen({ navigation }: Props) {
  const [items, setItems] = useState<NotificacionUsuario[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usuarioApi.notificaciones({ page: 0, size: 100 });
      setItems(response.content);
    } catch (loadError) {
      setItems([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No pudimos cargar las notificaciones.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const unread = items.filter(item => !item.leida).length;
  const filtered = useMemo(
    () => items.filter(item => matches(item.tipo, filtro)),
    [filtro, items],
  );

  const readOne = async (item: NotificacionUsuario) => {
    if (item.leida || updating) return;
    setUpdating(true);
    setError(null);
    try {
      const updated = await usuarioApi.marcarNotificacionLeida(item.id);
      setItems(previous =>
        previous.map(current =>
          current.id === updated.id ? updated : current,
        ),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'No pudimos marcar la notificacion.',
      );
    } finally {
      setUpdating(false);
    }
  };

  const readAll = async () => {
    if (updating || unread === 0) return;
    setUpdating(true);
    setError(null);
    try {
      await usuarioApi.marcarTodasLeidas();
      setItems(previous => previous.map(item => ({ ...item, leida: true })));
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'No pudimos marcar las notificaciones.',
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notificaciones</Text>
          <Text style={styles.subtitle}>{unread} sin leer</Text>
        </View>
        {unread > 0 ? (
          <TouchableOpacity onPress={readAll} disabled={updating}>
            <Text style={styles.readAll}>
              {updating ? 'Actualizando...' : 'Marcar todo leido'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.filters}>
        {FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[styles.filter, filtro === filter.id && styles.filterActive]}
            onPress={() => setFiltro(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                filtro === filter.id && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <Loader fullScreen label="Cargando notificaciones..." />
      ) : error && items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={<Icon name="alert" size={48} color={colors.textSubtle} />}
            title="No pudimos cargar las notificaciones"
            description={error}
            actionLabel="Reintentar"
            onAction={cargar}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Icon name="bell" size={48} color={colors.textSubtle} />}
              title="Estas al dia"
              description="No hay notificaciones para este filtro."
            />
          ) : (
            filtered.map(item => (
              <NotificationCard
                key={item.id}
                item={item}
                onPress={() => readOne(item)}
              />
            ))
          )}
        </ScrollView>
      )}
      <BottomNavBar activeTab="notif" navigation={navigation} />
    </SafeAreaView>
  );
}

function NotificationCard({
  item,
  onPress,
}: {
  item: NotificacionUsuario;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, !item.leida && styles.cardUnread]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.icon}>
        <Icon
          name={notificationIcon(item.tipo)}
          size={20}
          color={colors.primary}
        />
      </View>
      <View style={styles.body}>
        <Text style={styles.cardTitle}>{item.titulo}</Text>
        <Text style={styles.description}>{item.descripcion}</Text>
        <Text style={styles.date}>
          {formatDate(item.createdAt)} - {item.tipo.replaceAll('_', ' ')}
        </Text>
      </View>
      {!item.leida ? <View style={styles.dot} /> : null}
    </TouchableOpacity>
  );
}

function matches(tipo: string, filtro: Filtro) {
  if (filtro === 'todas') return true;
  if (filtro === 'consignas')
    return (
      tipo.includes('consign') ||
      tipo.includes('acuerdo') ||
      tipo.includes('documentacion') ||
      tipo.includes('liquidacion')
    );
  if (filtro === 'pagos')
    return (
      tipo.includes('pago') || tipo.includes('multa') || tipo.includes('medio')
    );
  return (
    tipo.includes('subasta') ||
    tipo.includes('puja') ||
    tipo.includes('lote') ||
    tipo.includes('catalogo')
  );
}

function notificationIcon(tipo: string): 'bell' | 'card' | 'bag' {
  if (matches(tipo, 'pagos')) return 'card';
  if (matches(tipo, 'consignas')) return 'bag';
  return 'bell';
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: layout.screenPaddingHorizontal,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted },
  readAll: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: layout.screenPaddingHorizontal,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  filter: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  filterActive: { backgroundColor: colors.primary },
  filterText: { color: colors.text, fontSize: fontSize.sm },
  filterTextActive: { color: colors.white, fontWeight: fontWeight.semibold },
  emptyWrap: { flex: 1, paddingHorizontal: layout.screenPaddingHorizontal },
  scroll: {
    padding: layout.screenPaddingHorizontal,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.xl,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  cardUnread: { backgroundColor: colors.infoSoft, borderColor: colors.primary },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 3 },
  cardTitle: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  description: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  date: {
    color: colors.textSubtle,
    fontSize: fontSize.xs,
    textTransform: 'capitalize',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: spacing.xs,
  },
});
