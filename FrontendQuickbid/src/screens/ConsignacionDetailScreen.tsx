import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  Image,
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
import {
  consignacionesApi,
  createConsignacionIdempotencyKey,
} from '../api/consignaciones';
import { mediosPagoApi } from '../api/mediosPago';
import { direccionesApi } from '../api/direcciones';
import { userFacingError } from '../api/client';
import {
  ConsignacionArchivoUi,
  ConsignacionDetalleUi,
  ConsignacionEtapaUi,
  mapConsignacionDetalle,
  formatMoney,
} from '../mappers/consignaciones';
import { ConsignacionDevolucionPreviewDto } from '../types/consignacionApi';
import {
  canMedioPagoCoverAmount,
  isMedioPagoVigente,
  MedioPagoDto,
} from '../types/mediosPago';
import { DireccionEnvioDto } from '../types/direcciones';
import {
  formatAddressLabel,
  formatPaymentMethodLabel,
  paymentMethodTypeLabel,
} from '../utils/displayLabels';
import { useNetwork } from '../context/NetworkContext';
import { MobileImage, pickImages } from '../mobile/mediaPicker';
import { ImageUploadPreview } from '../components/ImageUploadPreview';
import { DropdownSelector } from '../components/DropdownSelector';
import { getAuthToken } from '../api/client';
import { resolveApiMediaUrl } from '../utils/apiMedia';

type Props = NativeStackScreenProps<RootStackParamList, 'ConsignacionDetail'>;

