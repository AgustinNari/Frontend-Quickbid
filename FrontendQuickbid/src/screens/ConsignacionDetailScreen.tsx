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
import {
  ConsignacionDetalle,
  EstadoConsignacion,
  EtapaConsignacion,
  ESTADO_CONSIGNACION_LABEL,
} from '../types/consignacion';
import {
  getConsignacionDetalle,
  aceptarAcuerdo,
  rechazarAcuerdo,
} from '../mocks/consignacion';

type Props = NativeStackScreenProps<RootStackParamList, 'ConsignacionDetail'>;

/**
 * Detalle de consignacion con timeline (`GET /api/consignaciones/{id}`), image5.
 *
 * Muestra el workflow de 5 etapas (Validacion -> Verificacion fisica ->
 * Acuerdo -> En subasta -> Liquidacion) con el estado de cada una, y -cuando
 * corresponde- el acuerdo propuesto con aceptar/rechazar
 * (`POST /acuerdo/aceptar|rechazar`). El flujo de devolucion y los visores de
 * documento quedan como placeholder (alcance acordado).
 */
export default function ConsignacionDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const [activeTab, setActiveTab] = useState<NavTab>('consignar');
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState<ConsignacionDetalle | null>(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDetalle(getConsignacionDetalle(id));
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [id]);

  const refrescar = () => setDetalle(getConsignacionDetalle(id));

  const handleAceptar = () => {
    setProcesando(true);
    setTimeout(() => {
      const r = aceptarAcuerdo(id);
      setProcesando(false);
      if (r.ok) {
        refrescar();
        Alert.alert(
          'Acuerdo aceptado',
          'Tu bien se va a publicar para la próxima subasta.',
        );
      } else {
        Alert.alert('No se pudo aceptar', r.error.mensaje);
      }
    }, 1200);
  };

  const handleRechazar = () => {
    Alert.alert(
      'Rechazar acuerdo',
      'Si rechazás, la consignación se cancela y el bien entra en devolución. ¿Continuar?',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: () => {
            const r = rechazarAcuerdo(id);
            if (r.ok) refrescar();
            else Alert.alert('No se pudo rechazar', r.error.mensaje);
          },
        },
      ],
    );
  };

  const handleDocumento = (nombre: string) =>
    Alert.alert(nombre, 'El visor de documentos se habilita en la próxima iteración.');

  const handleDevolucion = () =>
    Alert.alert(
      'Gestionar devolución',
      'El flujo de devolución (retiro / envío) se habilita en la próxima iteración.',
    );

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      {loading ? (
        <Loader fullScreen label="Cargando consignación..." />
      ) : !detalle ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="alert" size={48} color={colors.textSubtle} />}
            title="No encontramos la consignación"
            description="La consignación que intentás abrir no existe."
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
            <Hero detalle={detalle} />

            <View style={styles.body}>
              <Typography style={styles.codigo}>{detalle.codigo}</Typography>
              <Heading style={styles.nombre}>{detalle.nombre}</Heading>
              <Body muted style={styles.fecha}>
                Consignado el {detalle.fecha}
              </Body>

              {detalle.precioBase > 0 ? (
                <Card variant="flat" padding="none" style={styles.precioCard}>
                  <View style={styles.precioCol}>
                    <Typography style={styles.precioLabel}>Precio base</Typography>
                    <Typography style={styles.precioValue}>
                      {formatPrecio(detalle.precioBase, detalle.moneda)}
                    </Typography>
                  </View>
                  {detalle.montoEstimado ? (
                    <>
                      <View style={styles.precioDivider} />
                      <View style={styles.precioCol}>
                        <Typography style={styles.precioLabel}>Estimado a cobrar</Typography>
                        <Typography style={styles.precioValueAlt}>
                          {formatPrecio(detalle.montoEstimado, detalle.moneda)}
                        </Typography>
                      </View>
                    </>
                  ) : null}
                </Card>
              ) : null}

              {/* Timeline */}
              <View style={styles.section}>
                <Typography style={styles.sectionLabel}>ESTADO ACTUAL</Typography>
                <View style={styles.timelineCard}>
                  {detalle.etapas.map((e, i) => (
                    <TimelineRow
                      key={e.id}
                      etapa={e}
                      esUltima={i === detalle.etapas.length - 1}
                    />
                  ))}
                </View>
              </View>

              {/* Acuerdo pendiente */}
              {detalle.estado === 'acuerdo_pendiente' && detalle.acuerdo ? (
                <View style={styles.acuerdoCard}>
                  <Typography style={styles.acuerdoLabel}>PROPUESTA DE ACUERDO</Typography>
                  <Body style={styles.acuerdoIntro}>
                    La empresa propone estas condiciones para publicar tu bien:
                  </Body>
                  <AcuerdoRow
                    label="Precio base"
                    value={formatPrecio(detalle.acuerdo.precioBase, detalle.moneda)}
                  />
                  <AcuerdoRow
                    label={`Comisión vendedor (${detalle.acuerdo.comisionVendedor}%)`}
                    value={`- ${formatPrecio(
                      detalle.acuerdo.precioBase - detalle.acuerdo.estimadoVendedor,
                      detalle.moneda,
                    )}`}
                  />
                  <View style={styles.acuerdoDivider} />
                  <AcuerdoRow
                    label="Estimado a cobrar"
                    value={formatPrecio(detalle.acuerdo.estimadoVendedor, detalle.moneda)}
                    emphasized
                  />
                  <Typography style={styles.acuerdoVigencia}>
                    Vigencia de la propuesta: {detalle.acuerdo.vigencia}
                  </Typography>
                </View>
              ) : null}

              {/* Rechazo / devolucion */}
              {detalle.estado === 'rechazada' || detalle.estado === 'devolucion_pendiente' ? (
                <View style={styles.rechazoCard}>
                  <View style={styles.rechazoHeader}>
                    <Icon name="alert" size={18} color={colors.danger} />
                    <Typography style={styles.rechazoTitulo}>
                      {detalle.estado === 'rechazada' ? 'Consignación rechazada' : 'En devolución'}
                    </Typography>
                  </View>
                  {detalle.motivoRechazo ? (
                    <Body style={styles.rechazoMotivo}>{detalle.motivoRechazo}</Body>
                  ) : (
                    <Body style={styles.rechazoMotivo}>
                      Rechazaste el acuerdo. Coordiná la devolución del bien.
                    </Body>
                  )}
                  <Button variant="secondary" size="sm" onPress={handleDevolucion}>
                    Gestionar devolución
                  </Button>
                </View>
              ) : null}

              {/* Documentos */}
              {detalle.acuerdo && detalle.estado !== 'acuerdo_pendiente' ? (
                <View style={styles.section}>
                  <Typography style={styles.sectionLabel}>DOCUMENTOS</Typography>
                  <View style={styles.docsRow}>
                    <DocButton label="Acuerdo" onPress={() => handleDocumento('Acuerdo')} />
                    <DocButton label="Póliza" onPress={() => handleDocumento('Póliza')} />
                    {detalle.estado === 'liquidada' ? (
                      <DocButton
                        label="Liquidación"
                        onPress={() => handleDocumento('Liquidación')}
                      />
                    ) : null}
                  </View>
                </View>
              ) : null}
            </View>
          </ScrollView>

          {/* Footer de acuerdo */}
          {detalle.estado === 'acuerdo_pendiente' ? (
            <View style={styles.footer}>
              <Button onPress={handleAceptar} loading={procesando}>
                Aceptar acuerdo
              </Button>
              <Button
                variant="secondary"
                onPress={handleRechazar}
                disabled={procesando}
                style={styles.footerSecondary}
              >
                Rechazar
              </Button>
            </View>
          ) : null}
        </>
      )}

      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} navigation={navigation} />
    </SafeAreaView>
  );
}

