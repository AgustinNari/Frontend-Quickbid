import React, { useEffect, useState } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  StyleSheet,
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
import { CompraDetalle, ModalidadEntrega } from '../types/compra';
import { getMockCompra, getTipoPago, getTotalPago } from '../mocks/compras';

type Props = NativeStackScreenProps<RootStackParamList, 'CompraDetail'>;

/**
 * Detalle de una compra (`GET /api/compras/{id}`).
 *
 * Replica el frame "Detalle Entrega y Producto" de image4: hero del item,
 * adjudicacion, desglose economico segun el estado (oferta + multa, o
 * comisiones + envio), modalidad de entrega y CTA que lleva al checkout.
 */
export default function CompraDetailScreen({ navigation, route }: Props) {
  const { compraId } = route.params;
  const [activeTab, setActiveTab] = useState<NavTab>('compras');
  const [loading, setLoading] = useState(true);
  const [compra, setCompra] = useState<CompraDetalle | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setCompra(getMockCompra(compraId));
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [compraId]);

  const handleAccion = () => {
    if (!compra) return;
    const tipo = getTipoPago(compra.estado);
    if (tipo) {
      navigation.navigate('ResumenPago', { compraId: compra.id, tipo });
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

      {loading ? (
        <Loader fullScreen label="Cargando compra..." />
      ) : !compra ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="alert" size={48} color={colors.textSubtle} />}
            title="No encontramos la compra"
            description="La compra que intentás abrir no existe."
            actionLabel="Volver"
            onAction={() => navigation.goBack()}
          />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <Hero compra={compra} />

            <View style={styles.body}>
              <Typography style={styles.overline}>LOTE {compra.item.lote}</Typography>
              <Heading style={styles.titulo}>{compra.item.titulo}</Heading>
              {compra.item.autor ? (
                <Body muted style={styles.autor}>
                  {compra.item.autor}
                </Body>
              ) : null}

              <Card variant="flat" padding="none" style={styles.adjCard}>
                <View style={styles.adjInner}>
                  <Typography style={styles.adjLabel}>Adjudicado por</Typography>
                  <Typography style={styles.adjValue}>
                    {formatPrecio(compra.montoAdjudicado, compra.moneda)}
                  </Typography>
                </View>
                <View style={styles.adjDivider} />
                <View style={styles.adjInner}>
                  <Typography style={styles.adjLabel}>Subasta</Typography>
                  <Typography style={styles.adjSubasta} numberOfLines={2}>
                    {compra.subastaTitulo}
                  </Typography>
                </View>
              </Card>

              <DesgloseEconomico compra={compra} />

              <EntregaSection compra={compra} />

              {compra.descripcion ? (
                <View style={styles.descripcionWrap}>
                  <Typography style={styles.descripcionLabel}>DESCRIPCIÓN</Typography>
                  <Body style={styles.descripcion}>{compra.descripcion}</Body>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <CompraCta compra={compra} onPress={handleAccion} />
          </View>
        </>
      )}

      <BottomNavBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

// ── Sub-componentes ─────────────────────────────────────────────────────────

function Hero({ compra }: { compra: CompraDetalle }) {
  const theme = SEGMENTO_THEME[compra.item.segmento];
  return (
    <View style={[styles.hero, { backgroundColor: theme.bg }]}>
      <Icon name={theme.icon} size={88} color={theme.fg} />
      <View style={styles.heroBadge}>
        <Badge tone={BADGE_TONE[compra.estado]} variant="solid">
          {BADGE_LABEL[compra.estado]}
        </Badge>
      </View>
    </View>
  );
}

/**
 * Desglose economico segun estado:
 *  - multa_pendiente -> oferta + multa = total a pagar.
 *  - pago_pendiente  -> comisiones + envio = total a pagar (articulo ya cobrado).
 *  - pagada/completada -> total pagado + numero de factura.
 */
function DesgloseEconomico({ compra }: { compra: CompraDetalle }) {
  const m = compra.moneda;

  if (compra.estado === 'multa_pendiente' && compra.multa) {
    const total = getTotalPago(compra, 'multa');
    return (
      <View style={styles.econCard}>
        <Typography style={styles.econLabel}>A PAGAR (ARTÍCULO + MULTA)</Typography>
        <EconRow label="Oferta ganadora" value={formatPrecio(compra.montoAdjudicado, m)} />
        <EconRow
          label={`Multa (${compra.multa.porcentaje}%)`}
          value={formatPrecio(compra.multa.monto, m)}
          danger
        />
        <View style={styles.econDivider} />
        <EconRow label="Total a pagar" value={formatPrecio(total, m)} emphasized />
      </View>
    );
  }

  if (compra.estado === 'pago_pendiente') {
    const total = getTotalPago(compra, 'comisiones');
    return (
      <View style={styles.econCard}>
        <Typography style={styles.econLabel}>A PAGAR (COMISIONES + ENVÍO)</Typography>
        <EconRow
          label="Artículo"
          value={`${formatPrecio(compra.montoAdjudicado, m)} · pagado`}
        />
        <EconRow label="Comisión" value={formatPrecio(compra.comision ?? 0, m)} />
        <EconRow label="Envío" value={formatPrecio(compra.envio ?? 0, m)} />
        <View style={styles.econDivider} />
        <EconRow label="Total a pagar" value={formatPrecio(total, m)} emphasized />
      </View>
    );
  }

  // pagada / completada
  const totalPagado =
    compra.montoAdjudicado + (compra.comision ?? 0) + (compra.envio ?? 0);
  return (
    <View style={styles.econCard}>
      <Typography style={styles.econLabel}>PAGO COMPLETO</Typography>
      <EconRow label="Total pagado" value={formatPrecio(totalPagado, m)} emphasized />
      {compra.numeroFactura ? (
        <EconRow label="Factura" value={`N° ${compra.numeroFactura}`} />
      ) : null}
    </View>
  );
}

function EntregaSection({ compra }: { compra: CompraDetalle }) {
  const modalidad: ModalidadEntrega =
    compra.modalidadEntrega ??
    (compra.envio && compra.envio > 0 ? 'envio' : 'retiro');
  const esEnvio = modalidad === 'envio';
  return (
    <View style={styles.entregaCard}>
      <Typography style={styles.econLabel}>MODALIDAD DE ENTREGA</Typography>
      <View style={styles.entregaRow}>
        <View style={styles.entregaIcon}>
          <Icon name={esEnvio ? 'bag' : 'bank'} size={20} color={colors.primary} />
        </View>
        <View style={styles.entregaInfo}>
          <Typography style={styles.entregaTitulo}>
            {esEnvio ? 'Envío a domicilio' : 'Retiro en sede'}
          </Typography>
          <Typography style={styles.entregaSub}>
            {esEnvio
              ? 'Se suma el costo de envío. Incluye cobertura de seguro.'
              : 'Sin costo de envío. La cobertura de seguro termina al retirar.'}
          </Typography>
        </View>
      </View>
    </View>
  );
}

function CompraCta({
  compra,
  onPress,
}: {
  compra: CompraDetalle;
  onPress: () => void;
}) {
  if (compra.estado === 'multa_pendiente') {
    return (
      <Button
        variant="danger"
        onPress={onPress}
        leftIcon={<Icon name="alert" color={colors.textInverse} size={18} />}
      >
        Pagar artículo + multa
      </Button>
    );
  }
  if (compra.estado === 'pago_pendiente') {
    return (
      <Button
        onPress={onPress}
        leftIcon={<Icon name="card" color={colors.textInverse} size={18} />}
      >
        Completar pago
      </Button>
    );
  }
  return (
    <Button variant="secondary" onPress={onPress} leftIcon={<Icon name="check-doc" size={18} />}>
      Ver factura
    </Button>
  );
}

function EconRow({
  label,
  value,
  emphasized,
  danger,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
  danger?: boolean;
}) {
  return (
    <View style={styles.econRow}>
      <Typography style={[styles.econRowLabel, emphasized ? styles.econRowLabelStrong : null]}>
        {label}
      </Typography>
      <Typography
        style={[
          styles.econRowValue,
          emphasized ? styles.econRowValueStrong : null,
          danger ? styles.econRowValueDanger : null,
        ]}
      >
        {value}
      </Typography>
    </View>
  );
}

// ── Mapeos ──────────────────────────────────────────────────────────────────

const BADGE_TONE = {
  multa_pendiente: 'danger',
  pago_pendiente: 'warning',
  pagada: 'success',
  completada: 'success',
} as const;

const BADGE_LABEL = {
  multa_pendiente: 'CON MULTA',
  pago_pendiente: 'PAGO PENDIENTE',
  pagada: 'PAGADA',
  completada: 'COMPLETADA',
} as const;

// ── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg },
  errorWrap: { flex: 1, paddingHorizontal: layout.screenPaddingHorizontal },
  hero: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    position: 'absolute',
    top: spacing.base,
    left: spacing.base,
  },
  body: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    gap: spacing.base,
  },
  overline: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  titulo: { marginTop: -spacing.xs },
  autor: { marginTop: -spacing.sm },
  adjCard: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  adjInner: { flex: 1, padding: spacing.base, gap: spacing.xs },
  adjDivider: { width: 1, backgroundColor: colors.borderMuted, marginVertical: spacing.sm },
  adjLabel: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.medium },
  adjValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  adjSubasta: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.textLabel },
  econCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.base,
    gap: spacing.sm,
  },
  econLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  econRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.base,
  },
  econRowLabel: { fontSize: fontSize.base, color: colors.textLabel },
  econRowLabelStrong: { fontWeight: fontWeight.bold, color: colors.text },
  econRowValue: { fontSize: fontSize.base, color: colors.textLabel, fontWeight: fontWeight.semibold },
  econRowValueStrong: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.primary },
  econRowValueDanger: { color: colors.danger },
  econDivider: { height: 1, backgroundColor: colors.borderMuted },
  entregaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.base,
    gap: spacing.sm,
  },
  entregaRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  entregaIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.infoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entregaInfo: { flex: 1, gap: 2 },
  entregaTitulo: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  entregaSub: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: fontSize.sm * 1.4 },
  descripcionWrap: { marginTop: spacing.sm, gap: spacing.xs },
  descripcionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  descripcion: { color: colors.textLabel, lineHeight: fontSize.lg * 1.5 },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.base,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
});
