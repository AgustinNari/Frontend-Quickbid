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
import { mapItemDetalle, mapSubastaDetalle } from '../mappers/subastas';
import { ItemDetalle, SubastaDetalle } from '../types/subasta';

type Props = NativeStackScreenProps<RootStackParamList, 'PujaExito'>;

/**
 * Pantalla "Felicidades / Has ganado la puja" (tarea #14 del Trello).
 *
 * Replica el frame "Exito: Puja Ganada" del Figma (image7). Se llega via
 * `navigation.replace` desde `PujaEnVivoScreen` al confirmarse una puja
 * ganadora, para que el back vuelva a la subasta y no a la sala de puja.
 *
 * Completa el resumen con datos reales del item y remite al modulo de Compras
 * para continuar el seguimiento.
 */
export default function PujaExitoScreen({ navigation, route }: Props) {
  const { subastaId, itemId, montoFinal, numeroPostor } = route.params;
  const [item, setItem] = useState<ItemDetalle | null>(null);
  const [subasta, setSubasta] = useState<SubastaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const moneda = subasta?.moneda ?? 'USD';

  useEffect(() => {
    Promise.all([
      subastasApi.item(Number(itemId)),
      subastasApi.detalle(Number(subastaId)),
    ])
      .then(([itemDto, subastaDto]) => {
        const detalle = mapSubastaDetalle(subastaDto);
        setSubasta(detalle);
        setItem(mapItemDetalle(itemDto, detalle));
      })
      .catch(() => {
        setSubasta(null);
        setItem(null);
      })
      .finally(() => setLoading(false));
  }, [itemId, subastaId]);

  const volverAlLive = () => navigation.replace('PujaEnVivo', { subastaId });
  const irACompras = () => navigation.navigate('MisCompras');

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader onBack={volverAlLive} />
        <Loader fullScreen label="Preparando el resumen de tu adjudicacion..." />
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
          <Button variant="secondary" onPress={volverAlLive}>Volver a la subasta</Button>
        </View>
      </SafeAreaView>
    );
  }

  const theme = SEGMENTO_THEME[item.segmento];

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={volverAlLive} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          {/* Encabezado de celebracion */}
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

          {/* Card del item adjudicado */}
          <Card variant="flat" padding="none" style={styles.itemCard}>
            <View style={[styles.itemHero, { backgroundColor: theme.bg }]}>
              <Icon name={theme.icon} size={64} color={theme.fg} />
              <View style={styles.loteBadge}>
                <Typography style={styles.loteText}>LOTE {item.lote}</Typography>
              </View>
            </View>
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

          {/* Monto final + estado */}
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

          <Typography style={styles.postorNota}>
            Quedaste registrado como Postor #{numeroPostor} en esta subasta.
          </Typography>

          {/* Banner informativo sobre Compras */}
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
          rightIcon={<Icon name="arrow-right" color={colors.textInverse} size={18} />}
        >
          Ir a Compras
        </Button>
        <Button variant="secondary" onPress={volverAlLive} style={styles.secondaryButton}>
          Volver a la subasta
        </Button>
      </View>
    </SafeAreaView>
  );
}

// ── Estilos ─────────────────────────────────────────────────────────────────

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
  infoText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
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