export default function ConsignacionDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const { confirmHeavyAction } = useNetwork();
  const [activeTab, setActiveTab] = useState<NavTab>('consignar');
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [documentacionOrigen, setDocumentacionOrigen] =
    useState<MobileImage | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<ConsignacionDetalleUi | null>(null);
  const [returnModal, setReturnModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [modalidadDevolucion, setModalidadDevolucion] = useState<
    'retiro' | 'envio'
  >('retiro');
  const [previewDevolucion, setPreviewDevolucion] =
    useState<ConsignacionDevolucionPreviewDto | null>(null);
  const [previewDevolucionLoading, setPreviewDevolucionLoading] =
    useState(false);
  const [direcciones, setDirecciones] = useState<DireccionEnvioDto[]>([]);
  const [direccionEnvioId, setDireccionEnvioId] = useState<number | null>(null);
  const [mediosPago, setMediosPago] = useState<MedioPagoDto[]>([]);
  const [medioPagoId, setMedioPagoId] = useState<number | null>(null);

  const generatedDocument = useCallback(
    (prefix: string) =>
      detalle?.documentosGenerados.find(file =>
        file.filename.toLowerCase().startsWith(prefix),
      ) ?? null,
    [detalle],
  );
  const liquidacionDocumento = generatedDocument('liquidacion_venta');
  const devolucionDocumento = generatedDocument(
    'comprobante_envio_devolucion',
  );

  const mediosCompatibles = useMemo(() => {
    if (!detalle) return [];
    return mediosPago.filter(
      medio =>
        isMedioPagoVigente(medio) &&
        medio.moneda === detalle.moneda &&
        canMedioPagoCoverAmount(medio, detalle.devolucion?.costo ?? 0),
    );
  }, [detalle, mediosPago]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await consignacionesApi.detalle(Number(id));
      setDetalle(mapConsignacionDetalle(response));
    } catch (err) {
      setDetalle(null);
      setError(readableError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!returnModal || !detalle) return;
    if (modalidadDevolucion === 'envio' && !direccionEnvioId) {
      setPreviewDevolucion(null);
      return;
    }
    let active = true;
    setPreviewDevolucionLoading(true);
    consignacionesApi
      .previewDevolucion(detalle.numericId, {
        modalidad: modalidadDevolucion,
        direccionEnvioId:
          modalidadDevolucion === 'envio'
            ? direccionEnvioId ?? undefined
            : undefined,
      })
      .then(preview => {
        if (active) setPreviewDevolucion(preview);
      })
      .catch(err => {
        if (active) {
          setPreviewDevolucion(null);
          Alert.alert('No pudimos calcular la devolución', readableError(err));
        }
      })
      .finally(() => {
        if (active) setPreviewDevolucionLoading(false);
      });
    return () => {
      active = false;
    };
  }, [returnModal, detalle, modalidadDevolucion, direccionEnvioId]);

  const seleccionarDocumentacion = async () => {
    const [file] = await pickImages({
      selectionLimit: 1,
      quality: 0.9,
      fallbackBaseName: 'documentacion-origen',
    });
    if (file) setDocumentacionOrigen(file);
  };

  const subirDocumentacion = async () => {
    if (!detalle || !documentacionOrigen) return;
    if (!(await confirmHeavyAction())) return;
    setUploadingDoc(true);
    try {
      const updated = await consignacionesApi.subirDocumentacionOrigen(
        detalle.numericId,
        {
          facturaCompra: documentacionOrigen,
          observaciones: 'Documento cargado desde mobile.',
        },
      );
      setDetalle(mapConsignacionDetalle(updated));
      setDocumentacionOrigen(null);
      Alert.alert(
        'Documentación enviada',
        'La solicitud vuelve a revisión manual.',
      );
    } catch (err) {
      Alert.alert('No se pudo subir documentación', readableError(err));
    } finally {
      setUploadingDoc(false);
    }
  };

  const refreshDetalle = async () => {
    const updated = await consignacionesApi.detalle(Number(id));
    setDetalle(mapConsignacionDetalle(updated));
  };

  const descargarArchivo = async (file: ConsignacionArchivoUi) => {
    if (!file.downloadAvailable || !file.downloadUrl) {
      Alert.alert(
        'Archivo no disponible',
        'El documento no está disponible en este momento. Intentá generarlo nuevamente o contactá a soporte.',
      );
      return;
    }
    if (!(await confirmHeavyAction())) return;
    try {
      const downloaded = await consignacionesApi.descargarArchivo(
        file.downloadUrl,
        file.filename,
      );
      Alert.alert(
        downloaded.shared ? 'Documento listo' : 'Documento recibido',
        `${downloaded.filename ?? file.filename} - ${downloaded.sizeBytes} bytes - ${downloaded.contentType}.${
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
          'No pudimos abrir o compartir el documento. Intentá nuevamente.',
        ),
      );
    }
  };

  const abrirDevolucion = async () => {
    setActionLoading(true);
    try {
      const values = await direccionesApi.listar();
      setDirecciones(values);
      setDireccionEnvioId(
        values.find(value => value.principal)?.id ?? values[0]?.id ?? null,
      );
      setModalidadDevolucion('retiro');
      setPreviewDevolucion(null);
      setReturnModal(true);
    } catch (err) {
      Alert.alert('No se pudieron cargar direcciones', readableError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const persistirDevolucion = async () => {
    if (!detalle) return;
    setActionLoading(true);
    try {
      await consignacionesApi.seleccionarDevolucion(detalle.numericId, {
        modalidad: modalidadDevolucion,
        direccionEnvioId:
          modalidadDevolucion === 'envio'
            ? direccionEnvioId ?? undefined
            : undefined,
      });
      await refreshDetalle();
      setReturnModal(false);
      Alert.alert(
        'Devolución registrada',
        modalidadDevolucion === 'envio'
          ? 'Ahora podés pagar el envío de devolución.'
          : 'QuickBid registró el retiro en sucursal.',
      );
    } catch (err) {
      Alert.alert('No se pudo gestionar la devolución', readableError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const gestionarDevolucion = () => {
    if (modalidadDevolucion === 'envio' && !direccionEnvioId) {
      Alert.alert(
        'Dirección requerida',
        'Agregá o seleccioná una dirección guardada para continuar.',
      );
      return;
    }
    if (!previewDevolucion || previewDevolucionLoading) {
      Alert.alert(
        'Costo pendiente',
        'Espera a que calculemos el costo antes de confirmar.',
      );
      return;
    }
    const selected = direcciones.find(value => value.id === direccionEnvioId);
    const costo = formatMoney(
      previewDevolucion.costo,
      previewDevolucion.moneda,
    );
    const total = formatMoney(
      previewDevolucion.totalEstimado,
      previewDevolucion.moneda,
    );
    const resumen =
      modalidadDevolucion === 'envio'
          ? `Modalidad: envío a domicilio\nDirección: ${
            selected
              ? direccionLabel(selected)
              : previewDevolucion.direccionResumen ?? 'dirección seleccionada'
            }\nCosto de devolución: ${costo}\nTotal estimado: ${total}`
          : `Modalidad: retiro en sucursal\nCosto de devolución: ${costo}\nTotal estimado: ${total}`;
    Alert.alert(
      'Confirmar devolución',
        `${resumen}\n\nLuego no podrás cambiar la modalidad de devolución.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: persistirDevolucion },
      ],
    );
  };

  const abrirPagoDevolucion = async () => {
    if (!detalle) return;
    setActionLoading(true);
    try {
      const medios = await mediosPagoApi.listar();
      const compatibles = medios.filter(
        medio => isMedioPagoVigente(medio) && medio.moneda === detalle.moneda,
      );
      setMediosPago(medios);
      setMedioPagoId(
        compatibles.find(medio => medio.principal)?.id ??
          compatibles[0]?.id ??
          null,
      );
      setPaymentModal(true);
    } catch (err) {
      Alert.alert('No se pudieron cargar medios de pago', readableError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const pagarEnvioDevolucion = async () => {
    if (!detalle || !medioPagoId) return;
    setActionLoading(true);
    try {
      const pago = await consignacionesApi.pagarEnvioDevolucion(
        detalle.numericId,
        {
          medioPagoId,
          idempotencyKey: createConsignacionIdempotencyKey('devolucion'),
        },
      );
      await refreshDetalle();
      setPaymentModal(false);
      Alert.alert(
        'Pago procesado',
        `Estado del pago: ${humanize(pago.estado)}.`,
      );
    } catch (err) {
      Alert.alert('No se pudo pagar el envío', readableError(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      {loading ? (
        <Loader fullScreen label="Cargando consignación..." />
      ) : error ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="alert" size={48} color={colors.danger} />}
            title="No pudimos abrir la consignación"
            description={error}
            actionLabel="Reintentar"
            onAction={load}
          />
        </View>
      ) : !detalle ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="inbox" size={48} color={colors.textSubtle} />}
            title="No encontramos la consignación"
            description="La consignación que intentás abrir no existe o no pertenece a tu cuenta."
            actionLabel="Volver"
            onAction={() => navigation.goBack()}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Hero detalle={detalle} />

          <View style={styles.body}>
            <Typography style={styles.codigo}>#CONS-{detalle.id}</Typography>
            <Heading style={styles.nombre}>{detalle.titulo}</Heading>
            <Body muted style={styles.fecha}>
              Consignado el {detalle.createdAtLabel}
            </Body>

            <Card variant="flat" padding="none" style={styles.precioCard}>
              <View style={styles.precioCol}>
                <Typography style={styles.precioLabel}>Valor base</Typography>
                <Typography style={styles.precioValue}>
                  {detalle.valorBase && detalle.moneda
                    ? formatMoney(detalle.valorBase, detalle.moneda)
                    : 'Pendiente'}
                </Typography>
              </View>
              <View style={styles.precioDivider} />
              <View style={styles.precioCol}>
                <Typography style={styles.precioLabel}>
                  Neto estimado
                </Typography>
                <Typography style={styles.precioValueAlt}>
                  {detalle.netoEstimado
                    ? formatMoney(detalle.netoEstimado, detalle.moneda)
                    : 'Pendiente'}
                </Typography>
              </View>
            </Card>

            <InfoCard title="DATOS DEL BIEN">
              <InfoRow label="Segmento" value={detalle.segmento} />
              <InfoRow
                label="Categoría subasta"
                value={detalle.categoriaSubasta}
              />
              <InfoRow
                label="Fecha objeto"
                value={detalle.fechaObjeto ?? 'Sin fecha'}
              />
              <InfoRow
                label="Producto ID"
                value={
                  detalle.productoId
                    ? `#${detalle.productoId}`
                    : 'Aún no materializado'
                }
              />
              <Body style={styles.description}>{detalle.descripcion}</Body>
              {detalle.historia ? (
                <Body style={styles.description}>{detalle.historia}</Body>
              ) : null}
            </InfoCard>

            <View style={styles.section}>
              <Typography style={styles.sectionLabel}>ESTADO ACTUAL</Typography>
              <View style={styles.timelineCard}>
                {detalle.etapas.map((etapa, index) => (
                  <TimelineRow
                    key={etapa.id}
                    etapa={etapa}
                    esUltima={index === detalle.etapas.length - 1}
                  />
                ))}
              </View>
            </View>

            <View style={styles.nextBox}>
              <Icon name="info" size={18} color={colors.info} />
              <Typography style={styles.nextText}>
                {detalle.proximoPaso}
              </Typography>
            </View>

            {detalle.requiereDocumentacionOrigen ||
            detalle.estado === 'documentacion_adicional' ? (
              <View style={styles.docRequestCard}>
                <View style={styles.rechazoHeader}>
                  <Icon name="alert" size={18} color={colors.warning} />
                  <Typography style={styles.rechazoTitulo}>
                    Documentación de origen requerida
                  </Typography>
                </View>
                <Body style={styles.rechazoMotivo}>
                  Adjuntá factura o comprobante como imagen para continuar
                  con la revisión.
                </Body>
                {documentacionOrigen ? (
                  <ImageUploadPreview
                    image={documentacionOrigen}
                    onRemove={() => setDocumentacionOrigen(null)}
                    onReplace={seleccionarDocumentacion}
                  />
                ) : null}
                <Button
                  onPress={
                    documentacionOrigen
                      ? subirDocumentacion
                      : seleccionarDocumentacion
                  }
                  loading={uploadingDoc}
                  leftIcon={
                    <Icon name="upload" size={18} color={colors.textInverse} />
                  }
                >
                  {documentacionOrigen
                    ? 'Enviar documentación'
                    : 'Seleccionar foto de documento'}
                </Button>
              </View>
            ) : null}

            {detalle.motivoRechazo ? (
              <View style={styles.rechazoCard}>
                <View style={styles.rechazoHeader}>
                  <Icon name="alert" size={18} color={colors.danger} />
                  <Typography style={styles.rechazoTitulo}>
                    Motivo informado
                  </Typography>
                </View>
                <Body style={styles.rechazoMotivo}>
                  {detalle.motivoRechazo}
                </Body>
              </View>
            ) : null}

            {detalle.fotos.length > 0 ? (
              <ArchivosSection
                title="FOTOS"
                archivos={detalle.fotos}
                onOpen={descargarArchivo}
              />
            ) : null}

            <ArchivosSection
              title="DOCUMENTOS DE ORIGEN"
              archivos={detalle.documentosOrigen}
              empty="Sin documentos de origen cargados."
              onOpen={descargarArchivo}
            />

            {detalle.acuerdoTexto ||
            detalle.poliza ||
            detalle.liquidacion ||
            [
              'acuerdo_pendiente',
              'acuerdo_aceptado',
              'acuerdo_rechazado',
              'publicada',
              'en_subasta',
              'vendida',
              'comprada_por_empresa',
              'liquidada',
            ].includes(detalle.estado) ? (
              <DocumentActions
                acuerdoDisponible={
                  Boolean(detalle.acuerdoTexto) ||
                  ['acuerdo_pendiente', 'acuerdo_aceptado', 'acuerdo_rechazado'].includes(
                    detalle.estado,
                  )
                }
                polizaDisponible={Boolean(detalle.poliza)}
                liquidacionDisponible={Boolean(
                  liquidacionDocumento?.downloadAvailable,
                )}
                onAcuerdo={() =>
                  navigation.navigate('AcuerdoConsignacion', { id: detalle.id })
                }
                onPoliza={() =>
                  navigation.navigate('PolizaConsignacion', { id: detalle.id })
                }
                onLiquidacion={() =>
                  liquidacionDocumento &&
                  descargarArchivo(liquidacionDocumento)
                }
              />
            ) : null}

            {detalle.devolucion ? (
              <InfoCard title="DEVOLUCIÓN">
                <InfoRow
                  label="Estado"
                  value={detalle.devolucion.estadoLabel}
                />
                <InfoRow
                  label="Modalidad"
                  value={detalle.devolucion.modalidadLabel}
                />
                <InfoRow
                  label="Costo envío"
                  value={detalle.devolucion.costoLabel}
                />
                {detalle.devolucion.direccionResumen ? (
                  <InfoRow
                    label="Dirección"
                    value={detalle.devolucion.direccionResumen}
                  />
                ) : null}
                {detalle.devolucion.modalidad === 'envio' &&
                detalle.devolucion.pagoId &&
                devolucionDocumento?.downloadAvailable ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => descargarArchivo(devolucionDocumento)}
                  >
                    Abrir comprobante de envío
                  </Button>
                ) : detalle.devolucion.modalidad === 'envio' &&
                  detalle.devolucion.pagoId ? (
                  <Typography style={styles.emptyDocs}>
                    Pago registrado. El comprobante todavía no está disponible.
                  </Typography>
                ) : null}
                {detalle.estado === 'devolucion_pendiente' &&
                !detalle.devolucion.modalidad ? (
                  <Button
                    size="sm"
                    onPress={abrirDevolucion}
                    loading={actionLoading}
                  >
                    Gestionar devolución
                  </Button>
                ) : null}
                {detalle.estado === 'devolucion_pendiente' &&
                detalle.devolucion.modalidad === 'envio' &&
                !detalle.devolucion.pagoId ? (
                  <Button
                    size="sm"
                    onPress={abrirPagoDevolucion}
                    loading={actionLoading}
                    leftIcon={
                      <Icon name="lock" size={16} color={colors.textInverse} />
                    }
                  >
                    Pagar envío de devolución
                  </Button>
                ) : null}
              </InfoCard>
            ) : null}

            {detalle.liquidacion ? (
              <InfoCard title="LIQUIDACIÓN">
                <InfoRow
                  label="Venta"
                  value={detalle.liquidacion.montoBrutoLabel}
                />
                <InfoRow
                  label="Comisión"
                  value={detalle.liquidacion.comisionLabel}
                />
                <InfoRow
                  label="Neto a recibir"
                  value={detalle.liquidacion.montoNetoLabel}
                />
                <InfoRow
                  label="Cuenta destino"
                  value={detalle.liquidacion.cuentaDestino}
                />
                <InfoRow
                  label="Estado"
                  value={detalle.liquidacion.estadoLabel}
                />
                <InfoRow
                  label="Fecha"
                  value={detalle.liquidacion.paidAtLabel}
                />
                <InfoRow
                  label="Comprobante"
                  value={detalle.liquidacion.comprobanteLabel}
                />
              </InfoCard>
            ) : ['vendida', 'comprada_por_empresa'].includes(detalle.estado) ? (
              <InfoCard title="LIQUIDACIÓN">
                <Typography style={styles.emptyDocs}>
                  Liquidación pendiente de emisión por QuickBid.
                </Typography>
              </InfoCard>
            ) : null}
          </View>
        </ScrollView>
      )}

      {detalle ? (
        <>
          <ReturnModal
            visible={returnModal}
            modalidad={modalidadDevolucion}
            direcciones={direcciones}
            direccionEnvioId={direccionEnvioId}
            preview={previewDevolucion}
            previewLoading={previewDevolucionLoading}
            loading={actionLoading}
            onModalidad={setModalidadDevolucion}
            onDireccion={setDireccionEnvioId}
            onConfirm={gestionarDevolucion}
            onClose={() => setReturnModal(false)}
            onManage={() => {
              setReturnModal(false);
              navigation.navigate('DireccionesEnvio');
            }}
          />
          <PaymentModal
            visible={paymentModal}
            detalle={detalle}
            medios={mediosCompatibles}
            medioPagoId={medioPagoId}
            loading={actionLoading}
            onSelect={setMedioPagoId}
            onPay={pagarEnvioDevolucion}
            onClose={() => setPaymentModal(false)}
            onManage={() => {
              setPaymentModal(false);
              navigation.navigate('MetodosPago');
            }}
          />
        </>
      ) : null}

      <BottomNavBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

function Hero({ detalle }: { detalle: ConsignacionDetalleUi }) {
  const [imageFailed, setImageFailed] = useState(false);
  const photo = detalle.fotos.find(file => file.downloadAvailable && file.downloadUrl);
  const imageUrl = resolveApiMediaUrl(photo?.downloadUrl);
  const token = getAuthToken();
  const showImage = Boolean(imageUrl) && !imageFailed;
  return (
    <View style={styles.hero}>
      {showImage ? (
        <Image
          source={{
            uri: imageUrl,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }}
          style={styles.heroImage}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Icon name="image" size={80} color={colors.primary} />
      )}
      <View style={styles.heroBadge}>
        <Badge tone={detalle.badgeTone} variant="solid">
          {detalle.estadoLabel.toUpperCase()}
        </Badge>
      </View>
    </View>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.infoCard}>
      <Typography style={styles.sectionLabel}>{title}</Typography>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Typography style={styles.infoLabel}>{label}</Typography>
      <Typography style={styles.infoValue}>{value}</Typography>
    </View>
  );
}

