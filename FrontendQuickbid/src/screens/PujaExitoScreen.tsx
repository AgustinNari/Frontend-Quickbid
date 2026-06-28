import React, { useEffect, useRef, useState } from 'react';
import { View, SafeAreaView, ScrollView, StyleSheet, Image } from 'react-native';
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
import { ScreenHeader } from '../components/ScreenHeader';
import { SEGMENTO_THEME } from '../components/SubastaCard';
import { formatPrecio } from '../utils/format';
import { subastasApi } from '../api/subastas';
import { comprasApi } from '../api/compras';
import { mapItemDetalle, mapSubastaDetalle } from '../mappers/subastas';
import { ItemDetalle, SubastaDetalle } from '../types/subasta';
import { CompraDetalleDto } from '../types/compraApi';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'PujaExito'>;

export default function PujaExitoScreen({ navigation, route }: Props) {
  const { subastaId, itemId, montoFinal, numeroPostor, compraId } =
    route.params;
  const { refreshSession } = useAuth();
  const [item, setItem] = useState<ItemDetalle | null>(null);
  const [subasta, setSubasta] = useState<SubastaDetalle | null>(null);
  const [compra, setCompra] = useState<CompraDetalleDto | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshedPurchaseRef = useRef<string | null>(null);
  const moneda = subasta?.moneda ?? 'USD';

  useEffect(() => {
    Promise.all([
      subastasApi.item(Number(itemId)),
      subastasApi.detalle(Number(subastaId)),
      compraId ? comprasApi.detalle(Number(compraId)) : Promise.resolve(null),
    ])
      .then(async ([itemDto, subastaDto, compraDto]) => {
        const detalle = mapSubastaDetalle(subastaDto);
        setSubasta(detalle);
        setItem(mapItemDetalle(itemDto, detalle));
        setCompra(compraDto);
        if (
          compraDto?.estado === 'multa_activa' &&
          compraId &&
          refreshedPurchaseRef.current !== compraId
        ) {
          refreshedPurchaseRef.current = compraId;
          await refreshSession();
        }
      })
      .catch(() => {
        setSubasta(null);
        setItem(null);
        setCompra(null);
      })
      .finally(() => setLoading(false));
  }, [compraId, itemId, refreshSession, subastaId]);

  const volverAlLive = () => navigation.replace('PujaEnVivo', { subastaId });
  const irACompras = () => navigation.navigate('MisCompras');
  const irAPagarMulta = () => {
    if (compraId) {
      navigation.navigate('ResumenPago', { compraId, tipo: 'multa' });
      return;
    }
    navigation.navigate('MisCompras');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader onBack={volverAlLive} />
        <Loader
          fullScreen
          label="Preparando el resumen de tu adjudicacion..."
        />
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader onBack={volverAlLive} />
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="check-circle" size={48} color={colors.success} />}
            title="¡Ganaste la puja!"
            description="Tu adjudicación quedó registrada. Vas a recibir el detalle en breve."
          />
          <Button onPress={irACompras}>Ir a Compras</Button>
          <Button variant="secondary" onPress={volverAlLive}>
            Volver a la subasta
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const theme = SEGMENTO_THEME[item.segmento];
  const pagoFallido = compra?.estado === 'multa_activa';
  const multaMonto = Number(compra?.multa?.monto ?? montoFinal * 0.1);
  const venceLabel = compra?.multa?.venceAt
    ? tiempoRestante(compra.multa.venceAt)
    : '72 horas restantes';

  if (pagoFallido) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader onBack={irACompras} />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.body}>
            <View style={styles.celebracion}>
              <View style={styles.alertCircle}>
                <Icon name="alert" size={34} color={colors.danger} />
              </View>
              <Heading style={styles.felicidades}>Pago Fallido</Heading>
              <Typography style={styles.hasGanado}>
                Ganaste la puja
              </Typography>
              <Body muted style={styles.subcopy}>
                Felicidades. Ganaste la puja, pero tu pago no pudo procesarse.
              </Body>
              <Body muted style={styles.subcopy}>
                El pago automatico con tu medio de pago predeterminado fallo
                por causas externas. Se ha aplicado una multa del 10% segun los
                terminos del servicio.
              </Body>
            </View>

            <Card variant="flat" padding="none" style={styles.itemCard}>
              <ItemHero item={item} theme={theme} />
              <View style={styles.itemInfo}>
                <View style={styles.itemTituloRow}>
                  <Heading style={styles.itemTitulo}>{item.titulo}</Heading>
                  <Icon name="alert" size={20} color={colors.danger} />
                </View>
                <View style={styles.failedRows}>
                  <SummaryLine
                    label="Tiempo limite"
                    value={venceLabel}
                    tone="danger"
                  />
                  <SummaryLine
                    label="Monto de puja"
                    value={formatPrecio(montoFinal, moneda)}
                  />
                  <SummaryLine
                    label="Multa 10%"
                    value={formatPrecio(multaMonto, moneda)}
                    tone="danger"
                  />
                </View>
              </View>
            </Card>

            <View style={styles.warningBanner}>
              <Icon name="alert" size={18} color={colors.danger} />
              <Body style={styles.infoText}>
                Tu cuenta queda restringida temporalmente para nuevas pujas
                hasta pagar la obligacion y la multa. Si no pagas dentro del
                plazo, la restriccion puede volverse mas grave segun las reglas
                de negocio.
              </Body>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            onPress={irAPagarMulta}
            rightIcon={
              <Icon name="arrow-right" color={colors.textInverse} size={18} />
            }
          >
            Ir a Mis Compras para Pagar
          </Button>
          <Button
            variant="secondary"
            onPress={irACompras}
            style={styles.secondaryButton}
          >
            Ver Mis Compras
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={volverAlLive} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <View style={styles.celebracion}>
            <View style={styles.checkCircle}>
              <Icon name="check" size={34} color={colors.textInverse} />
            </View>
            <Heading style={styles.felicidades}>¡Felicidades!</Heading>
            <Typography style={styles.hasGanado}>Has ganado la puja</Typography>
            <Body muted style={styles.subcopy}>
              {item.titulo} ahora forma parte de tu colección.
            </Body>
          </View>

          <Card variant="flat" padding="none" style={styles.itemCard}>
            <ItemHero item={item} theme={theme} />
            <View style={styles.itemInfo}>
              <View style={styles.itemTituloRow}>
                <Heading style={styles.itemTitulo}>{item.titulo}</Heading>
                <Icon name="check-circle" size={20} color={colors.success} />
              </View>
              {item.autor ? (
                <Body muted style={styles.itemAutor}>
                  {item.autor}
                </Body>
              ) : null}
            </View>
          </Card>

          <View style={styles.resumenRow}>
            <View style={styles.resumenCol}>
              <Typography style={styles.resumenLabel}>MONTO FINAL</Typography>
              <Typography style={styles.resumenMonto}>
                {formatPrecio(montoFinal, moneda)}
              </Typography>
            </View>
            <View style={styles.resumenDivider} />
            <View style={styles.resumenCol}>
              <Typography style={styles.resumenLabel}>ESTADO</Typography>
              <View style={styles.estadoBadgeWrap}>
                <Badge tone="success" variant="soft">
                  ● Adjudicado
                </Badge>
              </View>
            </View>
          </View>

          {numeroPostor != null ? (
            <Typography style={styles.postorNota}>
              Quedaste registrado como Postor #{numeroPostor} en esta subasta.
            </Typography>
          ) : null}

          <View style={styles.infoBanner}>
            <Icon name="info" size={18} color={colors.info} />
            <Body style={styles.infoText}>
              El proceso de pago de comisiones y gestión de envío se habilita en
              la sección{' '}
              <Typography style={styles.infoStrong}>Compras</Typography>.
              Recibirás un detalle de la compra en breve.
            </Body>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          onPress={irACompras}
          rightIcon={
            <Icon name="arrow-right" color={colors.textInverse} size={18} />
          }
        >
          Ir a Compras
        </Button>
        <Button
          variant="secondary"
          onPress={volverAlLive}
          style={styles.secondaryButton}
        >
          Volver a la subasta
        </Button>
      </View>
    </SafeAreaView>
  );
}

