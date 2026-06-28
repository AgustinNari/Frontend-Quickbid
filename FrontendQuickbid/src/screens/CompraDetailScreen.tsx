import React, { useCallback, useEffect, useState } from 'react';
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
import BottomNavBar, {
  NavTab,
  BOTTOM_NAV_HEIGHT,
} from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { formatPrecio } from '../utils/format';
import { comprasApi } from '../api/compras';
import { userFacingError } from '../api/client';
import {
  CompraDetalleUi,
  DocumentoCompraUi,
  isEntregaEditable,
  mapCompraDetalle,
  mapDocumentoCompra,
  tipoPagoForCompra,
  totalParaPago,
} from '../mappers/compras';
import { useNetwork } from '../context/NetworkContext';

type Props = NativeStackScreenProps<RootStackParamList, 'CompraDetail'>;

export default function CompraDetailScreen({ navigation, route }: Props) {
  const { compraId } = route.params;
  const { confirmHeavyAction } = useNetwork();
  const [activeTab, setActiveTab] = useState<NavTab>('compras');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compra, setCompra] = useState<CompraDetalleUi | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoCompraUi[]>([]);
  const [docsError, setDocsError] = useState<string | null>(null);
  const minuteTick = useMinuteTick();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDocsError(null);
    try {
      const id = Number(compraId);
      const detalle = await comprasApi.detalle(id);
      setCompra(mapCompraDetalle(detalle));
      try {
        const docs = await comprasApi.documentos(id);
        setDocumentos(docs.map(mapDocumentoCompra));
      } catch (err) {
        setDocumentos([]);
        setDocsError(readableError(err));
      }
    } catch (err) {
      setError(readableError(err));
      setCompra(null);
      setDocumentos([]);
    } finally {
      setLoading(false);
    }
  }, [compraId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDocumento = async (doc: DocumentoCompraUi) => {
    if (!doc.downloadAvailable || !doc.downloadUrl) {
      Alert.alert(
        'Archivo no disponible',
        'El documento no está disponible en este momento. Intentá generarlo nuevamente o contactá a soporte.',
      );
      return;
    }
    if (!(await confirmHeavyAction())) return;
    try {
      const downloaded = await comprasApi.descargarDocumento(
        doc.downloadUrl,
        doc.filename,
      );
      Alert.alert(
        downloaded.shared ? 'Documento listo' : 'Documento recibido',
        `${downloaded.filename ?? doc.filename} - ${downloaded.sizeBytes} bytes - ${downloaded.contentType}.${
          downloaded.shared
            ? ' Se abrió el menú del sistema para elegir cómo usarlo.'
            : ' El dispositivo confirmó la recepción del archivo.'
        }`,
      );
    } catch (err) {
      Alert.alert(
        'Documento no disponible',
        userFacingError(
          err,
          'El documento no está disponible en este momento. Intentá generarlo nuevamente o contactá a soporte.',
        ),
      );
    }
  };

  const handleAccion = async () => {
    if (!compra) return;
    const tipo = tipoPagoForCompra(compra);
    if (tipo) {
      navigation.navigate('ResumenPago', { compraId: compra.id, tipo });
      return;
    }
    if (documentos.length > 0) {
      await handleDocumento(documentos[0]);
      return;
    }
    Alert.alert(
      'Documentos',
      'Todavía no hay documentos disponibles para esta compra.',
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      {loading ? (
        <Loader fullScreen label="Cargando compra..." />
      ) : error ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="alert" size={48} color={colors.danger} />}
            title="No pudimos abrir la compra"
            description={error}
            actionLabel="Reintentar"
            onAction={load}
          />
        </View>
      ) : !compra ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="inbox" size={48} color={colors.textSubtle} />}
            title="No encontramos la compra"
            description="La compra que intentás abrir no existe o no pertenece a tu cuenta."
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
              <View style={styles.titleBlock}>
                <Typography style={styles.overline}>
                  {compra.loteLabel.toUpperCase()}
                </Typography>
                <Heading style={styles.titulo}>{compra.title}</Heading>
                <Body muted style={styles.autor}>
                  {compra.subtitle}
                </Body>
              </View>

              <Card variant="flat" padding="none" style={styles.adjCard}>
                <View style={styles.adjInner}>
                  <Typography style={styles.adjLabel}>
                    Adjudicado por
                  </Typography>
                  <Typography style={styles.adjValue}>
                    {formatPrecio(compra.montoAdjudicacion, compra.moneda)}
                  </Typography>
                </View>
                <View style={styles.adjDivider} />
                <View style={styles.adjInner}>
                  <Typography style={styles.adjLabel}>Estado</Typography>
                  <Badge
                    tone={compra.badge.tone}
                    variant={compra.badge.variant}
                  >
                    {compra.estadoLabel.toUpperCase()}
                  </Badge>
                </View>
              </Card>

              <DesgloseEconomico compra={compra} />
              <MultaSection compra={compra} now={minuteTick} />
              <EntregaSection compra={compra} />
              <DocumentosSection
                compra={compra}
                documentos={documentos}
                error={docsError}
                onShow={handleDocumento}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <CompraCta
              compra={compra}
              documentos={documentos}
              onPress={handleAccion}
            />
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

function Hero({ compra }: { compra: CompraDetalleUi }) {
  return (
    <View style={styles.hero}>
      <Icon
        name={compra.action === 'pagar_multa' ? 'alert' : 'bag'}
        size={86}
        color={colors.primary}
      />
      <View style={styles.heroBadge}>
        <Badge tone={compra.badge.tone} variant="solid">
          {compra.estadoLabel.toUpperCase()}
        </Badge>
      </View>
    </View>
  );
}

function DesgloseEconomico({ compra }: { compra: CompraDetalleUi }) {
  const moneda = compra.moneda;
  const tipo = tipoPagoForCompra(compra);

  if (tipo === 'multa' && compra.multa) {
    return (
      <View style={styles.econCard}>
        <Typography style={styles.econLabel}>
          A PAGAR (ARTÍCULO + MULTA)
        </Typography>
        <EconRow
          label="Oferta ganadora"
          value={formatPrecio(compra.montoAdjudicacion, moneda)}
        />
        <EconRow
          label="Multa"
          value={formatPrecio(compra.multa.monto, moneda)}
          danger
        />
        <View style={styles.econDivider} />
        <EconRow
          label="Total a pagar"
          value={formatPrecio(totalParaPago(compra, 'multa'), moneda)}
          emphasized
        />
      </View>
    );
  }

  if (tipo === 'comisiones') {
    return (
      <View style={styles.econCard}>
        <Typography style={styles.econLabel}>
          A PAGAR (COMISIONES + ENVÍO)
        </Typography>
        <EconRow
          label="Artículo"
          value={`${formatPrecio(
            compra.montoAdjudicacion,
            moneda,
          )} · adjudicado`}
        />
        <EconRow
          label="Comisión comprador"
          value={formatPrecio(compra.comisionComprador, moneda)}
        />
        <EconRow
          label="Envío"
          value={formatPrecio(compra.entrega?.costoEnvio ?? 0, moneda)}
        />
        {!compra.entrega ? (
          <Typography style={styles.helpText}>
            Elegís envío o retiro antes de confirmar el pago.
          </Typography>
        ) : null}
        <View style={styles.econDivider} />
        <EconRow
          label="Total extras"
          value={formatPrecio(totalParaPago(compra, 'comisiones'), moneda)}
          emphasized
        />
      </View>
    );
  }

  const totalPagado =
    compra.montoAdjudicacion +
    compra.comisionComprador +
    Number(compra.entrega?.costoEnvio ?? 0);
  return (
    <View style={styles.econCard}>
      <Typography style={styles.econLabel}>RESUMEN ECONOMICO</Typography>
      <EconRow
        label="Oferta ganadora"
        value={formatPrecio(compra.montoAdjudicacion, moneda)}
      />
      <EconRow
        label="Comisión comprador"
        value={formatPrecio(compra.comisionComprador, moneda)}
      />
      <EconRow
        label="Envío"
        value={formatPrecio(compra.entrega?.costoEnvio ?? 0, moneda)}
      />
      <View style={styles.econDivider} />
      <EconRow
        label="Total asociado"
        value={formatPrecio(totalPagado, moneda)}
        emphasized
      />
    </View>
  );
}

function MultaSection({
  compra,
  now,
}: {
  compra: CompraDetalleUi;
  now: number;
}) {
  if (!compra.multa) return null;
  const pending = compra.multa.estado === 'pendiente';
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <Icon name="alert" size={18} color={colors.danger} />
        <Typography style={styles.econLabel}>MULTA</Typography>
      </View>
      <EconRow label="ID multa" value={`#${compra.multa.id}`} />
      <EconRow
        label="Monto"
        value={formatPrecio(compra.multa.monto, compra.multa.moneda)}
        danger={compra.multa.estado === 'pendiente'}
      />
      <EconRow label="Estado" value={humanize(compra.multa.estado)} />
      <EconRow
        label="Vencimiento"
        value={formatShortDate(compra.multa.venceAt)}
      />
      {pending && compra.multa.venceAt ? (
        <>
          <EconRow
            label="Tiempo límite"
            value={formatFineCountdown(compra.multa.venceAt, now)}
            danger
          />
          <Typography style={styles.fineHelpText}>
            Tiempo límite para pagar artículo y multa antes de que la cuenta
            quede bloqueada.
          </Typography>
        </>
      ) : null}
      {compra.multa.paidAt ? (
        <EconRow label="Pagada" value={formatShortDate(compra.multa.paidAt)} />
      ) : null}
    </View>
  );
}

