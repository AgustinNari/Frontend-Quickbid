import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  StyleSheet,
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
import BottomNavBar, { NavTab } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { SubastaInfoRow } from '../components/SubastaInfoRow';
import { SEGMENTO_THEME } from '../components/SubastaCard';
import { getMockDetalle } from '../mocks/subastas';
import {
  SubastaDetalle,
  SEGMENTO_LABEL,
  CATEGORIA_LABEL,
  ESTADO_LABEL,
  MODALIDAD_LABEL,
} from '../types/subasta';

type Props = NativeStackScreenProps<RootStackParamList, 'SubastaDetail'>;

/**
 * Pantalla de detalle de una subasta (tarea #11 del Trello).
 *
 * Alineada al frame `236:2658` (Colecciones Detalle) del Figma:
 *  - Header con back y brand QuickBid.
 *  - Hero: placeholder tematizado por segmento + badge de estado.
 *  - Título grande + subtítulo (tagline).
 *  - Card con fecha y hora (2 columnas).
 *  - Lista de info rows: ubicación, rematador, categoría, segmento, moneda,
 *    cantidad de items.
 *  - Descripción larga (si la subasta la tiene).
 *  - CTAs:
 *      • Primario: "Entrar al catálogo" → navega a `CatalogoSubasta`.
 *      • Secundario: "Inscribirme" (placeholder — la inscripción es otra tarea).
 *
 * Por ahora consumimos `MOCK_SUBASTA_DETALLE` directamente, con un loading
 * momentáneo para mostrar el `<Loader />` del sistema visual. Cuando el
 * backend esté listo, este efecto se reemplaza por la llamada a
 * `GET /api/subastas/{id}` vía TanStack Query.
 */
export default function SubastaDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const [activeTab, setActiveTab] = useState<NavTab>('subastas');
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState<SubastaDetalle | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDetalle(getMockDetalle(id));
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [id]);

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
    Alert.alert(
      'Inscripción a subasta',
      'Esta acción está pendiente y se va a implementar en una tarea posterior (#13).',
    );
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
            title="No encontramos la subasta"
            description="La subasta que intentás abrir no existe o fue eliminada."
            actionLabel="Volver"
            onAction={handleBack}
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
                  value={`${detalle.ubicacion} · ${
                    MODALIDAD_LABEL[detalle.modalidad]
                  }`}
                />
                <Divider />
                <SubastaInfoRow
                  icon="bank"
                  label="Rematador"
                  value={detalle.rematador}
                />
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
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              onPress={handleVerCatalogo}
              leftIcon={
                <Icon name="bag" color={colors.textInverse} size={18} />
              }
            >
              Entrar al catálogo
            </Button>
            {detalle.inscripto ? (
              <Button
                variant="secondary"
                disabled
                style={styles.secondaryButton}
              >
                Ya estás inscripto
              </Button>
            ) : (
              <Button
                variant="secondary"
                onPress={handleInscribirme}
                style={styles.secondaryButton}
              >
                Inscribirme
              </Button>
            )}
          </View>
        </>
      )}

      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────

function Hero({ detalle }: { detalle: SubastaDetalle }) {
  const theme = SEGMENTO_THEME[detalle.segmento];
  return (
    <View style={[styles.hero, { backgroundColor: theme.bg }]}>
      <Icon name={theme.icon} size={88} color={theme.fg} />
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

// ── Helpers ────────────────────────────────────────────────────────────────

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

// ── Estilos ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: spacing['2xl'],
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
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.base,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  secondaryButton: {
    marginBottom: spacing.xs,
  },
});
