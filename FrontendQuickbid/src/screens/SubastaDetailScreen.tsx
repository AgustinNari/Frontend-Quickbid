import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
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
  EmptyState,
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
import BottomNavBar, {
  NavTab,
  BOTTOM_NAV_HEIGHT,
} from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { SubastaInfoRow } from '../components/SubastaInfoRow';
import { SEGMENTO_THEME } from '../components/SubastaCard';
import { subastasApi } from '../api/subastas';
import { userFacingError } from '../api/client';
import { mapSubastaDetalle } from '../mappers/subastas';
import {
  SubastaDetalle,
  SEGMENTO_LABEL,
  CATEGORIA_LABEL,
  ESTADO_LABEL,
} from '../types/subasta';
import { useAuth } from '../context/AuthContext';
import { VerificacionSubastaApi } from '../types/subastaApi';

type Props = NativeStackScreenProps<RootStackParamList, 'SubastaDetail'>;

export default function SubastaDetailScreen({ navigation, route }: Props) {
  const { canPerformEconomicActions, isAuthenticated, isGuest, estadoCuenta } =
    useAuth();
  const { id } = route.params;
  const [activeTab, setActiveTab] = useState<NavTab>('subastas');
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState<SubastaDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificacion, setVerificacion] =
    useState<VerificacionSubastaApi | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    loadDetalle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadDetalle = async () => {
    setLoading(true);
    setError(null);
    setAccessError(null);
    try {
      setDetalle(mapSubastaDetalle(await subastasApi.detalle(Number(id))));
      if (isAuthenticated) {
        try {
          setVerificacion(await subastasApi.verificarAcceso(Number(id)));
        } catch (accessLoadError) {
          setVerificacion(null);
          setAccessError(
            userFacingError(accessLoadError, 'No pudimos verificar tu acceso.'),
          );
        }
      } else {
        setVerificacion(null);
      }
    } catch (loadError) {
      setDetalle(null);
      setError(userFacingError(loadError, 'No pudimos cargar la subasta.'));
    } finally {
      setLoading(false);
    }
  };

  const fechaPartes = useMemo(
    () => (detalle ? formatFechaPartes(detalle.fechaInicio) : null),
    [detalle],
  );

  const handleBack = () => navigation.goBack();

  const handleVerCatalogo = () => {
    if (!detalle) return;
    navigation.navigate('CatalogoSubasta', {
      subastaId: detalle.id,
      titulo: detalle.titulo,
    });
  };

  const handleInscribirme = () => {
    if (!detalle) return;
    if (
      isGuest ||
      !canPerformEconomicActions ||
      verificacion?.cuentaBloqueada ||
      verificacion?.cuentaRestringida
    ) {
      navigation.navigate('LimitedAccess');
      return;
    }
    if (verificacion?.yaInscripto) {
      Alert.alert(
        'Ya estás inscripto',
        'Tu inscripción para esta subasta ya está activa.',
      );
      return;
    }
    navigation.navigate('InscripcionSubasta', { subastaId: detalle.id });
  };

  const handleEntrarPuja = () => {
    if (!detalle) return;
    if (isGuest) {
      navigation.navigate('PujaEnVivo', { subastaId: detalle.id });
      return;
    }
    if (
      verificacion?.cuentaBloqueada ||
      estadoCuenta === 'bloqueada_permanente'
    ) {
      navigation.navigate('LimitedAccess');
      return;
    }
    navigation.navigate('PujaEnVivo', { subastaId: detalle.id });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={handleBack} />

      {loading ? (
        <Loader fullScreen label="Cargando detalle..." />
      ) : !detalle ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="alert" size={48} color={colors.textSubtle} />}
            title="No pudimos cargar la subasta"
            description={error ?? 'La subasta no existe o no está disponible.'}
            actionLabel="Reintentar"
            onAction={() => loadDetalle()}
          />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <Hero detalle={detalle} />

            <View style={styles.body}>
              <BadgeEstado estado={detalle.estado} />

              <Heading style={styles.titulo}>{detalle.titulo}</Heading>

              {detalle.subtitulo ? (
                <Body muted style={styles.subtitulo}>
                  {detalle.subtitulo}
                </Body>
              ) : null}

              {fechaPartes ? (
                <Card variant="flat" padding="none" style={styles.fechaCard}>
                  <FechaHoraCol
                    icon="calendar"
                    label="Fecha"
                    value={fechaPartes.fecha}
                  />
                  <View style={styles.fechaDivider} />
                  <FechaHoraCol
                    icon="clock"
                    label="Hora"
                    value={`${fechaPartes.hora}${
                      detalle.zonaHoraria ? ` ${detalle.zonaHoraria}` : ''
                    }`}
                  />
                </Card>
              ) : null}

              <View style={styles.infoList}>
                <SubastaInfoRow
                  icon="search"
                  label="Ubicación"
                  value={detalle.ubicacion}
                />
                {detalle.rematador ? (
                  <>
                    <Divider />
                    <SubastaInfoRow
                      icon="bank"
                      label="Rematador"
                      value={detalle.rematador}
                    />
                  </>
                ) : null}
                <Divider />
                <SubastaInfoRow
                  icon="star"
                  label="Categoría"
                  value={CATEGORIA_LABEL[detalle.categoria]}
                  emphasized
                />
                <Divider />
                <SubastaInfoRow
                  icon="image"
                  label="Segmento"
                  value={SEGMENTO_LABEL[detalle.segmento]}
                />
                <Divider />
                <SubastaInfoRow
                  icon="card"
                  label="Moneda"
                  value={detalle.moneda === 'USD' ? 'USD (US$)' : 'ARS ($)'}
                />
                {detalle.cantidadItems !== undefined ? (
                  <>
                    <Divider />
                    <SubastaInfoRow
                      icon="bag"
                      label="Cantidad de lotes"
                      value={`${detalle.cantidadItems} ítems en catálogo`}
                    />
                  </>
                ) : null}
              </View>

              {detalle.descripcion ? (
                <View style={styles.descripcionWrap}>
                  <Typography style={styles.descripcionLabel}>
                    DESCRIPCIÓN
                  </Typography>
                  <Body style={styles.descripcion}>{detalle.descripcion}</Body>
                </View>
              ) : null}

              <Card variant="flat" style={styles.participationCard}>
                <View style={styles.participationTitleRow}>
                  <Icon name="info" size={18} color={colors.primary} />
                  <Typography style={styles.participationTitle}>
                    Como participar
                  </Typography>
                </View>
                <Body muted style={styles.participationText}>
                  Revisá el catálogo antes de inscribirte. Para ofertar, tu
                  cuenta y un medio de pago compatible deben estar habilitados;
                  la sala confirmará el acceso según el estado real de la
                  subasta.
                </Body>
              </Card>

              {isAuthenticated &&
              verificacion &&
              !verificacion.puedeInscribirse ? (
                <View style={styles.accessBanner}>
                  <Icon
                    name="info"
                    size={18}
                    color={
                      verificacion.yaInscripto ? colors.success : colors.danger
                    }
                  />
                  <Body style={styles.accessText}>
                    {motivoInscripcion(verificacion)}
                  </Body>
                </View>
              ) : estadoCuenta === 'restriccion_multa' ? (
                <View style={styles.accessBanner}>
                  <Icon name="alert" size={18} color={colors.danger} />
                  <Body style={styles.accessText}>
                    Podés ver la subasta, pero la restricción por multa impide
                    inscribirte.
                  </Body>
                </View>
              ) : accessError ? (
                <View style={styles.accessBanner}>
                  <Icon name="alert" size={18} color={colors.danger} />
                  <Body style={styles.accessText}>
                    No pudimos verificar la inscripción: {accessError}
                  </Body>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {detalle.estado === 'activa' ? (
              <>
                <Button
                  onPress={handleEntrarPuja}
                  leftIcon={
                    <Icon
                      name="plus-circle"
                      color={colors.textInverse}
                      size={18}
                    />
                  }
                >
                  Entrar a Puja en Vivo
                </Button>
                <Button
                  variant="secondary"
                  onPress={handleVerCatalogo}
                  leftIcon={<Icon name="bag" color={colors.text} size={18} />}
                  style={styles.secondaryButton}
                >
                  Entrar al catálogo
                </Button>
              </>
            ) : (
              <>
                <Button
                  onPress={handleVerCatalogo}
                  leftIcon={
                    <Icon name="bag" color={colors.textInverse} size={18} />
                  }
                >
                  Entrar al catálogo
                </Button>
                <InscribirmeButton
                  canPerformEconomicActions={canPerformEconomicActions}
                  isGuest={isGuest}
                  verificacion={verificacion}
                  onInscribirme={handleInscribirme}
                />
              </>
            )}
          </View>
        </>
      )}

      <BottomNavBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

function InscribirmeButton({
  canPerformEconomicActions,
  isGuest,
  verificacion,
  onInscribirme,
}: {
  canPerformEconomicActions: boolean;
  isGuest: boolean;
  verificacion: VerificacionSubastaApi | null;
  onInscribirme: () => void;
}) {
  const label = isGuest
    ? 'Iniciá sesión para inscribirte'
    : verificacion?.yaInscripto
    ? 'Ya estás inscripto'
    : verificacion?.cuentaRestringida
    ? 'Inscripción bloqueada por multa'
    : verificacion?.cuentaBloqueada
    ? 'Cuenta bloqueada'
    : verificacion && !verificacion.puedeInscribirse
    ? 'Ver motivo de bloqueo'
    : 'Inscribirme con método de pago';
  return (
    <Button
      variant="secondary"
      onPress={onInscribirme}
      style={styles.secondaryButton}
    >
      {canPerformEconomicActions || isGuest ? label : 'Acceso limitado'}
    </Button>
  );
}

function Hero({ detalle }: { detalle: SubastaDetalle }) {
  const theme = SEGMENTO_THEME[detalle.segmento];
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(detalle.imagen) && !imageFailed;
  return (
    <View style={[styles.hero, { backgroundColor: theme.bg }]}>
      {showImage ? (
        <Image
          source={{ uri: detalle.imagen }}
          style={styles.heroImage}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Icon name={theme.icon} size={88} color={theme.fg} />
      )}
      <View style={styles.heroBadgeWrap}>
        <View style={styles.currencyBadge}>
          <Typography style={styles.currencyText}>{detalle.moneda}</Typography>
        </View>
      </View>
    </View>
  );
}

function BadgeEstado({ estado }: { estado: SubastaDetalle['estado'] }) {
  const tone: 'primary' | 'info' | 'neutral' =
    estado === 'activa' ? 'primary' : estado === 'proxima' ? 'info' : 'neutral';
  return (
    <Badge tone={tone}>
      {estado === 'activa' ? '● ' : ''}
      {ESTADO_LABEL[estado]}
    </Badge>
  );
}

function FechaHoraCol({
  icon,
  label,
  value,
}: {
  icon: 'calendar' | 'clock';
  label: string;
  value: string;
}) {
  return (
    <View style={styles.fechaCol}>
      <View style={styles.fechaLabelRow}>
        <Icon name={icon} size={16} color={colors.primary} />
        <Typography style={styles.fechaLabel}>{label}</Typography>
      </View>
      <Typography style={styles.fechaValue}>{value}</Typography>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function motivoInscripcion(value: VerificacionSubastaApi) {
  if (value.yaInscripto)
    return 'Ya tenés una inscripción activa para esta subasta.';
  if (value.cuentaRestringida)
    return 'La restricción por multa impide nuevas inscripciones.';
  if (value.cuentaBloqueada) return 'Tu cuenta está bloqueada.';
  if (value.categoriaInsuficienteParaInscripcion)
    return 'Tu categoría es insuficiente para esta subasta.';
  if (value.inscripcionCerradaPorTiempo)
    return 'La inscripción ya cerró por cercanía al inicio.';
  if (value.subastaYaIniciada) return 'La subasta ya comenzó.';
  if (
    value.requiereMedioPagoParaInscripcion ||
    value.monedaIncompatibleParaInscripcion
  )
    return 'Necesitás un medio de pago compatible para inscribirte.';
  return 'La inscripción no está disponible actualmente.';
}

const MESES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

function formatFechaPartes(iso: string): { fecha: string; hora: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { fecha: iso, hora: '' };
  }
  const dia = d.getDate();
  const mes = MESES[d.getMonth()];
  const anio = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return {
    fecha: `${dia} ${mes} ${anio}`,
    hora: `${hora}:${min}`,
  };
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg,
  },
  errorWrap: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  hero: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroBadgeWrap: {
    position: 'absolute',
    bottom: spacing.base,
    right: spacing.base,
  },
  currencyBadge: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  currencyText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: letterSpacing.wider,
  },
  body: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    gap: spacing.base,
  },
  titulo: {
    marginTop: spacing.sm,
  },
  subtitulo: {
    marginTop: -spacing.sm,
  },
  fechaCard: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  fechaCol: {
    flex: 1,
    padding: spacing.base,
    gap: spacing.xs,
  },
  fechaLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  fechaLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  fechaValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  fechaDivider: {
    width: 1,
    backgroundColor: colors.borderMuted,
    marginVertical: spacing.sm,
  },
  infoList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    paddingHorizontal: spacing.base,
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderMuted,
  },
  descripcionWrap: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  descripcionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  descripcion: {
    color: colors.textLabel,
    lineHeight: fontSize.lg * 1.5,
  },
  participationCard: {
    gap: spacing.sm,
  },
  participationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  participationTitle: {
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  participationText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.base,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  secondaryButton: {
    marginBottom: spacing.xs,
  },
  accessBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.surface,
  },
  accessText: {
    flex: 1,
    fontSize: fontSize.sm,
  },
});