function EntregaSection({ compra }: { compra: CompraDetalleUi }) {
  const editable = isEntregaEditable(compra.estado);
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <Icon
          name={compra.entrega?.tipo === 'retiro' ? 'bank' : 'bag'}
          size={18}
          color={colors.primary}
        />
        <Typography style={styles.econLabel}>ENTREGA</Typography>
      </View>
      <Typography style={styles.entregaTitulo}>
        {compra.entregaLabel}
      </Typography>
      <Typography style={styles.entregaSub}>
        {compra.entregaDescription}
      </Typography>
      {compra.entrega ? (
        <>
          <EconRow
            label="Estado entrega"
            value={humanize(compra.entrega.estado)}
          />
          <EconRow
            label="Costo"
            value={formatPrecio(compra.entrega.costoEnvio, compra.moneda)}
          />
          {compra.direccionSnapshotLabel ? (
            <EconRow
              label="Dirección registrada"
              value={compra.direccionSnapshotLabel}
            />
          ) : null}
        </>
      ) : editable ? (
        <Typography style={styles.helpText}>
          La selección se hace en el resumen de pago antes de confirmar.
        </Typography>
      ) : null}
    </View>
  );
}

function DocumentosSection({
  compra,
  documentos,
  error,
  onShow,
}: {
  compra: CompraDetalleUi;
  documentos: DocumentoCompraUi[];
  error: string | null;
  onShow: (doc: DocumentoCompraUi) => void;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <Icon name="check-doc" size={18} color={colors.primary} />
        <Typography style={styles.econLabel}>DOCUMENTOS</Typography>
      </View>
      {error ? <Typography style={styles.helpText}>{error}</Typography> : null}
      {!error && documentos.length === 0 ? (
        <Typography style={styles.helpText}>
          No hay documentos disponibles todavía.
        </Typography>
      ) : null}
      {documentos.map(doc => (
        <Card key={doc.id} variant="flat" padding="none" style={styles.docCard}>
          <View style={styles.docInfo}>
            <Typography style={styles.docTitle}>{doc.tipoLabel}</Typography>
            <Typography style={styles.docMeta}>
              {documentDescription(doc, compra)}
            </Typography>
            <Typography style={styles.docMeta}>{doc.filename}</Typography>
            <Typography style={styles.docMeta}>
              {doc.estadoLabel} · {doc.fechaLabel} · {doc.sizeLabel}
            </Typography>
          </View>
          {doc.downloadAvailable ? (
            <Button
              variant="secondary"
              size="sm"
              onPress={() => onShow(doc)}
              fullWidth={false}
            >
              Abrir o compartir
            </Button>
          ) : (
            <Typography style={styles.docMeta}>Archivo no disponible</Typography>
          )}
        </Card>
      ))}
    </View>
  );
}

