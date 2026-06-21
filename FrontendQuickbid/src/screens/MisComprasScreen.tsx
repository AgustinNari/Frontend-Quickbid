import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  Heading,
  Typography,
  Button,
  Card,
  Badge,
  Icon,
  EmptyState,
  Loader,
} from '../ui';
import {
  colors,
  spacing,
  radius,
  layout,
  fontSize,
  fontWeight,
  letterSpacing,
} from '../theme';
import BottomNavBar, {
  NavTab,
  BOTTOM_NAV_HEIGHT,
} from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { formatPrecio } from '../utils/format';
import { comprasApi } from '../api/compras';
import { userFacingError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  CompraResumenUi,
  mapCompraResumen,
  tipoPagoForCompra,
} from '../mappers/compras';

type Props = NativeStackScreenProps<RootStackParamList, 'MisCompras'>;
type CompraTab = 'todas' | 'pendientes' | 'pagadas';

export default function MisComprasScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<NavTab>('compras');
  const [tab, setTab] = useState<CompraTab>('todas');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compras, setCompras] = useState<CompraResumenUi[]>([]);
  const { isGuest, estadoCuenta } = useAuth();

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (isGuest) {
        setLoading(false);
        return;
      }
      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      setError(null);
      try {
        const page = await comprasApi.listar({ page: 0, size: 50 });
        setCompras(page.content.map(mapCompraResumen));
      } catch (err) {
        setError(readableError(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isGuest],
  );

  useEffect(() => {
    load();
  }, [load]);

  const visibles = useMemo(
    () =>
      compras.filter(compra => {
        if (tab === 'pendientes') {
          return (
            compra.action === 'pagar_multa' || compra.action === 'pagar_extras'
          );
        }
        if (tab === 'pagadas') {
          return [
            'pagada',
            'entrega_pendiente',
            'retiro_pendiente',
            'completada',
          ].includes(compra.estado);
        }
        return true;
      }),
    [compras, tab],
  );

  const irADetalle = (compraId: string) =>
    navigation.navigate('CompraDetail', { compraId });

  const irAPagar = (compra: CompraResumenUi) => {
    const tipo = tipoPagoForCompra(compra);
    if (tipo) {
      navigation.navigate('ResumenPago', { compraId: compra.id, tipo });
    } else {
      irADetalle(compra.id);
    }
  };

  if (isGuest) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="lock" size={48} color={colors.textSubtle} />}
            title="Compras protegidas"
            description="Inicia sesion para ver tus compras, pagos, multas y documentos."
            actionLabel="Iniciar sesion"
            onAction={() => navigation.navigate('LimitedAccess')}
          />
        </View>
        <BottomNavBar
          activeTab={activeTab}
          onTabPress={setActiveTab}
          navigation={navigation}
        />
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
            description="Tu cuenta no puede acceder a compras ni pagos desde la navegacion normal."
            actionLabel="Ver estado de cuenta"
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
        <Heading style={styles.titulo}>Mis Compras</Heading>
        {estadoCuenta === 'restriccion_multa' ? (
          <View style={styles.restrictedBanner}>
            <Icon name="alert" size={18} color={colors.danger} />
            <Typography style={styles.restrictedText}>
              Tu cuenta tiene una multa activa. Podes regularizarla desde tus
              compras.
            </Typography>
          </View>
        ) : null}
        <View style={styles.tabBar}>
          <TabButton
            label="Todas"
            active={tab === 'todas'}
            onPress={() => setTab('todas')}
          />
          <TabButton
            label="Pendientes"
            active={tab === 'pendientes'}
            onPress={() => setTab('pendientes')}
          />
          <TabButton
            label="Pagadas"
            active={tab === 'pagadas'}
            onPress={() => setTab('pagadas')}
          />
        </View>
      </View>

      {loading ? (
        <Loader fullScreen label="Cargando tus compras..." />
      ) : error ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="alert" size={48} color={colors.danger} />}
            title="No pudimos cargar tus compras"
            description={error}
            actionLabel="Reintentar"
            onAction={() => load()}
          />
        </View>
      ) : visibles.length === 0 ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="bag" size={48} color={colors.textSubtle} />}
            title="No hay compras aca"
            description="Cuando ganes una puja, tus compras van a aparecer en esta seccion."
            actionLabel="Ir a subastas"
            onAction={() => navigation.navigate('Subastas')}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load('refresh')}
            />
          }
        >
          <View style={styles.body}>
            {visibles.map(compra => (
              <CompraCard
                key={compra.id}
                compra={compra}
                onOpen={() => irADetalle(compra.id)}
                onAction={() => irAPagar(compra)}
              />
            ))}
          </View>
        </ScrollView>
      )}

      <BottomNavBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

function CompraCard({
  compra,
  onOpen,
  onAction,
}: {
  compra: CompraResumenUi;
  onOpen: () => void;
  onAction: () => void;
}) {
  const actionVariant =
    compra.action === 'pagar_multa'
      ? 'danger'
      : compra.action === 'pagar_extras'
      ? 'primary'
      : 'secondary';

  return (
    <Card variant="flat" padding="none" onPress={onOpen} style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.thumb}>
          <Icon
            name={compra.action === 'pagar_multa' ? 'alert' : 'bag'}
            size={32}
            color={colors.primary}
          />
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.badgeRow}>
            <Badge tone={compra.badge.tone} variant={compra.badge.variant}>
              {compra.estadoLabel.toUpperCase()}
            </Badge>
          </View>
          <Typography style={styles.cardTitulo} numberOfLines={1}>
            {compra.loteLabel}
          </Typography>
          <Typography style={styles.cardSub} numberOfLines={1}>
            {compra.subtitle}
          </Typography>
          <Typography style={styles.cardFecha}>{compra.fechaLabel}</Typography>
          <Typography style={styles.cardMonto}>
            {formatPrecio(compra.montoAdjudicacion, compra.moneda)}
          </Typography>
        </View>
      </View>

      <Button
        variant={actionVariant}
        size="sm"
        onPress={onAction}
        style={styles.cardCta}
      >
        {compra.actionLabel}
      </Button>
    </Card>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.tab, active ? styles.tabActive : null]}
    >
      <Typography
        style={[styles.tabLabel, active ? styles.tabLabelActive : null]}
        numberOfLines={1}
      >
        {label}
      </Typography>
    </TouchableOpacity>
  );
}

function readableError(err: unknown) {
  return userFacingError(
    err,
    'QuickBid no esta disponible. Probalo de nuevo en unos minutos.',
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBlock: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing.base,
    gap: spacing.base,
  },
  titulo: {
    fontSize: fontSize['3xl'],
  },
  restrictedBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  restrictedText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: fontSize.sm * 1.45,
  },
  tabBar: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    letterSpacing: letterSpacing.wide,
  },
  tabLabelActive: {
    color: colors.textInverse,
  },
  scroll: {
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.xl,
  },
  errorWrap: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  body: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    gap: spacing.base,
  },
  card: {
    padding: spacing.base,
    gap: spacing.base,
  },
  cardRow: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.infoSoft,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  cardTitulo: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  cardSub: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  cardFecha: {
    fontSize: fontSize.xs,
    color: colors.textSubtle,
  },
  cardMonto: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  cardCta: {
    alignSelf: 'stretch',
  },
});
