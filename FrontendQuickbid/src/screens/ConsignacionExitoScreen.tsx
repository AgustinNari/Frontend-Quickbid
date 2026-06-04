import React from 'react';
import { View, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Heading, Body, Typography, Button, Card, Icon } from '../ui';
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

type Props = NativeStackScreenProps<RootStackParamList, 'ConsignacionExito'>;

const PROXIMOS_PASOS = [
  { titulo: 'Validación digital', sub: 'Revisamos la documentación (1-3 días hábiles).' },
  { titulo: 'Recepción del bien', sub: 'Coordinás el envío o la entrega en sede.' },
  { titulo: 'Revisión física', sub: 'Inspección presencial del objeto.' },
  { titulo: 'Propuesta de acuerdo', sub: 'Te proponemos precio base y comisiones.' },
];

/**
 * "¡Solicitud enviada!" — confirmacion del alta de consignacion (image5).
 *
 * Se llega via `navigation.replace` desde `AltaConsignacionScreen`. Muestra el
 * codigo asignado y los proximos pasos del workflow, con CTA al seguimiento.
 */
export default function ConsignacionExitoScreen({ navigation, route }: Props) {
  const { id, codigo, titulo } = route.params;

  const verSeguimiento = () => navigation.navigate('ConsignacionDetail', { id });
  const irAConsignaciones = () => navigation.navigate('Consignaciones');

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={irAConsignaciones} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <View style={styles.celebracion}>
            <View style={styles.checkCircle}>
              <Icon name="check" size={34} color={colors.textInverse} />
            </View>
            <Heading style={styles.titulo}>¡Solicitud enviada!</Heading>
            <Body muted style={styles.subcopy}>
              Recibimos tu consignación{titulo ? ` de "${titulo}"` : ''}. Vamos a
              validar el origen y te avisamos por notificación.
            </Body>
          </View>

          {codigo ? (
            <Card variant="flat" padding="none" style={styles.codigoCard}>
              <View style={styles.codigoInner}>
                <Typography style={styles.codigoLabel}>CÓDIGO DE SEGUIMIENTO</Typography>
                <Typography style={styles.codigoValue}>{codigo}</Typography>
              </View>
            </Card>
          ) : null}

          <View style={styles.pasosWrap}>
            <Typography style={styles.pasosLabel}>PRÓXIMOS PASOS</Typography>
            <View style={styles.pasosCard}>
              {PROXIMOS_PASOS.map((p, i) => (
                <View key={i} style={styles.pasoRow}>
                  <View style={styles.pasoNum}>
                    <Typography style={styles.pasoNumText}>{i + 1}</Typography>
                  </View>
                  <View style={styles.pasoInfo}>
                    <Typography style={styles.pasoTitulo}>{p.titulo}</Typography>
                    <Typography style={styles.pasoSub}>{p.sub}</Typography>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          onPress={verSeguimiento}
          rightIcon={<Icon name="arrow-right" color={colors.textInverse} size={18} />}
        >
          Ver el seguimiento
        </Button>
        <Button variant="secondary" onPress={irAConsignaciones} style={styles.secondaryButton}>
          Volver a mis consignaciones
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
  titulo: { fontSize: fontSize['3xl'], textAlign: 'center' },
  subcopy: { textAlign: 'center', marginTop: spacing.xs, paddingHorizontal: spacing.sm },
  codigoCard: { marginTop: spacing.sm },
  codigoInner: { padding: spacing.base, alignItems: 'center', gap: spacing.xs },
  codigoLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  codigoValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.primary },
  pasosWrap: { gap: spacing.sm, marginTop: spacing.sm },
  pasosLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  pasosCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.base,
    gap: spacing.base,
  },
  pasoRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  pasoNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.infoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasoNumText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.primary },
  pasoInfo: { flex: 1, gap: 2, paddingTop: 2 },
  pasoTitulo: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  pasoSub: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: fontSize.sm * 1.4 },
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
