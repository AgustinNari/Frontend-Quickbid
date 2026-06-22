import React, { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { consignacionesApi } from '../api/consignaciones';
import { userFacingError } from '../api/client';
import {
  ConsignacionArchivoUi,
  ConsignacionDetalleUi,
  formatMoney,
  mapConsignacionDetalle,
} from '../mappers/consignaciones';
import { useNetwork } from '../context/NetworkContext';
import { ScreenHeader } from '../components/ScreenHeader';
import BottomNavBar, { BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { Badge, Body, Button, Card, EmptyState, Heading, Icon, Loader, Typography } from '../ui';
import { colors, fontSize, fontWeight, layout, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AcuerdoConsignacion'>;

export default function AcuerdoConsignacionScreen({ navigation, route }: Props) {
  const [detalle, setDetalle] = useState<ConsignacionDetalleUi | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [read, setRead] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { confirmHeavyAction } = useNetwork();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDetalle(mapConsignacionDetalle(await consignacionesApi.detalle(Number(route.params.id))));
    } catch (loadError) {
      setError(userFacingError(loadError, 'No pudimos cargar el acuerdo.'));
    } finally {
      setLoading(false);
    }
  }, [route.params.id]);

  useEffect(() => { load(); }, [load]);

  const document = detalle?.documentosGenerados.find(file =>
    file.filename.toLowerCase().startsWith('acuerdo_consignacion'),
  );
  const isPending = detalle?.estado === 'acuerdo_pendiente';

  const openDocument = async (file: ConsignacionArchivoUi) => {
    if (!file.downloadUrl || !file.downloadAvailable) return;
    if (!(await confirmHeavyAction())) return;
    try {
      await consignacionesApi.descargarArchivo(file.downloadUrl, file.filename);
    } catch (downloadError) {
      Alert.alert('Documento no disponible', userFacingError(downloadError, 'No pudimos abrir o compartir el acuerdo.'));
    }
  };

  const accept = async () => {
    if (!detalle || !read || !acceptedTerms) return;
    setActing(true);
    try {
      setDetalle(mapConsignacionDetalle(await consignacionesApi.aceptarAcuerdo(detalle.numericId, {
        leyoContrato: true,
        aceptaClausulasPlazos: true,
      })));
      Alert.alert('Acuerdo aceptado', 'QuickBid registro tu aceptacion.');
    } catch (actionError) {
      Alert.alert('No se pudo aceptar', userFacingError(actionError, 'Intenta nuevamente.'));
    } finally { setActing(false); }
  };

  const reject = () => {
    if (!detalle) return;
    Alert.alert('Rechazar acuerdo', 'El rechazo puede iniciar una devolucion del bien.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Rechazar', style: 'destructive', onPress: async () => {
        setActing(true);
        try {
          setDetalle(mapConsignacionDetalle(await consignacionesApi.rechazarAcuerdo(detalle.numericId)));
        } catch (actionError) {
          Alert.alert('No se pudo rechazar', userFacingError(actionError, 'Intenta nuevamente.'));
        } finally { setActing(false); }
      } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />
      {loading ? <Loader fullScreen label="Cargando acuerdo..." /> : error || !detalle ? (
        <View style={styles.emptyWrap}><EmptyState icon={<Icon name="alert" size={46} color={colors.textSubtle} />} title="No pudimos abrir el acuerdo" description={error ?? 'La consignacion no esta disponible.'} actionLabel="Reintentar" onAction={load} /></View>
      ) : !detalle.acuerdoTexto && !['acuerdo_pendiente', 'acuerdo_aceptado', 'acuerdo_rechazado'].includes(detalle.estado) ? (
        <View style={styles.emptyWrap}><EmptyState icon={<Icon name="check-doc" size={46} color={colors.textSubtle} />} title="Acuerdo aun no disponible" description="El acuerdo aparecera cuando finalice la evaluacion del bien." actionLabel="Volver al detalle" onAction={() => navigation.goBack()} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.headingBlock}>
            <Typography style={styles.eyebrow}>CONTRATO DE CONSIGNACION</Typography>
            <Heading>Acuerdo de consignacion</Heading>
            <Badge tone={isPending ? 'warning' : detalle.estado === 'acuerdo_rechazado' ? 'danger' : 'success'} variant="soft">{detalle.estadoLabel.toUpperCase()}</Badge>
          </View>

          <Card variant="flat" style={styles.assetCard}>
            <View style={styles.assetHero}>
              <Icon name={detalle.fotos.length > 0 ? 'image' : 'bag'} size={38} color={colors.primary} />
              <View style={styles.assetCopy}>
                <Typography style={styles.assetRef}>REFERENCIA #CONS-{detalle.id}</Typography>
                <Heading style={styles.assetTitle}>{detalle.titulo}</Heading>
                <Body muted>{detalle.fotos.length > 0 ? 'Foto del bien registrada' : 'Sin foto disponible'}</Body>
              </View>
            </View>
            <DataRow
              label="Acuerdo propuesto"
              value={detalle.acuerdoEnviadoAtLabel ?? 'Pendiente de registro'}
            />
            {detalle.acuerdoAceptadoAtLabel ? (
              <DataRow label="Acuerdo aceptado" value={detalle.acuerdoAceptadoAtLabel} />
            ) : null}
            <DataRow label="Valor base" value={detalle.valorBase ? formatMoney(detalle.valorBase, detalle.moneda) : 'No informado'} emphasized />
            <DataRow label="Comision comprador" value={detalle.comisionCompradorPct != null ? `${detalle.comisionCompradorPct}%` : 'Pendiente de definicion'} />
            <DataRow label="Comision vendedor" value={detalle.comisionVendedorPct != null ? `${detalle.comisionVendedorPct}%` : 'No informada'} />
            {detalle.subastaFechaHoraLabel ? (
              <DataRow label="Fecha de subasta" value={detalle.subastaFechaHoraLabel} />
            ) : null}
          </Card>

          <Card variant="flat" style={styles.legalCard}>
            <Typography style={styles.sectionTitle}>Resumen y condiciones</Typography>
            <Body style={styles.legalText}>{detalle.acuerdoTexto ?? 'El texto completo del acuerdo aun no fue informado.'}</Body>
            <Body muted style={styles.condition}>La categoria comercial y las condiciones finales son definidas por QuickBid.</Body>
            <Body muted style={styles.condition}>La aceptacion registra conformidad con comisiones y plazos informados.</Body>
          </Card>

          {isPending ? (
            <Card variant="flat" style={styles.actionCard}>
              <CheckRow checked={read} label="Lei el acuerdo completo" onPress={() => setRead(value => !value)} />
              <CheckRow checked={acceptedTerms} label="Acepto clausulas, comisiones y plazos" onPress={() => setAcceptedTerms(value => !value)} />
              <Button onPress={accept} disabled={!read || !acceptedTerms} loading={acting}>Aceptar acuerdo</Button>
              <Button variant="danger" onPress={reject} loading={acting}>Rechazar acuerdo</Button>
            </Card>
          ) : null}

          {document?.downloadAvailable ? (
            <Button onPress={() => openDocument(document)} leftIcon={<Icon name="check-doc" size={18} color={colors.textInverse} />}>Abrir / compartir acuerdo</Button>
          ) : (
            <View style={styles.notice}><Icon name="info" size={18} color={colors.info} /><Body style={styles.noticeText}>El estado y las condiciones estan visibles. El documento PDF aun no esta disponible.</Body></View>
          )}
        </ScrollView>
      )}
      <BottomNavBar activeTab="consignar" navigation={navigation} />
    </SafeAreaView>
  );
}