function SummaryLine({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'danger';
}) {
  return (
    <View style={styles.summaryLine}>
      <Typography style={styles.summaryLabel}>{label}</Typography>
      <Typography
        style={[
          styles.summaryValue,
          tone === 'danger' ? styles.summaryDanger : null,
        ]}
      >
        {value}
      </Typography>
    </View>
  );
}

function ItemHero({
  item,
  theme,
}: {
  item: ItemDetalle;
  theme: (typeof SEGMENTO_THEME)[ItemDetalle['segmento']];
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(item.imagen) && !imageFailed;
  return (
    <View style={[styles.itemHero, { backgroundColor: theme.bg }]}>
      {showImage ? (
        <Image
          source={{ uri: item.imagen }}
          style={styles.itemHeroImage}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Icon name={theme.icon} size={64} color={theme.fg} />
      )}
      <View style={styles.loteBadge}>
        <Typography style={styles.loteText}>LOTE {item.lote}</Typography>
      </View>
    </View>
  );
}

function tiempoRestante(iso: string) {
  const expires = Date.parse(iso);
  if (Number.isNaN(expires)) return '72 horas restantes';
  const hours = Math.max(0, Math.ceil((expires - Date.now()) / 3600000));
  if (hours === 1) return '1 hora restante';
  return `${hours} horas restantes`;
}

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
  alertCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  felicidades: {
    fontSize: fontSize['3xl'],
    color: colors.text,
  },
  hasGanado: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  subcopy: {
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.base,
  },

  itemCard: {
    overflow: 'hidden',
  },
  itemHero: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemHeroImage: {
    width: '100%',
    height: '100%',
  },
  loteBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.overlay,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  loteText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
    letterSpacing: letterSpacing.wider,
  },
  itemInfo: {
    padding: spacing.base,
    gap: spacing.xs,
  },
  itemTituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemTitulo: {
    flex: 1,
    fontSize: fontSize.xl,
  },
  itemAutor: {
    marginTop: -spacing.xs,
  },

  resumenRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  resumenCol: {
    flex: 1,
    padding: spacing.base,
    gap: spacing.xs,
  },
  resumenDivider: {
    width: 1,
    backgroundColor: colors.borderMuted,
    marginVertical: spacing.sm,
  },
  resumenLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  resumenMonto: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  estadoBadgeWrap: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  postorNota: {
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
  warningBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  infoText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
  failedRows: {
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
    marginTop: spacing.sm,
  },
  summaryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  summaryValue: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    textAlign: 'right',
    flexShrink: 1,
  },
  summaryDanger: {
    color: colors.danger,
  },
  infoStrong: {
    fontWeight: fontWeight.bold,
    color: colors.info,
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
  secondaryButton: {
    marginBottom: spacing.xs,
  },
});
