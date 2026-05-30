import React, { useEffect, useState } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  Heading,
  Body,
  Typography,
  Button,
  Card,
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
import BottomNavBar, { NavTab, BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { getMockDetalle } from '../mocks/subastas';
import { getMedioPagoById } from '../mocks/mediosPago';
import { SubastaDetalle } from '../types/subasta';
import { MedioPago } from '../types/medioPago';

type Props = NativeStackScreenProps<RootStackParamList, 'InscripcionExito'>;

/**
 * Pantalla de confirmación de inscripción a subasta (tarea #13).
 *
 * Alineada al frame "¡Solicitud Recibida!" del Figma (Capturas de figma.docx,
 * image7). Se llega acá vía `navigation.replace` desde `InscripcionSubasta`,
 * así que el back-button del header lleva al detalle de subasta (no a la
 * pantalla de selección, que ya fue removida del stack).
 *
 * Layout:
 *  - Header con back + brand.
 *  - Overline "Confirmación de Inscripción".
 *  - Ícono check circular grande.
 *  - Título "¡Solicitud Recibida!".
 *  - Texto explicativo del proceso de validación (hasta 24 hs hábiles).
 *  - Card "Resumen de Inscripción" con subasta + método de pago.
 *  - CTA primario "Volver a Subastas" que resetea el stack al listado.
 */
export default function InscripcionExitoScreen({ navigation, route }: Props) {
  const { subastaId, idMedioPago } = route.params;
  const [activeTab, setActiveTab] = useState<NavTab>('subastas');
  const [subasta, setSubasta] = useState<SubastaDetalle | null>(null);
  const [medio, setMedio] = useState<MedioPago | null>(null);

  useEffect(() => {
    setSubasta(getMockDetalle(subastaId));
    setMedio(getMedioPagoById(idMedioPago));
  }, [subastaId, idMedioPago]);

  const handleBack = () => navigation.goBack();
  const handleVolverASubastas = () => navigation.navigate('Subastas');

  const medioLabel = medio
    ? medio.ultimos4
      ? `${medio.etiqueta} ****${medio.ultimos4}`
      : medio.etiqueta
    : '—';

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={handleBack} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <Typography style={styles.overline}>
            CONFIRMACIÓN DE INSCRIPCIÓN
          </Typography>

          <View style={styles.checkWrap}>
            <View style={styles.checkCircle}>
              <Icon name="check-circle" size={40} color={colors.textInverse} />
            </View>
          </View>

          <Heading style={styles.titulo}>¡Solicitud Recibida!</Heading>

          <Body style={styles.description}>
            Tu solicitud de inscripción a la subasta con el método de pago
            seleccionado ha sido enviada con éxito. Nuestro equipo validará los
            fondos y te notificaremos por mail y a través de la app una vez que
            estés habilitado para pujar. Este proceso puede tardar hasta 24
            horas hábiles.
          </Body>

          <Card variant="flat" padding="none" style={styles.resumen}>
            <View style={styles.resumenHeader}>
              <Typography style={styles.resumenTitle}>
                Resumen de Inscripción
              </Typography>
            </View>

            <ResumenRow label="Subasta" value={subasta?.titulo ?? '—'} />
            <View style={styles.divider} />
            <ResumenRow
              label="Método de Pago"
              value={medioLabel}
              icon={medio?.tipo === 'tarjeta' ? 'card' : medio?.tipo === 'cuenta_bancaria' ? 'bank' : medio?.tipo === 'cheque_certificado' ? 'check-doc' : undefined}
            />
          </Card>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button onPress={handleVolverASubastas}>Volver a Subastas</Button>
      </View>

      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} navigation={navigation} />
    </SafeAreaView>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────

function ResumenRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: 'card' | 'bank' | 'check-doc';
}) {
  return (
    <View style={styles.resumenRow}>
      <Typography style={styles.resumenLabel}>{label}</Typography>
      <View style={styles.resumenValueRow}>
        {icon ? <Icon name={icon} size={16} color={colors.textMuted} /> : null}
        <Typography style={styles.resumenValue} numberOfLines={1}>
          {value}
        </Typography>
      </View>
    </View>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg,
    flexGrow: 1,
  },
  body: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    gap: spacing.base,
    alignItems: 'center',
  },
  overline: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
    textAlign: 'center',
  },
  checkWrap: {
    paddingVertical: spacing.lg,
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    textAlign: 'center',
    color: colors.textLabel,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.6,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.base,
  },
  resumen: {
    width: '100%',
    marginTop: spacing.base,
  },
  resumenHeader: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  resumenTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  resumenRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  resumenLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  resumenValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  resumenValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flexShrink: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderMuted,
    marginHorizontal: spacing.base,
  },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
});