function TimelineRow({
  etapa,
  esUltima,
}: {
  etapa: ConsignacionEtapaUi;
  esUltima: boolean;
}) {
  const visual = ETAPA_VISUAL[etapa.estado];
  return (
    <View style={styles.tlRow}>
      <View style={styles.tlMarker}>
        <View
          style={[
            styles.tlDot,
            { backgroundColor: visual.bg, borderColor: visual.border },
          ]}
        >
          {visual.icon ? (
            <Icon name={visual.icon} size={13} color={visual.iconColor} />
          ) : null}
        </View>
        {!esUltima ? (
          <View
            style={[
              styles.tlLine,
              {
                backgroundColor:
                  etapa.estado === 'completada'
                    ? colors.success
                    : colors.borderMuted,
              },
            ]}
          />
        ) : null}
      </View>
      <View style={styles.tlInfo}>
        <Typography
          style={[
            styles.tlLabel,
            etapa.estado === 'pendiente' ? styles.tlLabelMuted : null,
          ]}
        >
          {etapa.label}
        </Typography>
        <Typography style={[styles.tlEstado, { color: visual.textColor }]}>
          {visual.texto}
        </Typography>
        {etapa.detalle ? (
          <Typography style={styles.tlDetalle}>{etapa.detalle}</Typography>
        ) : null}
      </View>
    </View>
  );
}

