import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  Heading,
  Body,
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
import BottomNavBar, { NavTab, BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { SEGMENTO_THEME } from '../components/SubastaCard';
import { formatPrecio } from '../utils/format';
import { Compra, CompraEstado, CompraTab } from '../types/compra';
import { getMockCompras } from '../mocks/compras';

type Props = NativeStackScreenProps<RootStackParamList, 'MisCompras'>;

/**
 * Mis Compras (tab COMPRAS del BottomNavBar).
 *
 * Replica el frame "Mis Compras" de image4: header, tabs por estado y cards de
 * compra con badge de estado, monto y CTA. Consume `GET /api/compras` (mock).
 *
 * Las cards llevan al detalle; el CTA es la accion principal segun estado
 * (Pagar multa / Completar pago / Ver factura). Cuando exista backend, el
 * efecto se reemplaza por la query real.
 */
export default function MisComprasScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<NavTab>('compras');
  const [tab, setTab] = useState<CompraTab>('todas');
  const [loading, setLoading] = useState(true);
  const [compras, setCompras] = useState<Compra[]>([]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setCompras(getMockCompras(tab));
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [tab]);

  const irADetalle = (compraId: string) =>
    navigation.navigate('CompraDetail', { compraId });

  const irAPagar = (compra: Compra) => {
    if (compra.estado === 'multa_pendiente') {
      navigation.navigate('ResumenPago', { compraId: compra.id, tipo: 'multa' });
    } else if (compra.estado === 'pago_pendiente') {
      navigation.navigate('ResumenPago', {
        compraId: compra.id,
        tipo: 'comisiones',
      });
    } else {
      Alert.alert(
        'Factura',
        'El visor de factura y recibo se habilita en la próxima iteración. La compra ya está registrada.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      <View style={styles.headerBlock}>
        <Heading style={styles.titulo}>Mis Compras</Heading>
        <View style={styles.tabBar}>
          <TabButton label="Todas" active={tab === 'todas'} onPress={() => setTab('todas')} />
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
      ) : compras.length === 0 ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="bag" size={48} color={colors.textSubtle} />}
            title="No hay compras acá"
            description="Cuando ganes una puja, tus compras van a aparecer en esta sección."
            actionLabel="Ir a subastas"
            onAction={() => navigation.navigate('Subastas')}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.body}>
            {compras.map((c) => (
              <CompraCard
                key={c.id}
                compra={c}
                onOpen={() => irADetalle(c.id)}
                onAction={() => irAPagar(c)}
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

// ── Card de compra ──────────────────────────────────────────────────────────

function CompraCard({
  compra,
  onOpen,
  onAction,
}: {
  compra: Compra;
  onOpen: () => void;
  onAction: () => void;
}) {
  const theme = SEGMENTO_THEME[compra.item.segmento];
  const estadoTone = ESTADO_TONE[compra.estado];
  const accion = ACCION_POR_ESTADO[compra.estado];

  return (
    <Card variant="flat" padding="none" onPress={onOpen} style={styles.card}>
      <View style={styles.cardRow}>
        <View style={[styles.thumb, { backgroundColor: theme.bg }]}>
          <Icon name={theme.icon} size={32} color={theme.fg} />
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.badgeRow}>
            <Badge tone={estadoTone.tone} variant={estadoTone.variant}>
              {ESTADO_BADGE_LABEL[compra.estado]}
            </Badge>
          </View>
          <Typography style={styles.cardTitulo} numberOfLines={1}>
            {compra.item.titulo}
          </Typography>
          <Typography style={styles.cardSub} numberOfLines={1}>
            {compra.subastaTitulo}
          </Typography>
          <Typography style={styles.cardMonto}>
            {formatPrecio(compra.montoAdjudicado, compra.moneda)}
          </Typography>
        </View>
      </View>

      <Button
        variant={accion.variant}
        size="sm"
        onPress={onAction}
        style={styles.cardCta}
      >
        {accion.label}
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

// ── Mapeos de presentacion ──────────────────────────────────────────────────

type BadgeTone = {
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  variant: 'solid' | 'soft';
};

const ESTADO_TONE: Record<CompraEstado, BadgeTone> = {
  multa_pendiente: { tone: 'danger', variant: 'solid' },
  pago_pendiente: { tone: 'warning', variant: 'solid' },
  pagada: { tone: 'success', variant: 'soft' },
  completada: { tone: 'success', variant: 'soft' },
};

const ESTADO_BADGE_LABEL: Record<CompraEstado, string> = {
  multa_pendiente: 'CON MULTA',
  pago_pendiente: 'PAGO PENDIENTE',
  pagada: 'PAGADA',
  completada: 'COMPLETADA',
};

type Accion = { label: string; variant: 'primary' | 'secondary' | 'danger' };

const ACCION_POR_ESTADO: Record<CompraEstado, Accion> = {
  multa_pendiente: { label: 'Pagar multa', variant: 'danger' },
  pago_pendiente: { label: 'Completar pago', variant: 'primary' },
  pagada: { label: 'Ver factura', variant: 'secondary' },
  completada: { label: 'Ver factura', variant: 'secondary' },
};

// ── Estilos ─────────────────────────────────────────────────────────────────

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