function documentDescription(
  doc: DocumentoCompraUi,
  compra: CompraDetalleUi,
) {
  if (doc.tipo === 'recibo_multa') {
    return 'Documenta el artículo adjudicado y la multa pagada. No incluye comisión ni entrega pendientes.';
  }
  if (doc.tipo === 'factura_compra' && compra.multa?.estado === 'pagada') {
    return 'Comprobante de extras: comisión y entrega o retiro. El artículo ya fue documentado con la multa.';
  }
  if (doc.tipo === 'factura_compra') {
    return 'Incluye artículo, comisión y entrega o retiro según corresponda.';
  }
  return 'Documento emitido por QuickBid para esta compra.';
}

function CompraCta({
  compra,
  documentos,
  onPress,
}: {
  compra: CompraDetalleUi;
  documentos: DocumentoCompraUi[];
  onPress: () => void;
}) {
  if (compra.action === 'pagar_multa') {
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
  if (compra.action === 'pagar_extras') {
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
    <Button
      variant="secondary"
      onPress={onPress}
      leftIcon={<Icon name="check-doc" size={18} />}
      disabled={documentos.length === 0}
    >
      Abrir documento
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
      <Typography
        style={[
          styles.econRowLabel,
          emphasized ? styles.econRowLabelStrong : null,
        ]}
      >
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

function readableError(err: unknown) {
  return userFacingError(
    err,
    'QuickBid no está disponible. Probalo de nuevo en unos minutos.',
  );
}

function useMinuteTick() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);
  return now;
}

function formatFineCountdown(venceAt: string, now: number) {
  const deadline = Date.parse(venceAt);
  if (Number.isNaN(deadline)) return 'Activo';
  const remaining = deadline - now;
  if (remaining <= 0) return 'Vencido';
  const totalMinutes = Math.ceil(remaining / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} h ${minutes} min`;
}

function formatShortDate(iso: string | null) {
  if (!iso) return 'Sin fecha';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function humanize(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/^\w|\s\w/g, match => match.toUpperCase());
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg },
  errorWrap: { flex: 1, paddingHorizontal: layout.screenPaddingHorizontal },
  hero: {
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.infoSoft,
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
  titleBlock: { gap: spacing.xs },
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
  adjDivider: {
    width: 1,
    backgroundColor: colors.borderMuted,
    marginVertical: spacing.sm,
  },
  adjLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  adjValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  econCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.base,
    gap: spacing.sm,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.base,
    gap: spacing.sm,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
  econRowLabel: { flex: 1, fontSize: fontSize.base, color: colors.textLabel },
  econRowLabelStrong: { fontWeight: fontWeight.bold, color: colors.text },
  econRowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: fontSize.base,
    color: colors.textLabel,
    fontWeight: fontWeight.semibold,
  },
  econRowValueStrong: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  econRowValueDanger: { color: colors.danger },
  econDivider: { height: 1, backgroundColor: colors.borderMuted },
  helpText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: fontSize.sm * 1.45,
  },
  fineHelpText: {
    fontSize: fontSize.sm,
    color: colors.danger,
    lineHeight: fontSize.sm * 1.45,
  },
  entregaTitulo: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  entregaSub: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: fontSize.sm * 1.45,
  },
  docCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  docInfo: { gap: 2 },
  docTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  docMeta: { fontSize: fontSize.sm, color: colors.textMuted },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.base,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
});
