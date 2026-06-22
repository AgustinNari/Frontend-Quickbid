import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, { BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { DropdownSelector } from '../components/DropdownSelector';
import { subastasApi } from '../api/subastas';
import { userFacingError } from '../api/client';
import { mapSubastaDetalle } from '../mappers/subastas';
import {
  MedioPagoInscripcionApi,
  VerificacionSubastaApi,
} from '../types/subastaApi';
import { SubastaDetalle } from '../types/subasta';
import { formatPaymentMethodLabel } from '../utils/displayLabels';
import {
  Badge,
  Body,
  Button,
  Card,
  EmptyState,
  Heading,
  Icon,
  Loader,
  Typography,
} from '../ui';
import {
  colors,
  fontSize,
  fontWeight,
  layout,
  radius,
  spacing,
} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InscripcionSubasta'>;

export default function InscripcionSubastaScreen({ navigation, route }: Props) {
  const id = Number(route.params.subastaId);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subasta, setSubasta] = useState<SubastaDetalle | null>(null);
  const [verificacion, setVerificacion] =
    useState<VerificacionSubastaApi | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detalle, acceso] = await Promise.all([
        subastasApi.detalle(id),
        subastasApi.verificarAcceso(id),
      ]);
      const mapped = mapSubastaDetalle(detalle);
      setSubasta(mapped);
      setVerificacion(acceso);
      const options = acceso.mediosPagoCompatiblesParaInscripcion;
      setSelectedId(current =>
        options.some(item => item.id === current)
          ? current
          : options.find(item => item.principal)?.id ?? options[0]?.id ?? null,
      );
    } catch (loadError) {
      setError(message(loadError));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const medios = verificacion?.mediosPagoCompatiblesParaInscripcion ?? [];
  const selected = medios.find(item => item.id === selectedId) ?? null;
  const bloqueo = verificacion ? motivoBloqueo(verificacion) : null;

  const confirmar = () => {
    if (!subasta || !selected || !verificacion?.puedeInscribirse) return;
    Alert.alert(
      'Confirmar inscripcion',
      `${subasta.titulo}\n${paymentLabel(selected)}\n${
        subasta.moneda
      }\nEstado: ${estadoMedio(
        selected,
      )}\n\nLa inscripcion no realiza ninguna puja.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: enviar },
      ],
    );
  };

  const enviar = async () => {
    if (!subasta || !selected) return;
    setConfirmando(true);
    setError(null);
    try {
      const resultado = await subastasApi.inscribirse(id, selected.id);
      navigation.replace('InscripcionExito', {
        subastaId: subasta.id,
        subastaTitulo: subasta.titulo,
        medioPagoLabel: paymentLabel(selected),
        moneda: subasta.moneda,
        estado: resultado.estado,
        existente: resultado.existente,
        requiereRevisionMedioPago: resultado.requiereRevisionMedioPago,
      });
    } catch (actionError) {
      setError(message(actionError));
      await cargar();
    } finally {
      setConfirmando(false);
    }
  };

  if (loading)
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        <Loader fullScreen label="Verificando acceso..." />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {!subasta || !verificacion ? (
          <EmptyState
            icon={<Icon name="alert" size={48} color={colors.textSubtle} />}
            title="No pudimos verificar tu acceso"
            description={error ?? 'Intenta nuevamente.'}
            actionLabel="Reintentar"
            onAction={cargar}
          />
        ) : (
          <View style={styles.body}>
            <Heading>Metodo de pago</Heading>
            <Card variant="flat" padding="none" style={styles.auctionCard}>
              <View style={styles.cardContent}>
                <Typography variant="h3">{subasta.titulo}</Typography>
                <View style={styles.row}>
                  <Body muted>Moneda requerida</Body>
                  <Badge tone="info" variant="soft">
                    {subasta.moneda}
                  </Badge>
                </View>
              </View>
            </Card>

            {bloqueo ? (
              <StatusBanner tone="danger" text={bloqueo} />
            ) : (
              <StatusBanner
                tone="info"
                text="Selecciona un medio compatible. El servidor validara las condiciones finales al confirmar."
              />
            )}

            <Typography style={styles.section}>
              Medios compatibles para inscripcion
            </Typography>
            {medios.length === 0 ? (
              <EmptyState
                icon={<Icon name="card" size={42} color={colors.textSubtle} />}
                title="Sin medios compatibles"
                description={`Necesitas un medio en ${subasta.moneda} pendiente, verificado o vencido para solicitar la inscripcion.`}
                actionLabel="Ir a metodos de pago"
                onAction={() => navigation.navigate('MetodosPago')}
              />
            ) : (
              <DropdownSelector
                testID="registration-payment-dropdown"
                options={medios.map(item => ({
                  id: item.id,
                  label: paymentLabel(item),
                  description: `${subasta.moneda} - ${estadoMedio(item)}${
                    item.principal ? ' - Principal' : ''
                  }`,
                }))}
                selectedId={selectedId}
                disabled={!verificacion.puedeInscribirse}
                onSelect={value => setSelectedId(Number(value))}
              />
            )}

            {error ? <StatusBanner tone="danger" text={error} /> : null}
            <Button
              onPress={confirmar}
              disabled={!selected || !verificacion.puedeInscribirse}
              loading={confirmando}
            >
              {verificacion.yaInscripto
                ? 'Ya estas inscripto'
                : 'Confirmar inscripcion'}
            </Button>
            <Button variant="secondary" onPress={cargar}>
              Actualizar verificacion
            </Button>
          </View>
        )}
      </ScrollView>
      <BottomNavBar activeTab="subastas" navigation={navigation} />
    </SafeAreaView>
  );
}

function StatusBanner({
  tone,
  text,
}: {
  tone: 'info' | 'danger';
  text: string;
}) {
  return (
    <View
      style={[styles.banner, tone === 'danger' ? styles.danger : styles.info]}
    >
      <Icon
        name={tone === 'danger' ? 'alert' : 'info'}
        size={18}
        color={tone === 'danger' ? colors.danger : colors.info}
      />
      <Body style={styles.bannerText}>{text}</Body>
    </View>
  );
}

function motivoBloqueo(value: VerificacionSubastaApi) {
  if (value.cuentaBloqueada)
    return 'Tu cuenta esta bloqueada y no puede inscribirse.';
  if (value.cuentaRestringida)
    return 'Tu cuenta tiene una restriccion por multa. Puedes ver la subasta, pero no inscribirte.';
  if (value.yaInscripto)
    return 'Ya tienes una inscripcion activa para esta subasta.';
  if (value.categoriaInsuficienteParaInscripcion)
    return 'Tu categoria actual no alcanza la requerida por esta subasta.';
  if (value.inscripcionCerradaPorTiempo)
    return 'La inscripcion cerro porque faltan 60 minutos o menos para el inicio.';
  if (value.subastaYaIniciada)
    return 'La subasta ya comenzo y no acepta nuevas inscripciones.';
  if (value.monedaIncompatibleParaInscripcion)
    return 'No tienes un medio de pago compatible con la moneda de la subasta.';
  if (value.requiereMedioPagoParaInscripcion)
    return 'Necesitas registrar un medio de pago compatible para inscribirte.';
  return value.puedeInscribirse
    ? null
    : 'No cumples actualmente las condiciones para inscribirte.';
}

function paymentLabel(item: MedioPagoInscripcionApi) {
  return formatPaymentMethodLabel(item);
}
function estadoMedio(item: MedioPagoInscripcionApi) {
  return item.requiereRevalidacion
    ? 'Requiere revision'
    : item.estado.replaceAll('_', ' ');
}
function message(error: unknown) {
  return userFacingError(error, 'No pudimos completar la operacion.');
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: BOTTOM_NAV_HEIGHT + spacing.xl },
  body: { padding: layout.screenPaddingHorizontal, gap: spacing.base },
  auctionCard: { borderColor: colors.borderMuted },
  cardContent: { padding: spacing.base, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowStart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  section: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  banner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  info: { backgroundColor: colors.infoSoft, borderColor: colors.info },
  danger: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  bannerText: { flex: 1, fontSize: fontSize.sm },
  payment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.surface,
  },
  paymentSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.infoSoft,
  },
  disabled: { opacity: 0.55 },
  paymentInfo: { flex: 1 },
  paymentName: { color: colors.text, fontWeight: fontWeight.semibold },
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