function DocumentActions({
  acuerdoDisponible,
  polizaDisponible,
  liquidacionDisponible,
  onAcuerdo,
  onPoliza,
  onLiquidacion,
}: {
  acuerdoDisponible: boolean;
  polizaDisponible: boolean;
  liquidacionDisponible: boolean;
  onAcuerdo: () => void;
  onPoliza: () => void;
  onLiquidacion: () => void;
}) {
  return (
    <View style={styles.documentActionsSection}>
      <Typography style={styles.sectionLabel}>DOCUMENTOS</Typography>
      <View style={styles.documentActionsRow}>
        <DocumentButton
          label="Acuerdo"
          enabled={acuerdoDisponible}
          onPress={onAcuerdo}
          opensDetail
        />
        <DocumentButton
          label="Póliza"
          enabled={polizaDisponible}
          onPress={onPoliza}
          opensDetail
        />
        <DocumentButton
          label="Liquidación"
          enabled={liquidacionDisponible}
          onPress={onLiquidacion}
        />
      </View>
      {!polizaDisponible ? (
        <Typography style={styles.emptyDocs}>
          La póliza aún no fue registrada para esta consignación.
        </Typography>
      ) : null}
    </View>
  );
}

function DocumentButton({
  label,
  enabled,
  onPress,
  opensDetail = false,
}: {
  label: string;
  enabled: boolean;
  onPress: () => void;
  opensDetail?: boolean;
}) {
  return (
    <TouchableOpacity
      disabled={!enabled}
      onPress={onPress}
      style={[
        styles.documentAction,
        enabled ? styles.documentActionEnabled : styles.documentActionDisabled,
      ]}
    >
      <Icon
        name={opensDetail ? 'info' : 'check-doc'}
        size={20}
        color={enabled ? colors.textInverse : colors.textSubtle}
      />
      <Typography
        style={[
          styles.documentActionText,
          enabled ? styles.documentActionTextEnabled : null,
        ]}
      >
        {label}
      </Typography>
      {enabled && opensDetail ? (
        <Typography style={styles.documentActionHint}>Ver detalle</Typography>
      ) : !enabled ? (
        <Typography style={styles.documentActionUnavailable}>
          No disponible
        </Typography>
      ) : null}
    </TouchableOpacity>
  );
}