function CheckRow({ checked, label, onPress }: { checked: boolean; label: string; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} style={styles.checkRow}><View style={[styles.check, checked ? styles.checkActive : null]}>{checked ? <Icon name="check" size={14} color={colors.textInverse} /> : null}</View><Body style={styles.checkText}>{label}</Body></TouchableOpacity>;
}

function DataRow({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return <View style={styles.dataRow}><Typography style={styles.dataLabel}>{label}</Typography><Typography style={[styles.dataValue, emphasized ? styles.dataValueEmphasis : null]}>{value}</Typography></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  emptyWrap: { flex: 1, paddingHorizontal: layout.screenPaddingHorizontal },
  scroll: { padding: layout.screenPaddingHorizontal, paddingBottom: BOTTOM_NAV_HEIGHT + spacing.xl, gap: spacing.base },
  headingBlock: { gap: spacing.xs },
  eyebrow: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  assetCard: { gap: 0 },
  assetHero: { flexDirection: 'row', alignItems: 'center', gap: spacing.base, paddingBottom: spacing.base },
  assetCopy: { flex: 1, gap: 2 },
  assetRef: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  assetTitle: { fontSize: fontSize.lg },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.base, paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderMuted },
  dataLabel: { flex: 1, color: colors.textMuted, fontSize: fontSize.sm },
  dataValue: { flex: 1.3, textAlign: 'right', color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  dataValueEmphasis: { color: colors.primary, fontSize: fontSize.md },
  legalCard: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontWeight: fontWeight.bold },
  legalText: { color: colors.textLabel, lineHeight: fontSize.base * 1.5 },
  condition: { fontSize: fontSize.sm, lineHeight: fontSize.sm * 1.5 },
  actionCard: { gap: spacing.sm },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  check: { width: 22, height: 22, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkText: { flex: 1, fontSize: fontSize.sm },
  notice: { flexDirection: 'row', gap: spacing.sm, padding: spacing.base, borderRadius: radius.md, backgroundColor: colors.infoSoft },
  noticeText: { flex: 1, fontSize: fontSize.sm },
});
