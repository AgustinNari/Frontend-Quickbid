import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Heading, Body, Typography, Button, Card, Icon, Loader } from '../ui';
import {
  colors,
  spacing,
  radius,
  layout,
  fontSize,
  fontWeight,
  letterSpacing,
} from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { formatPrecio } from '../utils/format';
import { comprasApi, createIdempotencyKey } from '../api/compras';
import { mediosPagoApi } from '../api/mediosPago';
import { direccionesApi } from '../api/direcciones';
import { userFacingError } from '../api/client';
import {
  canMedioPagoCoverAmount,
  getMedioPagoLimitUsage,
  isMedioPagoVigente,
  MedioPagoDto,
} from '../types/mediosPago';
import { DireccionEnvioDto } from '../types/direcciones';
import {
  formatAddressLabel,
  formatPaymentMethodDetail,
  formatPaymentMethodLabel,
} from '../utils/displayLabels';
import {
  CompraEntregaPreviewDto,
  ConfigurarEntregaRequest,
  EntregaTipo,
} from '../types/compraApi';
import {
  CompraDetalleUi,
  mapCompraDetalle,
  mapDocumentoCompra,
  mapPagoCompra,
  totalParaPago,
} from '../mappers/compras';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ResumenPago'>;

export default function ResumenPagoScreen({ navigation, route }: Props) {
  const { compraId, tipo } = route.params;
  const [loading, setLoading] = useState(true);
  const [compra, setCompra] = useState<CompraDetalleUi | null>(null);
  const [medios, setMedios] = useState<MedioPagoDto[]>([]);
  const [direcciones, setDirecciones] = useState<DireccionEnvioDto[]>([]);
  const [direccionId, setDireccionId] = useState<number | null>(null);
  const [medioId, setMedioId] = useState<number | null>(null);
  const [cambiandoMedio, setCambiandoMedio] = useState(false);
  const [configurandoEntrega, setConfigurandoEntrega] = useState(false);
  const [entregaSeleccionada, setEntregaSeleccionada] =
    useState<EntregaTipo | null>(null);
  const [previewEntrega, setPreviewEntrega] =
    useState<CompraEntregaPreviewDto | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshSession } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const id = Number(compraId);
      const [detalle, mediosUsuario, direccionesUsuario] = await Promise.all([
        comprasApi.detalle(id),
        mediosPagoApi.listar(),
        direccionesApi.listar().catch(() => [] as DireccionEnvioDto[]),
      ]);
      const mapped = mapCompraDetalle(detalle);
      const requiredAmount = mapped.entrega ? totalParaPago(mapped, tipo) : 0;
      const compatibles = mediosUsuario.filter(
        medio =>
          isMedioPagoVigente(medio) &&
          medio.moneda === mapped.moneda &&
          canMedioPagoCoverAmount(medio, requiredAmount),
      );
      const principal =
        compatibles.find(medio => medio.principal) ?? compatibles[0] ?? null;
      setCompra(mapped);
      setMedios(compatibles);
      setDirecciones(direccionesUsuario);
      const direccionDefault =
        direccionesUsuario.find(direccion => direccion.principal) ??
        direccionesUsuario[0] ??
        null;
      setDireccionId(current =>
        direccionesUsuario.some(direccion => direccion.id === current)
          ? current
          : direccionDefault?.id ?? null,
      );
      setEntregaSeleccionada(mapped.entrega?.tipo ?? null);
      setPreviewEntrega(null);
      setMedioId(current =>
        compatibles.some(medio => medio.id === current)
          ? current
          : principal?.id ?? null,
      );
    } catch (err) {
      setError(readableError(err));
      setCompra(null);
      setMedios([]);
      setDirecciones([]);
      setDireccionId(null);
      setMedioId(null);
    } finally {
      setLoading(false);
    }
  }, [compraId, tipo]);

  useEffect(() => {
    load();
    return navigation.addListener('focus', load);
  }, [load, navigation]);

  const medioSeleccionado = useMemo(
    () => medios.find(medio => medio.id === medioId) ?? null,
    [medios, medioId],
  );
  const direccionSeleccionada = useMemo(
    () => direcciones.find(direccion => direccion.id === direccionId) ?? null,
    [direcciones, direccionId],
  );
  const total = compra
    ? tipo === 'comisiones' && !compra.entrega && previewEntrega
      ? Number(previewEntrega.totalEstimado)
      : totalParaPago(compra, tipo)
    : 0;
  const costoEnvioActual =
    tipo === 'comisiones' && !compra?.entrega && previewEntrega
      ? Number(previewEntrega.costoEnvio)
      : Number(compra?.entrega?.costoEnvio ?? 0);

  const entregaPayload = useCallback(
    (
      modo: EntregaTipo,
      selectedAddressId = direccionId,
    ): ConfigurarEntregaRequest | null => {
      if (modo === 'retiro') return { tipo: 'retiro' };
      if (!selectedAddressId) return null;
      return { tipo: 'envio', direccionEnvioId: selectedAddressId };
    },
    [direccionId],
  );

  const cotizarEntrega = useCallback(
    async (modo: EntregaTipo, selectedAddressId = direccionId) => {
      if (!compra || compra.entrega) return;
      const payload = entregaPayload(modo, selectedAddressId);
      if (!payload) {
        setPreviewEntrega(null);
        return;
      }
      setPreviewLoading(true);
      try {
        setPreviewEntrega(
          await comprasApi.previewEntrega(compra.numericId, payload),
        );
      } catch (err) {
        setPreviewEntrega(null);
        Alert.alert('No pudimos calcular el envio', readableError(err));
      } finally {
        setPreviewLoading(false);
      }
    },
    [compra, direccionId, entregaPayload],
  );

  const persistirEntrega = async (modo: EntregaTipo) => {
    if (!compra) return;
    const payload = entregaPayload(modo);
    if (!payload) return;
    setConfigurandoEntrega(true);
    try {
      await comprasApi.configurarEntrega(compra.numericId, payload);
      await load();
    } catch (err) {
      Alert.alert('No se pudo configurar la entrega', readableError(err));
    } finally {
      setConfigurandoEntrega(false);
    }
  };

  const seleccionarEntrega = (modo: EntregaTipo) => {
    if (!compra) return;
    if (modo === 'envio' && !direccionSeleccionada) {
      Alert.alert(
        'Direccion requerida',
        'Agrega una direccion de envio antes de elegir envio a domicilio.',
        [
          {
            text: 'Ir a direcciones',
            onPress: () => navigation.navigate('DireccionesEnvio'),
          },
        ],
      );
      return;
    }
    setEntregaSeleccionada(modo);
    cotizarEntrega(modo);
  };

  const confirmarEntrega = () => {
    if (!compra || !entregaSeleccionada) return;
    const direccion = direccionSeleccionada
      ? formatAddressLabel(direccionSeleccionada)
      : null;
    const detalleConfirmacion =
      entregaSeleccionada === 'envio'
        ? `Modalidad: envio a domicilio\nDireccion: ${direccion}\nCosto de envio: ${formatPrecio(
            costoEnvioActual,
            compra.moneda,
          )}\nTotal estimado: ${formatPrecio(total, compra.moneda)}`
        : `Modalidad: retiro en sede\nCosto de envio: ${formatPrecio(
            costoEnvioActual,
            compra.moneda,
          )}\nTotal estimado: ${formatPrecio(total, compra.moneda)}`;

    Alert.alert(
      'Confirmar entrega',
      `${detalleConfirmacion}\n\nLuego no podras cambiar la modalidad de entrega.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => persistirEntrega(entregaSeleccionada),
        },
      ],
    );
  };

  const handleConfirmar = async () => {
    if (!compra || !medioSeleccionado) return;
    if (tipo === 'comisiones' && !compra.entrega) {
      if (!entregaSeleccionada || previewLoading || !previewEntrega) {
        Alert.alert(
          'Elegi entrega',
          'Selecciona envio o retiro para ver el total antes de confirmar.',
        );
        return;
      }
      confirmarEntrega();
      return;
    }
    setProcesando(true);
    try {
      const payload = {
        medioPagoId: medioSeleccionado.id,
        idempotencyKey: createIdempotencyKey(
          tipo === 'multa' ? 'multa' : 'extras',
        ),
      };
      const response =
        tipo === 'multa'
          ? await comprasApi.pagarConMulta(compra.numericId, payload)
          : await comprasApi.pagar(compra.numericId, payload);
      const pago = mapPagoCompra(response);
      if (pago.aprobado) {
        if (tipo === 'multa') await refreshSession();
        const docs = await comprasApi
          .documentos(compra.numericId)
          .catch(() => []);
        const documento = docs.map(mapDocumentoCompra)[0]?.filename;
        navigation.replace('CompraExito', {
          compraId: compra.id,
          tipo,
          total: pago.monto,
          moneda: pago.moneda,
          documento,
        });
      } else {
        Alert.alert(
          'Pago fallido',
          pago.errorLabel ??
            'No pudimos aprobar el pago. Revisa el medio seleccionado o el limite disponible.',
        );
        await load();
        return;
      }
    } catch (err) {
      Alert.alert('No se pudo completar el pago', readableError(err));
    } finally {
      setProcesando(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        <Loader fullScreen label="Preparando el pago..." />
      </SafeAreaView>
    );
  }

  if (error || !compra) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        <View style={styles.errorWrap}>
          <Body muted>{error ?? 'No encontramos la compra a pagar.'}</Body>
          <Button variant="secondary" onPress={load} style={styles.retryButton}>
            Reintentar
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <Heading style={styles.titulo}>Resumen de Pago</Heading>

          <Card variant="flat" padding="none" style={styles.itemCard}>
            <View style={styles.itemRow}>
              <View style={styles.thumb}>
                <Icon
                  name={tipo === 'multa' ? 'alert' : 'bag'}
                  size={32}
                  color={colors.primary}
                />
              </View>
              <View style={styles.itemInfo}>
                <Typography style={styles.itemLote}>
                  {compra.loteLabel.toUpperCase()}
                </Typography>
                <Typography style={styles.itemTitulo} numberOfLines={1}>
                  {compra.title}
                </Typography>
                <Typography style={styles.itemAutor} numberOfLines={1}>
                  {compra.subtitle}
                </Typography>
                <View style={styles.verificadoRow}>
                  <Icon name="check-circle" size={14} color={colors.success} />
                  <Typography style={styles.verificadoText}>
                    Compra autorizada
                  </Typography>
                </View>
              </View>
            </View>
          </Card>

          {tipo === 'comisiones' ? (
            <EntregaPicker
              compra={compra}
              direcciones={direcciones}
              direccionId={direccionId}
              selected={entregaSeleccionada}
              preview={previewEntrega}
              loading={configurandoEntrega || previewLoading}
              onPick={seleccionarEntrega}
              onAddressPick={selectedId => {
                setDireccionId(selectedId);
                setPreviewEntrega(null);
                if (entregaSeleccionada === 'envio') {
                  cotizarEntrega('envio', selectedId);
                }
              }}
              onManage={() => navigation.navigate('DireccionesEnvio')}
            />
          ) : null}

          <View style={styles.section}>
            <Typography style={styles.sectionLabel}>METODO DE PAGO</Typography>
            <View style={styles.medioWrap}>
              <View style={styles.medioRow}>
                <Icon
                  name={
                    medioSeleccionado?.tipo === 'cuenta_bancaria'
                      ? 'bank'
                      : 'card'
                  }
                  size={20}
                  color={colors.textMuted}
                />
                <Typography style={styles.medioValue} numberOfLines={1}>
                  {medioSeleccionado
                    ? formatPaymentMethodLabel(medioSeleccionado)
                    : 'Sin medio verificado compatible'}
                </Typography>
                {medios.length > 1 ? (
                  <TouchableOpacity
                    onPress={() => setCambiandoMedio(v => !v)}
                    hitSlop={hitSlop}
                  >
                    <Typography style={styles.medioCambiar}>
                      {cambiandoMedio ? 'Cerrar' : 'Cambiar'}
                    </Typography>
                  </TouchableOpacity>
                ) : null}
              </View>
              {cambiandoMedio
                ? medios.map(medio => {
                    const selected = medio.id === medioId;
                    return (
                      <TouchableOpacity
                        key={medio.id}
                        activeOpacity={0.7}
                        onPress={() => {
                          setMedioId(medio.id);
                          setCambiandoMedio(false);
                        }}
                        style={[
                          styles.medioOption,
                          selected ? styles.medioOptionSel : null,
                        ]}
                      >
                        <View style={styles.medioOptInfo}>
                          <Typography style={styles.medioOptEtiqueta}>
                            {formatPaymentMethodLabel(medio)}
                          </Typography>
                          <Typography style={styles.medioOptTipo}>
                            {formatPaymentMethodDetail(medio)}
                          </Typography>
                          <PaymentLimit medio={medio} moneda={compra.moneda} />
                        </View>
                        <View
                          style={[
                            styles.radio,
                            selected ? styles.radioSel : null,
                          ]}
                        >
                          {selected ? <View style={styles.radioInner} /> : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                : null}
              {medios.length === 0 ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => navigation.navigate('MetodosPago')}
                >
                  Agregar medio compatible
                </Button>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <Typography style={styles.sectionLabel}>
              RESUMEN ECONOMICO
            </Typography>
            <View style={styles.econCard}>
              {tipo === 'multa' && compra.multa ? (
                <>
                  <Row
                    label="Oferta ganadora"
                    value={formatPrecio(
                      compra.montoAdjudicacion,
                      compra.moneda,
                    )}
                  />
                  <Row
                    label="Multa"
                    value={formatPrecio(compra.multa.monto, compra.moneda)}
                    danger
                  />
                </>
              ) : (
                <>
                  <Row
                    label="Comision comprador"
                    value={formatPrecio(
                      compra.comisionComprador,
                      compra.moneda,
                    )}
                  />
                  <Row
                    label="Envio"
                    value={formatPrecio(costoEnvioActual, compra.moneda)}
                  />
                  {!compra.entrega && !previewEntrega ? (
                    <Typography style={styles.helpText}>
                      Elegi envio o retiro para ver el total antes de confirmar.
                    </Typography>
                  ) : null}
                </>
              )}
              <View style={styles.econDivider} />
              <View style={styles.totalRow}>
                <View style={styles.totalCopy}>
                  <Typography style={styles.totalLabel}>
                    Total a pagar
                  </Typography>
                  <Typography style={styles.totalNota}>
                    Segun el estado actual de la compra
                  </Typography>
                </View>
                <Typography style={styles.totalValue}>
                  {formatPrecio(total, compra.moneda)}
                </Typography>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          onPress={handleConfirmar}
          loading={procesando}
          disabled={
            !medioSeleccionado ||
            (tipo === 'comisiones' &&
              !compra.entrega &&
              (!entregaSeleccionada || !previewEntrega || previewLoading))
          }
          leftIcon={<Icon name="lock" color={colors.textInverse} size={16} />}
        >
          {procesando
            ? 'Procesando...'
            : tipo === 'comisiones' && !compra.entrega
            ? 'Confirmar entrega'
            : 'Confirmar y pagar ahora'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

function EntregaPicker({
  compra,
  direcciones,
  direccionId,
  selected,
  preview,
  loading,
  onPick,
  onAddressPick,
  onManage,
}: {
  compra: CompraDetalleUi;
  direcciones: DireccionEnvioDto[];
  direccionId: number | null;
  selected: EntregaTipo | null;
  preview: CompraEntregaPreviewDto | null;
  loading: boolean;
  onPick: (modo: EntregaTipo) => void;
  onAddressPick: (id: number) => void;
  onManage: () => void;
}) {
  return (
    <View style={styles.section}>
      <Typography style={styles.sectionLabel}>ENTREGA</Typography>
      <View style={styles.entregaBox}>
        <Typography style={styles.entregaTitle}>
          {compra.entregaLabel}
        </Typography>
        <Typography style={styles.helpText}>
          {compra.entregaDescription}
        </Typography>
        {compra.entrega ? (
          <Typography style={styles.helpText}>
            {compra.entrega.tipo === 'envio'
              ? compra.direccionSnapshotLabel ?? 'Direccion de envio confirmada'
              : 'Retiro sin direccion de envio'}
          </Typography>
        ) : (
          <View style={styles.entregaActions}>
            <Button
              variant={selected === 'retiro' ? 'primary' : 'secondary'}
              size="sm"
              loading={loading && selected === 'retiro'}
              onPress={() => onPick('retiro')}
              fullWidth={false}
            >
              {selected === 'retiro' ? 'Retiro seleccionado' : 'Retiro en sede'}
            </Button>
            <Button
              variant={selected === 'envio' ? 'primary' : 'secondary'}
              size="sm"
              loading={loading && selected === 'envio'}
              onPress={() => onPick('envio')}
              fullWidth={false}
            >
              {selected === 'envio' ? 'Envio seleccionado' : 'Enviar'}
            </Button>
          </View>
        )}
        {!compra.entrega && selected ? (
          <Typography style={styles.helpText}>
            Costo de envio:{' '}
            {preview
              ? formatPrecio(preview.costoEnvio, preview.moneda)
              : 'Calculando...'}
          </Typography>
        ) : null}
        {!compra.entrega && selected === 'envio' && direcciones.length > 0 ? (
          <View style={styles.addressList}>
            <Typography style={styles.addressPrompt}>
              Elegi la direccion de entrega
            </Typography>
            {direcciones.map(direccion => {
              const isSelected = direccion.id === direccionId;
              return (
                <TouchableOpacity
                  key={direccion.id}
                  activeOpacity={0.75}
                  onPress={() => onAddressPick(direccion.id)}
                  style={[
                    styles.addressOption,
                    isSelected ? styles.addressOptionSelected : null,
                  ]}
                >
                  <View style={styles.addressInfo}>
                    <View style={styles.addressTitleRow}>
                      <Typography style={styles.addressTitle}>
                        {direccion.alias}
                      </Typography>
                      {direccion.principal ? (
                        <Typography style={styles.principalBadge}>
                          PRINCIPAL
                        </Typography>
                      ) : null}
                    </View>
                    <Typography style={styles.direccionText}>
                      {formatAddressLabel(direccion)}
                    </Typography>
                  </View>
                  <View style={[styles.radio, isSelected && styles.radioSel]}>
                    {isSelected ? <View style={styles.radioInner} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
            <Button variant="secondary" size="sm" onPress={onManage}>
              Gestionar direcciones
            </Button>
          </View>
        ) : !compra.entrega && selected === 'envio' ? (
          <Button variant="secondary" size="sm" onPress={onManage}>
            Agregar direccion
          </Button>
        ) : null}
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Typography style={styles.rowLabel}>{label}</Typography>
      <Typography
        style={[styles.rowValue, danger ? styles.rowValueDanger : null]}
      >
        {value}
      </Typography>
    </View>
  );
}

function PaymentLimit({
  medio,
  moneda,
}: {
  medio: MedioPagoDto;
  moneda: 'ARS' | 'USD';
}) {
  const usage = getMedioPagoLimitUsage(medio);
  return (
    <Typography style={styles.paymentLimit}>
      {usage
        ? `Disponible: ${formatPrecio(usage.available, moneda)}`
        : 'Limite no disponible'}
    </Typography>
  );
}

function readableError(err: unknown) {
  return userFacingError(
    err,
    'QuickBid no esta disponible. Probalo de nuevo en unos minutos.',
  );
}

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing['2xl'] },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
    gap: spacing.base,
  },
  retryButton: { marginTop: spacing.sm },
  body: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.base,
    gap: spacing.lg,
  },
  titulo: { fontSize: fontSize['2xl'] },
  itemCard: {},
  itemRow: { flexDirection: 'row', gap: spacing.base, padding: spacing.base },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.infoSoft,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemLote: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  itemTitulo: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  itemAutor: { fontSize: fontSize.sm, color: colors.textMuted },
  verificadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  verificadoText: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: fontWeight.semibold,
  },
  section: { gap: spacing.sm },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  entregaBox: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  entregaTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  entregaActions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  direccionText: { fontSize: fontSize.sm, color: colors.textMuted },
  addressList: { gap: spacing.sm },
  addressPrompt: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radius.md,
  },
  addressOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoSoft,
  },
  addressInfo: { flex: 1 },
  addressTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  addressTitle: { fontWeight: fontWeight.semibold, color: colors.text },
  principalBadge: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  helpText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: fontSize.sm * 1.45,
  },
  medioWrap: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  medioRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  medioValue: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  medioCambiar: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  medioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  medioOptionSel: {
    borderColor: colors.primary,
    backgroundColor: colors.infoSoft,
  },
  medioOptInfo: { flex: 1 },
  medioOptEtiqueta: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  medioOptTipo: { fontSize: fontSize.sm, color: colors.textMuted },
  paymentLimit: { fontSize: fontSize.xs, color: colors.textMuted },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSel: { borderColor: colors.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  econCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.base,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.base,
  },
  rowLabel: { flex: 1, fontSize: fontSize.base, color: colors.textLabel },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: fontSize.base,
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  rowValueDanger: { color: colors.danger },
  econDivider: {
    height: 1,
    backgroundColor: colors.borderMuted,
    marginVertical: spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.base,
  },
  totalCopy: { flex: 1 },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  totalNota: { fontSize: fontSize.xs, color: colors.textMuted },
  totalValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.base,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
});