function ArchivosSection({
  title,
  archivos,
  empty,
  onOpen,
}: {
  title: string;
  archivos: ConsignacionArchivoUi[];
  empty?: string;
  onOpen: (file: ConsignacionArchivoUi) => void;
}) {
  return (
    <InfoCard title={title}>
      {archivos.length === 0 ? (
        <Typography style={styles.emptyDocs}>
          {empty ?? 'Sin archivos.'}
        </Typography>
      ) : null}
      {archivos.map(file => (
        <View key={file.archivoId} style={styles.fileRow}>
          <Icon name="check-doc" size={18} color={colors.primary} />
          <View style={styles.fileInfo}>
            <Typography style={styles.fileName}>{file.filename}</Typography>
            <Typography style={styles.fileMeta}>
              {file.contentType} - {file.sizeLabel} - {file.estadoLabel}
            </Typography>
          </View>
          {file.downloadAvailable ? (
            <Button
              variant="secondary"
              size="sm"
              fullWidth={false}
              onPress={() => onOpen(file)}
            >
              Abrir o compartir
            </Button>
          ) : (
            <Typography style={styles.fileMeta}>No disponible</Typography>
          )}
        </View>
      ))}
    </InfoCard>
  );
}

function ReturnModal({
  visible,
  modalidad,
  direcciones,
  direccionEnvioId,
  preview,
  previewLoading,
  loading,
  onModalidad,
  onDireccion,
  onConfirm,
  onClose,
  onManage,
}: {
  visible: boolean;
  modalidad: 'retiro' | 'envio';
  direcciones: DireccionEnvioDto[];
  direccionEnvioId: number | null;
  preview: ConsignacionDevolucionPreviewDto | null;
  previewLoading: boolean;
  loading: boolean;
  onModalidad: (value: 'retiro' | 'envio') => void;
  onDireccion: (value: number) => void;
  onConfirm: () => void;
  onClose: () => void;
  onManage: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <Typography style={styles.modalEyebrow}>DEVOLUCIÓN</Typography>
          <Heading style={styles.modalTitle}>Gestionar devolución</Heading>
          <Body style={styles.modalText}>
            Elegí cómo querés recuperar el bien.
          </Body>
          <View style={styles.segmented}>
            <SegmentButton
              label="Retiro"
              selected={modalidad === 'retiro'}
              onPress={() => onModalidad('retiro')}
            />
            <SegmentButton
              label="Envío"
              selected={modalidad === 'envio'}
              onPress={() => onModalidad('envio')}
            />
          </View>
          {modalidad === 'envio' ? (
            <View style={styles.formBlock}>
              {direcciones.length === 0 ? (
                <View style={styles.infoSoftBox}>
                  <Icon name="alert" size={18} color={colors.warning} />
                  <Typography style={styles.infoSoftText}>
                    No tenés direcciones guardadas para recibir la devolución.
                  </Typography>
                </View>
              ) : (
                <DropdownSelector
                  testID="return-address-dropdown"
                  options={direcciones.map(direccion => ({
                    id: direccion.id,
                    label: `${direccion.alias}${
                      direccion.principal ? ' - Principal' : ''
                    }`,
                    description: formatAddressLabel(direccion),
                  }))}
                  selectedId={direccionEnvioId}
                  onSelect={value => onDireccion(Number(value))}
                />
              )}
              <Button variant="secondary" size="sm" onPress={onManage}>
                Gestionar direcciones
              </Button>
            </View>
          ) : (
            <View style={styles.infoSoftBox}>
              <Icon name="info" size={18} color={colors.info} />
              <Typography style={styles.infoSoftText}>
                Retiro en sucursal no genera pago de envío.
              </Typography>
            </View>
          )}
          <View style={styles.modalSummary}>
            <InfoRow
              label="Modalidad"
              value={
                modalidad === 'envio'
                  ? 'Envío a domicilio'
                  : 'Retiro en sucursal'
              }
            />
            <InfoRow
              label="Costo"
              value={
                previewLoading
                  ? 'Calculando...'
                  : preview
                  ? formatMoney(preview.costo, preview.moneda)
                  : 'Pendiente'
              }
            />
            <InfoRow
              label="Total"
              value={
                previewLoading
                  ? 'Calculando...'
                  : preview
                  ? formatMoney(preview.totalEstimado, preview.moneda)
                  : 'Pendiente'
              }
            />
          </View>
          <View style={styles.modalActions}>
            <Button
              onPress={onConfirm}
              loading={loading}
              disabled={
                previewLoading ||
                !preview ||
                (modalidad === 'envio' && !direccionEnvioId)
              }
            >
              Confirmar devolución
            </Button>
            <Button variant="ghost" onPress={onClose} disabled={loading}>
              Volver
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PaymentModal({
  visible,
  detalle,
  medios,
  medioPagoId,
  loading,
  onSelect,
  onPay,
  onClose,
  onManage,
}: {
  visible: boolean;
  detalle: ConsignacionDetalleUi;
  medios: MedioPagoDto[];
  medioPagoId: number | null;
  loading: boolean;
  onSelect: (value: number) => void;
  onPay: () => void;
  onClose: () => void;
  onManage: () => void;
}) {
  const devolucion = detalle.devolucion;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <Typography style={styles.modalEyebrow}>
            PAGO DE DEVOLUCIÓN
          </Typography>
          <Heading style={styles.modalTitle}>Envío de devolución</Heading>
          <View style={styles.modalSummary}>
            <InfoRow label="Concepto" value="Envío por devolución" />
            <InfoRow
              label="Monto"
              value={devolucion?.costoLabel ?? 'Sin dato'}
            />
            <InfoRow label="Moneda" value={detalle.moneda} />
          </View>
          {medios.length === 0 ? (
            <View style={styles.infoSoftBox}>
              <Icon name="alert" size={18} color={colors.warning} />
              <Typography style={styles.infoSoftText}>
                No hay medios verificados compatibles para pagar este envío.
              </Typography>
            </View>
          ) : (
            <DropdownSelector
              testID="return-payment-dropdown"
              options={medios.map(medio => ({
                id: medio.id,
                label: formatPaymentMethodLabel(medio),
                description: `${paymentMethodTypeLabel(medio.tipo)} - ${
                  medio.moneda
                } - Verificado`,
              }))}
              selectedId={medioPagoId}
              onSelect={value => onSelect(Number(value))}
            />
          )}
          <View style={styles.modalActions}>
            <Button
              onPress={onPay}
              loading={loading}
              disabled={!medioPagoId}
              leftIcon={
                <Icon name="lock" size={16} color={colors.textInverse} />
              }
            >
              Confirmar y pagar
            </Button>
            {medios.length === 0 ? (
              <Button variant="secondary" onPress={onManage}>
                Agregar medio de pago
              </Button>
            ) : null}
            <Button variant="ghost" onPress={onClose} disabled={loading}>
              Volver
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SegmentButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.segmentButton, selected ? styles.segmentButtonOn : null]}
    >
      <Typography
        style={[styles.segmentLabel, selected ? styles.segmentLabelOn : null]}
      >
        {label}
      </Typography>
    </TouchableOpacity>
  );
}