// ── Sub-componentes ─────────────────────────────────────────────────────────

function Hero({ detalle }: { detalle: ConsignacionDetalle }) {
  const theme = SEGMENTO_THEME[detalle.segmento];
  return (
    <View style={[styles.hero, { backgroundColor: theme.bg }]}>
      <Icon name={theme.icon} size={80} color={theme.fg} />
      <View style={styles.heroBadge}>
        <Badge tone={ESTADO_TONE[detalle.estado]} variant="solid">
          {ESTADO_CONSIGNACION_LABEL[detalle.estado].toUpperCase()}
        </Badge>
      </View>
    </View>
  );
}

function TimelineRow({ etapa, esUltima }: { etapa: EtapaConsignacion; esUltima: boolean }) {
  const v = ETAPA_VISUAL[etapa.estado];
  return (
    <View style={styles.tlRow}>
      <View style={styles.tlMarker}>
        <View style={[styles.tlDot, { backgroundColor: v.bg, borderColor: v.border }]}>
          {v.icon ? <Icon name={v.icon} size={13} color={v.iconColor} /> : null}
        </View>
        {!esUltima ? (
          <View
            style={[
              styles.tlLine,
              { backgroundColor: etapa.estado === 'completada' ? colors.success : colors.borderMuted },
            ]}
          />
        ) : null}
      </View>
      <View style={styles.tlInfo}>
        <Typography style={[styles.tlLabel, etapa.estado === 'pendiente' ? styles.tlLabelMuted : null]}>
          {etapa.label}
        </Typography>
        <Typography style={[styles.tlEstado, { color: v.textColor }]}>
          {v.texto}
        </Typography>
        {etapa.detalle ? (
          <Typography style={styles.tlDetalle}>{etapa.detalle}</Typography>
        ) : null}
      </View>
    </View>
  );
}

