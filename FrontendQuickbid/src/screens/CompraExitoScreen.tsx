import React, { useEffect, useState } from 'react';
import { View, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Heading, Body, Typography, Button, Card, Badge, Icon } from '../ui';
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
import { comprasApi } from '../api/compras';
import {
  CompraDetalleUi,
  DocumentoCompraUi,
  mapCompraDetalle,
  mapDocumentoCompra,
} from '../mappers/compras';

type Props = NativeStackScreenProps<RootStackParamList, 'CompraExito'>;

export default function CompraExitoScreen({ navigation, route }: Props) {
  const { compraId, tipo, total, moneda, documento } = route.params;
  const [compra, setCompra] = useState<CompraDetalleUi | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoCompraUi[]>([]);

  useEffect(() => {
    const id = Number(compraId);
    comprasApi
      .detalle(id)
      .then(dto => setCompra(mapCompraDetalle(dto)))
      .catch(() => setCompra(null));
    comprasApi
      .documentos(id)
      .then(docs => setDocumentos(docs.map(mapDocumentoCompra)))
      .catch(() => setDocumentos([]));
  }, [compraId]);

  const irAMisCompras = () => navigation.navigate('MisCompras');
  const irASubastas = () => navigation.navigate('Subastas');
  const esMulta = tipo === 'multa';
  const docPrincipal = documento ?? documentos[0]?.filename;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={irAMisCompras} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <View style={styles.celebracion}>
            <View style={styles.checkCircle}>
              <Icon name="check" size={34} color={colors.textInverse} />
            </View>
            <Heading style={styles.titulo}>Compra completada con exito</Heading>
            <Body muted style={styles.subcopy}>
              Pago registrado correctamente.
            </Body>
          </View>

          <Card variant="flat" padding="none" style={styles.itemCard}>
            <View style={styles.itemRow}>
              <View style={styles.thumb}>
                <Icon
                  name={esMulta ? 'alert' : 'bag'}
                  size={32}
                  color={colors.primary}
                />
              </View>
              <View style={styles.itemInfo}>
                <Typography style={styles.itemLote}>
                  {compra?.loteLabel.toUpperCase() ?? `COMPRA #${compraId}`}
                </Typography>
                <Typography style={styles.itemTitulo} numberOfLines={1}>
                  {compra?.title ?? `Compra #${compraId}`}
                </Typography>
                <Typography style={styles.itemSub} numberOfLines={1}>
                  {compra?.subtitle ??
                    'Detalle actualizado al volver a Mis Compras'}
                </Typography>
              </View>
            </View>
          </Card>

          <View style={styles.resumenRow}>
            <View style={styles.resumenCol}>
              <Typography style={styles.resumenLabel}>
                {esMulta
                  ? 'PAGADO (ARTICULO + MULTA)'
                  : 'PAGADO (COMISIONES + ENVIO)'}
              </Typography>
              <Typography style={styles.resumenMonto}>
                {formatPrecio(total, moneda)}
              </Typography>
            </View>
            <View style={styles.resumenDivider} />
            <View style={styles.resumenCol}>
              <Typography style={styles.resumenLabel}>ESTADO</Typography>
              <View style={styles.estadoBadge}>
                <Badge tone="success" variant="soft">
                  APROBADO
                </Badge>
              </View>
            </View>
          </View>

          {docPrincipal ? (
            <Typography style={styles.documentoNota}>
              Documento generado: {docPrincipal}
            </Typography>
          ) : (
            <Typography style={styles.documentoNota}>
              Si el documento no aparece todavia, revisa Mis Compras para
              actualizar la informacion.
            </Typography>
          )}

          <View style={styles.infoBanner}>
            <Icon name="info" size={18} color={colors.info} />
            <Body style={styles.infoText}>
              {esMulta
                ? 'Pagaste el articulo junto con la multa. Si no quedan otras multas, la sesion se refresca para reflejar la cuenta activa.'
                : 'El pago de extras fue aprobado. La entrega o retiro queda disponible para seguimiento en Mis Compras.'}
            </Body>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          onPress={irAMisCompras}
          rightIcon={
            <Icon name="arrow-right" color={colors.textInverse} size={18} />
          }
        >
          Ver mis compras
        </Button>
        <Button
          variant="secondary"
          onPress={irASubastas}
          style={styles.secondaryButton}
        >
          Volver a Subastas
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing['2xl'] },
  body: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    gap: spacing.base,
  },
  celebracion: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.base,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  titulo: { fontSize: fontSize['2xl'], textAlign: 'center' },
  subcopy: { textAlign: 'center', marginTop: spacing.xs },
  itemCard: { marginTop: spacing.sm },
  itemRow: {
    flexDirection: 'row',
    gap: spacing.base,
    padding: spacing.base,
    alignItems: 'center',
  },
  thumb: {
    width: 56,
    height: 56,
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
  itemSub: { fontSize: fontSize.sm, color: colors.textMuted },
  resumenRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  resumenCol: { flex: 1, padding: spacing.base, gap: spacing.xs },
  resumenDivider: {
    width: 1,
    backgroundColor: colors.borderMuted,
    marginVertical: spacing.sm,
  },
  resumenLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wide,
  },
  resumenMonto: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  estadoBadge: { flexDirection: 'row', marginTop: spacing.xs },
  documentoNota: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.infoSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.info,
  },
  infoText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.base,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  secondaryButton: { marginBottom: spacing.xs },
});
