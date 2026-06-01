import React from 'react';
import { View, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
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
import { getMockCompra } from '../mocks/compras';

type Props = NativeStackScreenProps<RootStackParamList, 'CompraExito'>;

/**
 * Pantalla "¡Compra completada con éxito!" (image4).
 *
 * Se llega via `navigation.replace` desde `ResumenPagoScreen`. El copy del
 * banner se adapta al tipo de pago: si fue una multa, se menciona el recibo y
 * que la cuenta sale del estado de multa; si fueron comisiones + envío, se
 * menciona la factura y la gestión de entrega.
 */
export default function CompraExitoScreen({ navigation, route }: Props) {
  const { compraId, tipo, total, moneda, documento } = route.params;
  const compra = getMockCompra(compraId);

  const irAMisCompras = () => navigation.navigate('MisCompras');
  const irASubastas = () => navigation.navigate('Subastas');

  const esMulta = tipo === 'multa';
  const theme = compra ? SEGMENTO_THEME[compra.item.segmento] : null;

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
            <Heading style={styles.titulo}>¡Compra completada con éxito!</Heading>
            <Body muted style={styles.subcopy}>
              Tu pago fue procesado de forma segura.
            </Body>
          </View>

          {compra && theme ? (
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
                  <Typography style={styles.itemSub} numberOfLines={1}>
                    {compra.subastaTitulo}
                  </Typography>
                </View>
              </View>
            </Card>
          ) : null}

          <View style={styles.resumenRow}>
            <View style={styles.resumenCol}>
              <Typography style={styles.resumenLabel}>
                {esMulta ? 'PAGADO (ARTÍCULO + MULTA)' : 'PAGADO (COMISIONES + ENVÍO)'}
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
                  ● Pagada
                </Badge>
              </View>
            </View>
          </View>

          {documento ? (
            <Typography style={styles.documentoNota}>
              {esMulta ? 'Recibo de multa' : 'Factura'} N° {documento}
            </Typography>
          ) : null}

          <View style={styles.infoBanner}>
            <Icon name="info" size={18} color={colors.info} />
            <Body style={styles.infoText}>
              {esMulta ? (
                <>
                  Pagaste el artículo junto con la multa. Tu cuenta sale del estado
                  de <Typography style={styles.infoStrong}>multa</Typography>. El
                  recibo queda disponible en{' '}
                  <Typography style={styles.infoStrong}>Mis Compras</Typography>.
                </>
              ) : (
                <>
                  La <Typography style={styles.infoStrong}>factura</Typography> y la
                  gestión de entrega quedan disponibles en{' '}
                  <Typography style={styles.infoStrong}>Mis Compras</Typography>.
                </>
              )}
            </Body>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          onPress={irAMisCompras}
          rightIcon={<Icon name="arrow-right" color={colors.textInverse} size={18} />}
        >
          Ver mis compras
        </Button>
        <Button variant="secondary" onPress={irASubastas} style={styles.secondaryButton}>
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
  celebracion: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.base },
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
  itemRow: { flexDirection: 'row', gap: spacing.base, padding: spacing.base, alignItems: 'center' },
  thumb: {
    width: 56,
    height: 56,
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
  itemSub: { fontSize: fontSize.sm, color: colors.textMuted },
  resumenRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  resumenCol: { flex: 1, padding: spacing.base, gap: spacing.xs },
  resumenDivider: { width: 1, backgroundColor: colors.borderMuted, marginVertical: spacing.sm },
  resumenLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wide,
  },
  resumenMonto: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  estadoBadge: { flexDirection: 'row', marginTop: spacing.xs },
  documentoNota: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
  infoBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.infoSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.info,
  },
  infoText: { flex: 1, color: colors.text, fontSize: fontSize.sm, lineHeight: fontSize.sm * 1.5 },
  infoStrong: { fontWeight: fontWeight.bold, color: colors.info },
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