function AcuerdoRow({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <View style={styles.acuerdoRow}>
      <Typography style={[styles.acuerdoRowLabel, emphasized ? styles.acuerdoRowStrong : null]}>
        {label}
      </Typography>
      <Typography style={[styles.acuerdoRowValue, emphasized ? styles.acuerdoRowValueStrong : null]}>
        {value}
      </Typography>
    </View>
  );
}

function DocButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Button variant="secondary" size="sm" onPress={onPress} fullWidth={false} style={styles.docBtn}>
      {label}
    </Button>
  );
}

// ── Mapeos ──────────────────────────────────────────────────────────────────

const ESTADO_TONE: Record<EstadoConsignacion, 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  en_validacion: 'info',
  recepcion_pendiente: 'info',
  revision_fisica: 'info',
  acuerdo_pendiente: 'warning',
  acuerdo_aceptado: 'primary',
  en_subasta: 'primary',
  vendida: 'success',
  liquidada: 'success',
  rechazada: 'danger',
  devolucion_pendiente: 'danger',
};

type EtapaVisual = {
  bg: string;
  border: string;
  icon: 'check' | 'x' | null;
  iconColor: string;
  texto: string;
  textColor: string;
};

const ETAPA_VISUAL: Record<EtapaConsignacion['estado'], EtapaVisual> = {
  completada: {
    bg: colors.success,
    border: colors.success,
    icon: 'check',
    iconColor: colors.textInverse,
    texto: 'Completado',
    textColor: colors.success,
  },
  actual: {
    bg: colors.primary,
    border: colors.primary,
    icon: null,
    iconColor: colors.textInverse,
    texto: 'En curso',
    textColor: colors.primary,
  },
  pendiente: {
    bg: colors.surface,
    border: colors.border,
    icon: null,
    iconColor: colors.textSubtle,
    texto: 'Pendiente',
    textColor: colors.textSubtle,
  },
  rechazada: {
    bg: colors.danger,
    border: colors.danger,
    icon: 'x',
    iconColor: colors.textInverse,
    texto: 'Rechazado',
    textColor: colors.danger,
  },
};

// ── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg },
  errorWrap: { flex: 1, paddingHorizontal: layout.screenPaddingHorizontal },
  hero: { height: 180, alignItems: 'center', justifyContent: 'center' },
  heroBadge: { position: 'absolute', top: spacing.base, left: spacing.base },
  body: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    gap: spacing.base,
  },
  codigo: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  nombre: { fontSize: fontSize['2xl'], marginTop: -spacing.xs },
  fecha: { marginTop: -spacing.xs },
  precioCard: { flexDirection: 'row', marginTop: spacing.sm },
  precioCol: { flex: 1, padding: spacing.base, gap: spacing.xs },
  precioDivider: { width: 1, backgroundColor: colors.borderMuted, marginVertical: spacing.sm },
  precioLabel: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.medium },
  precioValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  precioValueAlt: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.success },
  section: { gap: spacing.sm, marginTop: spacing.xs },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  timelineCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.base,
  },
  tlRow: { flexDirection: 'row', gap: spacing.sm },
  tlMarker: { alignItems: 'center', width: 26 },
  tlDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlLine: { width: 2, flex: 1, minHeight: 18, marginVertical: 2 },
  tlInfo: { flex: 1, paddingBottom: spacing.base },
  tlLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  tlLabelMuted: { color: colors.textMuted },
  tlEstado: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginTop: 1 },
  tlDetalle: { fontSize: fontSize.sm, color: colors.danger, marginTop: 2 },
  acuerdoCard: {
    backgroundColor: colors.infoSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.info,
    padding: spacing.base,
    gap: spacing.sm,
  },
  acuerdoLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.info,
    letterSpacing: letterSpacing.wider,
  },
  acuerdoIntro: { fontSize: fontSize.sm, color: colors.text },
  acuerdoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  acuerdoRowLabel: { fontSize: fontSize.base, color: colors.textLabel },
  acuerdoRowStrong: { fontWeight: fontWeight.bold, color: colors.text },
  acuerdoRowValue: { fontSize: fontSize.base, color: colors.text, fontWeight: fontWeight.semibold },
  acuerdoRowValueStrong: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primary },
  acuerdoDivider: { height: 1, backgroundColor: colors.info, opacity: 0.3 },
  acuerdoVigencia: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  rechazoCard: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.base,
    gap: spacing.sm,
  },
  rechazoHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rechazoTitulo: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.danger },
  rechazoMotivo: { fontSize: fontSize.sm, color: colors.text },
  docsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  docBtn: { flexGrow: 1 },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.base,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  footerSecondary: { marginBottom: spacing.xs },
});
