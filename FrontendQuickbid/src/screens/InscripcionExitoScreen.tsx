import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, { BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { Body, Button, Card, Heading, Icon, Typography } from '../ui';
import {
  colors,
  fontSize,
  fontWeight,
  layout,
  radius,
  spacing,
} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InscripcionExito'>;

export default function InscripcionExitoScreen({ navigation, route }: Props) {
  const value = route.params;
  const pending =
    value.requiereRevisionMedioPago || value.estado === 'pendiente_validacion';
  const rejected = value.estado === 'rechazada';
  const tone = rejected
    ? colors.danger
    : pending
    ? colors.warning
    : colors.success;
  const title = rejected
    ? 'Inscripción rechazada'
    : pending
    ? 'Solicitud recibida'
    : value.existente
    ? 'Ya estabas inscripto'
    : 'Inscripción aprobada';
  const description = rejected
    ? 'La solicitud no pudo aprobarse. Revisá el estado de tu medio de pago e intentá nuevamente.'
    : pending
    ? 'Tu inscripción quedó pendiente mientras el equipo revisá o revalida el medio de pago seleccionado.'
    : 'tu inscripción está aprobada. Cumplís las condiciones para participar.';

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        onBack={() =>
          navigation.replace('SubastaDetail', { id: value.subastaId })
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.icon, { backgroundColor: tone }]}>
          <Icon
            name={rejected ? 'alert' : 'check-circle'}
            size={42}
            color={colors.white}
          />
        </View>
        <Heading style={styles.title}>{title}</Heading>
        <Body style={styles.description}>{description}</Body>
        <Card variant="flat" padding="none" style={styles.card}>
          <Resumen label="Subasta" value={value.subastaTitulo} />
          <Divider />
          <Resumen label="Método de pago" value={value.medioPagoLabel} />
          <Divider />
          <Resumen label="Moneda" value={value.moneda} />
          <Divider />
          <Resumen
            label="Estado real"
            value={value.estado.replaceAll('_', ' ')}
          />
        </Card>
        {rejected ? (
          <Button
            onPress={() =>
              navigation.replace('InscripcionSubasta', {
                subastaId: value.subastaId,
              })
            }
          >
            Intentar nuevamente
          </Button>
        ) : null}
        <Button
          variant={rejected ? 'secondary' : 'primary'}
          onPress={() =>
            navigation.replace('SubastaDetail', { id: value.subastaId })
          }
        >
          Volver a la subasta
        </Button>
      </ScrollView>
      <BottomNavBar activeTab="subastas" navigation={navigation} />
    </SafeAreaView>
  );
}

function Resumen({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summary}>
      <Typography style={styles.label}>{label}</Typography>
      <Typography style={styles.value}>{value}</Typography>
    </View>
  );
}
function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    padding: layout.screenPaddingHorizontal,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.xl,
    gap: spacing.base,
  },
  icon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  title: { textAlign: 'center' },
  description: {
    textAlign: 'center',
    color: colors.textLabel,
    lineHeight: fontSize.base * 1.5,
  },
  card: {
    width: '100%',
    marginVertical: spacing.base,
    borderRadius: radius.lg,
  },
  summary: { padding: spacing.base, gap: spacing.xs },
  label: { color: colors.textMuted, fontSize: fontSize.sm },
  value: {
    color: colors.text,
    fontWeight: fontWeight.semibold,
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderMuted,
    marginHorizontal: spacing.base,
  },
});
