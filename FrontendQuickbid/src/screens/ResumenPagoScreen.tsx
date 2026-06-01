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
import { ScreenHeader } from '../components/ScreenHeader';
import { SEGMENTO_THEME } from '../components/SubastaCard';
import { formatPrecio } from '../utils/format';
import { CompraDetalle } from '../types/compra';
import { MedioPago, MEDIO_PAGO_TIPO_LABEL } from '../types/medioPago';
import {
  getMockCompra,
  getTotalPago,
  pagar,
  pagarConMulta,
} from '../mocks/compras';
import { getMediosPagoUtilizables } from '../mocks/mediosPago';

type Props = NativeStackScreenProps<RootStackParamList, 'ResumenPago'>;

/**
 * Resumen de Pago / checkout (`POST /api/compras/{id}/pagar` o `pagar-con-multa`).
 *
 * Replica los frames "Resumen Compra" y "Resumen de Pago con Multa" de image4.
 * Unifica los dos checkouts segun `tipo`:
 *  - `multa`      -> oferta ganadora + multa (10%).
 *  - `comisiones` -> comision + envio.
 *
 * Al confirmar paga via el mock y navega a la pantalla de exito con replace
 * (para que el back vuelva al detalle/listado, no al checkout).
 */
export default function ResumenPagoScreen({ navigation, route }: Props) {
  const { compraId, tipo } = route.params;
  const [loading, setLoading] = useState(true);
  const [compra, setCompra] = useState<CompraDetalle | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [medioId, setMedioId] = useState<string | null>(null);
  const [cambiando, setCambiando] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const c = getMockCompra(compraId);
      setCompra(c);
      if (c) {
        const medios = getMediosPagoUtilizables(c.moneda);
        const principal = medios.find((m) => m.principal) ?? medios[0];
        setMedioId(principal ? principal.id : null);
      }
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [compraId]);

  const medios = useMemo(
    () => (compra ? getMediosPagoUtilizables(compra.moneda) : []),
    [compra],
  );
  const medioSeleccionado = medios.find((m) => m.id === medioId) ?? null;
  const total = compra ? getTotalPago(compra, tipo) : 0;

  const handleConfirmar = () => {
    if (!compra || !medioSeleccionado) return;
    setProcesando(true);
    setTimeout(() => {
      const resultado =
        tipo === 'multa'
          ? pagarConMulta(compra.id, medioSeleccionado.id)
          : pagar(compra.id, medioSeleccionado.id);
      setProcesando(false);
      if (resultado.ok) {
        navigation.replace('CompraExito', {
          compraId: compra.id,
          tipo,
          total,
          moneda: compra.moneda,
          documento: resultado.documento,
        });
      } else {
        Alert.alert('No se pudo completar el pago', resultado.error.mensaje);
      }
    }, 1600);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        <Loader fullScreen label="Preparando el pago..." />
      </SafeAreaView>
    );
  }

  if (!compra) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        <View style={styles.errorWrap}>
          <Body muted>No encontramos la compra a pagar.</Body>
        </View>
      </SafeAreaView>
    );
  }

  const theme = SEGMENTO_THEME[compra.item.segmento];
  const m = compra.moneda;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <Heading style={styles.titulo}>Resumen de Pago</Heading>

          {/* Item */}
          <Card variant="flat" padding="none" style={styles.itemCard}>
            <View style={styles.itemRow}>
              <View style={[styles.thumb, { backgroundColor: theme.bg }]}>
                <Icon name={theme.icon} size={32} color={theme.fg} />
              </View>
              <View style={styles.itemInfo}>
                <Typography style={styles.itemLote}>LOTE {compra.item.lote}</Typography>
                <Typography style={styles.itemTitulo} numberOfLines={1}>
                  {compra.item.titulo}
                </Typography>
                {compra.item.autor ? (
                  <Typography style={styles.itemAutor} numberOfLines={1}>
                    {compra.item.autor}
                  </Typography>
                ) : null}
                <View style={styles.verificadoRow}>
                  <Icon name="check-circle" size={14} color={colors.success} />
                  <Typography style={styles.verificadoText}>
                    Autenticidad verificada
                  </Typography>
                </View>
              </View>
            </View>
          </Card>

          {/* Metodo de pago */}
          <View style={styles.section}>
            <Typography style={styles.sectionLabel}>MÉTODO DE PAGO</Typography>
            <View style={styles.medioWrap}>
              <View style={styles.medioRow}>
                <Icon
                  name={medioSeleccionado?.tipo === 'cuenta_bancaria' ? 'bank' : 'card'}
                  size={20}
                  color={colors.textMuted}
                />
                <Typography style={styles.medioValue} numberOfLines={1}>
                  {medioSeleccionado
                    ? `${medioSeleccionado.etiqueta}${
                        medioSeleccionado.ultimos4 ? ` ··· ${medioSeleccionado.ultimos4}` : ''
                      }`
                    : 'Sin medio compatible'}
                </Typography>
                {medios.length > 1 ? (
                  <TouchableOpacity onPress={() => setCambiando((v) => !v)} hitSlop={hitSlop}>
                    <Typography style={styles.medioCambiar}>
                      {cambiando ? 'Cerrar' : 'Cambiar'}
                    </Typography>
                  </TouchableOpacity>
                ) : null}
              </View>
              {cambiando
                ? medios.map((mp) => {
                    const selected = mp.id === medioId;
                    return (
                      <TouchableOpacity
                        key={mp.id}
                        activeOpacity={0.7}
                        onPress={() => {
                          setMedioId(mp.id);
                          setCambiando(false);
                        }}
                        style={[styles.medioOption, selected ? styles.medioOptionSel : null]}
                      >
                        <View style={styles.medioOptInfo}>
                          <Typography style={styles.medioOptEtiqueta}>{mp.etiqueta}</Typography>
                          <Typography style={styles.medioOptTipo}>
                            {MEDIO_PAGO_TIPO_LABEL[mp.tipo]}
                            {mp.ultimos4 ? ` ··· ${mp.ultimos4}` : ''} · {mp.moneda}
                          </Typography>
                        </View>
                        <View style={[styles.radio, selected ? styles.radioSel : null]}>
                          {selected ? <View style={styles.radioInner} /> : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                : null}
            </View>
          </View>

          {/* Resumen economico */}
          <View style={styles.section}>
            <Typography style={styles.sectionLabel}>RESUMEN ECONÓMICO</Typography>
            <View style={styles.econCard}>
              {tipo === 'multa' && compra.multa ? (
                <>
                  <Row label="Oferta ganadora" value={formatPrecio(compra.montoAdjudicado, m)} />
                  <Row
                    label={`Multa (${compra.multa.porcentaje}%)`}
                    value={formatPrecio(compra.multa.monto, m)}
                    danger
                  />
                </>
              ) : (
                <>
                  <Row label="Comisión" value={formatPrecio(compra.comision ?? 0, m)} />
                  <Row label="Envío" value={formatPrecio(compra.envio ?? 0, m)} />
                </>
              )}
              <View style={styles.econDivider} />
              <View style={styles.totalRow}>
                <View>
                  <Typography style={styles.totalLabel}>Total a pagar</Typography>
                  <Typography style={styles.totalNota}>Impuestos incluidos</Typography>
                </View>
                <Typography style={styles.totalValue}>{formatPrecio(total, m)}</Typography>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          onPress={handleConfirmar}
          loading={procesando}
          disabled={!medioSeleccionado}
          leftIcon={<Icon name="lock" color={colors.textInverse} size={16} />}
        >
          {procesando ? 'Procesando...' : 'Confirmar y Pagar Ahora'}
        </Button>
      </View>
    </SafeAreaView>
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
      <Typography style={[styles.rowValue, danger ? styles.rowValueDanger : null]}>
        {value}
      </Typography>
    </View>
  );
}

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing['2xl'] },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  },
  itemInfo: { flex: 1, gap: 2 },
  itemLote: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  itemTitulo: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  itemAutor: { fontSize: fontSize.sm, color: colors.textMuted },
  verificadoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  verificadoText: { fontSize: fontSize.xs, color: colors.success, fontWeight: fontWeight.semibold },
  section: { gap: spacing.sm },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  medioWrap: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  medioRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  medioValue: { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  medioCambiar: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.primary },
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
  medioOptionSel: { borderColor: colors.primary, backgroundColor: colors.infoSoft },
  medioOptInfo: { flex: 1 },
  medioOptEtiqueta: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  medioOptTipo: { fontSize: fontSize.sm, color: colors.textMuted },
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
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  econCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.base,
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontSize: fontSize.base, color: colors.textLabel },
  rowValue: { fontSize: fontSize.base, color: colors.text, fontWeight: fontWeight.semibold },
  rowValueDanger: { color: colors.danger },
  econDivider: { height: 1, backgroundColor: colors.borderMuted, marginVertical: spacing.xs },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  totalNota: { fontSize: fontSize.xs, color: colors.textMuted },
  totalValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.primary },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.base,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
});
