import React, { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
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

type Props = NativeStackScreenProps<RootStackParamList, 'PolizaConsignacion'>;

export default function PolizaConsignacionScreen({ navigation, route }: Props) {
  const [detalle, setDetalle] = useState<ConsignacionDetalleUi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { confirmHeavyAction } = useNetwork();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDetalle(
        mapConsignacionDetalle(
          await consignacionesApi.detalle(Number(route.params.id)),
        ),
      );
    } catch (loadError) {
      setError(userFacingError(loadError, 'No pudimos cargar la poliza.'));
    } finally {
      setLoading(false);
    }
  }, [route.params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const document = detalle?.documentosGenerados.find(file =>
    file.filename.toLowerCase().startsWith('poliza'),
  );

  const openDocument = async (file: ConsignacionArchivoUi) => {
    if (!file.downloadUrl || !file.downloadAvailable) return;
    if (!(await confirmHeavyAction())) return;
    try {
      await consignacionesApi.descargarArchivo(file.downloadUrl, file.filename);
    } catch (downloadError) {
      Alert.alert(
        'Documento no disponible',
        userFacingError(downloadError, 'No pudimos abrir o compartir la poliza.'),
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />
      {loading ? (
        <Loader fullScreen label="Cargando poliza..." />
      ) : error || !detalle ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={<Icon name="alert" size={46} color={colors.textSubtle} />}
            title="No pudimos abrir la poliza"
            description={error ?? 'La consignacion no esta disponible.'}
            actionLabel="Reintentar"
            onAction={load}
          />
        </View>
      ) : !detalle.poliza ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={<Icon name="check-doc" size={46} color={colors.textSubtle} />}
            title="Poliza aun no registrada"
            description="Cuando QuickBid asigne una poliza al bien, sus datos apareceran en esta pantalla."
            actionLabel="Volver al detalle"
            onAction={() => navigation.goBack()}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.titleRow}>
            <View style={styles.heroIcon}>
              <Icon name="check-doc" size={34} color={colors.primary} />
            </View>
            <View style={styles.titleCopy}>
              <Typography style={styles.eyebrow}>PROTECCION DEL BIEN</Typography>
              <Heading>Poliza de consignacion</Heading>
              <Badge tone="success" variant="soft">POLIZA REGISTRADA</Badge>
            </View>
          </View>

          <Card variant="flat" style={styles.assetCard}>
            <Typography style={styles.assetRef}>#CONS-{detalle.id}</Typography>
            <Heading style={styles.assetTitle}>{detalle.titulo}</Heading>
            <Body muted>{detalle.descripcion}</Body>
          </Card>

          <Card variant="flat" style={styles.dataCard}>
            <DataRow label="Numero de poliza" value={detalle.poliza.numero || 'No informado'} />
            <DataRow label="Aseguradora" value={detalle.poliza.compania || 'No informada'} />
            <DataRow
              label="Importe asegurado"
              value={formatMoney(detalle.poliza.importe, detalle.moneda)}
              emphasized
            />
            <DataRow
              label="Ubicacion actual"
              value={detalle.poliza.ubicacionFisica ?? detalle.ubicacionFisica ?? 'Pendiente de registro'}
            />
            <DataRow
              label="Tipo"
              value={detalle.poliza.combinada ? 'Poliza combinada' : 'Poliza individual'}
            />
          </Card>

          {document?.downloadAvailable ? (
            <Button
              onPress={() => openDocument(document)}
              leftIcon={<Icon name="check-doc" size={18} color={colors.textInverse} />}
            >
              Abrir / compartir poliza
            </Button>
          ) : (
            <View style={styles.notice}>
              <Icon name="info" size={18} color={colors.info} />
              <Body style={styles.noticeText}>
                Los datos de la poliza estan registrados. El documento PDF aun no esta disponible.
              </Body>
            </View>
          )}
        </ScrollView>
      )}
      <BottomNavBar activeTab="consignar" navigation={navigation} />
    </SafeAreaView>
  );
}

function DataRow({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <View style={styles.dataRow}>
      <Typography style={styles.dataLabel}>{label}</Typography>
      <Typography style={[styles.dataValue, emphasized ? styles.dataValueEmphasis : null]}>{value}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  emptyWrap: { flex: 1, paddingHorizontal: layout.screenPaddingHorizontal },
  scroll: { padding: layout.screenPaddingHorizontal, paddingBottom: BOTTOM_NAV_HEIGHT + spacing.xl, gap: spacing.base },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.base },
  heroIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.infoSoft },
  titleCopy: { flex: 1, gap: spacing.xs },
  eyebrow: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  assetCard: { gap: spacing.xs },
  assetRef: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  assetTitle: { fontSize: fontSize.xl },
  dataCard: { gap: 0 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.base, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderMuted },
  dataLabel: { flex: 1, color: colors.textMuted, fontSize: fontSize.sm },
  dataValue: { flex: 1.35, color: colors.text, textAlign: 'right', fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  dataValueEmphasis: { color: colors.primary, fontSize: fontSize.md },
  notice: { flexDirection: 'row', gap: spacing.sm, padding: spacing.base, borderRadius: radius.md, backgroundColor: colors.infoSoft },
  noticeText: { flex: 1, fontSize: fontSize.sm },
});