function readableError(err: unknown) {
  return userFacingError(
    err,
    'QuickBid no está disponible. Probalo de nuevo en unos minutos.',
  );
}

function humanize(value: string) {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w|\s\w/g, match => match.toUpperCase());
}

function direccionLabel(direccion: DireccionEnvioDto) {
  return formatAddressLabel(direccion);
}

const ETAPA_VISUAL: Record<
  ConsignacionEtapaUi['estado'],
  {
    bg: string;
    border: string;
    icon: 'check' | 'x' | null;
    iconColor: string;
    texto: string;
    textColor: string;
  }
> = {
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg },
  errorWrap: { flex: 1, paddingHorizontal: layout.screenPaddingHorizontal },
  hero: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.infoSoft,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
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
  precioDivider: {
    width: 1,
    backgroundColor: colors.borderMuted,
    marginVertical: spacing.sm,
  },
  precioLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  precioValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  precioValueAlt: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  section: { gap: spacing.sm, marginTop: spacing.xs },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.base,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.base,
    justifyContent: 'space-between',
  },
  infoLabel: { flex: 1, fontSize: fontSize.sm, color: colors.textMuted },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textLabel,
    lineHeight: fontSize.sm * 1.45,
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
  tlLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  tlLabelMuted: { color: colors.textMuted },
  tlEstado: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: 1,
  },
  tlDetalle: { fontSize: fontSize.sm, color: colors.danger, marginTop: 2 },
  nextBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.infoSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.info,
  },
  nextText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: fontSize.sm * 1.45,
  },
  docRequestCard: {
    backgroundColor: colors.warningSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: spacing.base,
    gap: spacing.sm,
  },
  rechazoCard: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.base,
    gap: spacing.sm,
  },
  rechazoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rechazoTitulo: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  rechazoMotivo: { fontSize: fontSize.sm, color: colors.text },
  fileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  fileInfo: { flex: 1 },
  fileName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  fileMeta: { fontSize: fontSize.xs, color: colors.textMuted },
  emptyDocs: { fontSize: fontSize.sm, color: colors.textMuted },
  documentActionsSection: { gap: spacing.sm },
  documentActionsRow: { flexDirection: 'row', gap: spacing.sm },
  documentAction: {
    flex: 1,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  documentActionEnabled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  documentActionDisabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderMuted,
  },
  documentActionText: {
    fontSize: fontSize.xs,
    color: colors.textSubtle,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  documentActionTextEnabled: { color: colors.textInverse },
  documentActionHint: { color: colors.textInverse, fontSize: 10 },
  documentActionUnavailable: { color: colors.textSubtle, fontSize: 10 },
  inlineActions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.base,
    maxHeight: '92%',
  },
  modalEyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: letterSpacing.wider,
  },
  modalTitle: { fontSize: fontSize['2xl'] },
  modalText: {
    fontSize: fontSize.sm,
    color: colors.textLabel,
    lineHeight: fontSize.sm * 1.45,
  },
  modalSummary: {
    backgroundColor: colors.infoSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.base,
    gap: spacing.sm,
  },
  modalActions: { gap: spacing.sm },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkLabel: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  segmentButtonOn: { backgroundColor: colors.primary },
  segmentLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  segmentLabelOn: { color: colors.textInverse },
  formBlock: { gap: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSize.base,
    backgroundColor: colors.surface,
  },
  infoSoftBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.infoSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  infoSoftText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: fontSize.sm * 1.45,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoSoft,
  },
  paymentInfo: { flex: 1 },
  paymentTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  paymentMeta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
});
