import React, { useEffect, useState } from 'react';
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
import { getMockItemDetalle } from '../mocks/subastas';
import { formatPrecio } from '../utils/format';
import {
  ItemDetalle,
  ItemEstado,
  ITEM_ESTADO_LABEL,
  SEGMENTO_LABEL,
} from '../types/subasta';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemDetail'>;

/**
 * Pantalla de detalle de un ítem (lote) del catálogo (tarea #12 del Trello).
 *
 * Sin frame de Figma asignado todavía — alineamos al lenguaje visual ya
 * establecido por `SubastaDetailScreen`:
 *  - Header compartido (`ScreenHeader`) con back.
 *  - Hero tematizado por segmento + badge de estado top-left + badge de
 *    moneda bottom-right.
 *  - Body con overline "LOTE #XXX", título grande, autor, card de precio
 *    base y lista de info rows (segmento, moneda, dimensiones, procedencia,
 *    condición).
 *  - Descripción larga.
 *  - Footer con CTA que cambia según el estado del lote:
 *      • `en_vivo`     → "Pujar ahora" (placeholder de tarea #14).
 *      • `pendiente`   → "Avisarme cuando empiece" (placeholder).
 *      • `vendido`     → Badge "Adjudicado" (sin CTA).
 *      • `no_vendido`  → Badge "No vendido" (sin CTA).
 *
 * El precio base se muestra para todos los usuarios — la tarea #12 asume
 * autenticado (modo invitado es tarea #9). La prop `showPrice` queda lista
 * para cuando se integre el modo invitado.
 *
 * Cuando el backend exponga `GET /api/subastas/{subastaId}/catalogo/{itemId}`,
 * `subastaId` (recibido en params) se va a usar para construir la URL.
 */
export default function ItemDetailScreen({ navigation, route }: Props) {
  const { itemId } = route.params;
  const [activeTab, setActiveTab] = useState<NavTab>('subastas');
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ItemDetalle | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setItem(getMockItemDetalle(itemId));
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [itemId]);

  const handleBack = () => navigation.goBack();

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={handleBack} />

      {loading ? (
        <Loader fullScreen label="Cargando ítem..." />
      ) : !item ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="alert" size={48} color={colors.textSubtle} />}
            title="No encontramos el ítem"
            description="El lote que intentás abrir no existe o fue removido del catálogo."
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
            <Hero item={item} />

            <View style={styles.body}>
              <Typography style={styles.overline}>LOTE {item.lote}</Typography>

              <Heading style={styles.titulo}>{item.titulo}</Heading>

              {item.autor ? (
                <Body muted style={styles.autor}>
                  {item.autor}
                </Body>
              ) : null}

              {item.precioBase !== undefined ? (
                <Card variant="flat" padding="none" style={styles.priceCard}>
                  <View style={styles.priceCardInner}>
                    <Typography style={styles.priceLabel}>
                      Precio base
                    </Typography>
                    <Typography style={styles.priceValue}>
                      {formatPrecio(item.precioBase, item.moneda)}
                    </Typography>
                  </View>
                </Card>
              ) : null}

              <View style={styles.infoList}>
                <SubastaInfoRow
                  icon="image"
                  label="Segmento"
                  value={SEGMENTO_LABEL[item.segmento]}
                />
                <Divider />
                <SubastaInfoRow
                  icon="card"
                  label="Moneda"
                  value={item.moneda === 'USD' ? 'USD (US$)' : 'ARS ($)'}
                />
                {item.dimensiones ? (
                  <>
                    <Divider />
                    <SubastaInfoRow
                      icon="check-doc"
                      label="Dimensiones"
                      value={item.dimensiones}
                    />
                  </>
                ) : null}
                {item.procedencia ? (
                  <>
                    <Divider />
                    <SubastaInfoRow
                      icon="bank"
                      label="Procedencia"
                      value={item.procedencia}
                    />
                  </>
                ) : null}
                {item.condicion ? (
                  <>
                    <Divider />
                    <SubastaInfoRow
                      icon="check-circle"
                      label="Condición"
                      value={item.condicion}
                      emphasized
                    />
                  </>
                ) : null}
              </View>

              {item.descripcion ? (
                <View style={styles.descripcionWrap}>
                  <Typography style={styles.descripcionLabel}>
                    DESCRIPCIÓN
                  </Typography>
                  <Body style={styles.descripcion}>{item.descripcion}</Body>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <ItemFooter estado={item.estado} />
        </>
      )}

      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────

function Hero({ item }: { item: ItemDetalle }) {
  const theme = SEGMENTO_THEME[item.segmento];
  const estadoTone = HERO_ESTADO_TONE[item.estado];
  return (
    <View style={[styles.hero, { backgroundColor: theme.bg }]}>
      <Icon name={theme.icon} size={96} color={theme.fg} />

      <View style={styles.heroTopLeft}>
        <Badge tone={estadoTone.tone} variant={estadoTone.variant}>
          {item.estado === 'en_vivo' ? '● ' : ''}
          {ITEM_ESTADO_LABEL[item.estado]}
        </Badge>
      </View>

      <View style={styles.heroBottomRight}>
        <View style={styles.currencyBadge}>
          <Typography style={styles.currencyText}>{item.moneda}</Typography>
        </View>
      </View>
    </View>
  );
}

function ItemFooter({ estado }: { estado: ItemEstado }) {
  if (estado === 'vendido') {
    return (
      <View style={styles.footer}>
        <View style={styles.footerBadgeWrap}>
          <Badge tone="success" variant="soft">
            Adjudicado
          </Badge>
        </View>
      </View>
    );
  }

  if (estado === 'no_vendido') {
    return (
      <View style={styles.footer}>
        <View style={styles.footerBadgeWrap}>
          <Badge tone="neutral" variant="soft">
            No vendido
          </Badge>
        </View>
      </View>
    );
  }

  if (estado === 'en_vivo') {
    return (
      <View style={styles.footer}>
        <Button
          onPress={() =>
            Alert.alert(
              'Pujar',
              'La puja en vivo se habilita en la tarea #14.',
            )
          }
          leftIcon={<Icon name="plus-circle" color={colors.textInverse} size={18} />}
        >
          Pujar ahora
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.footer}>
      <Button
        variant="secondary"
        onPress={() =>
          Alert.alert(
            'Notificación',
            'Las notificaciones llegan con la tarea de notificaciones.',
          )
        }
        leftIcon={<Icon name="bell" color={colors.text} size={18} />}
      >
        Avisarme cuando empiece
      </Button>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// ── Mapeos de presentación ─────────────────────────────────────────────────

type HeroBadgeTone = {
  tone: 'primary' | 'success' | 'neutral' | 'info';
  variant: 'solid' | 'soft';
};

const HERO_ESTADO_TONE: Record<ItemEstado, HeroBadgeTone> = {
  en_vivo: { tone: 'primary', variant: 'solid' },
  pendiente: { tone: 'info', variant: 'soft' },
  vendido: { tone: 'success', variant: 'soft' },
  no_vendido: { tone: 'neutral', variant: 'soft' },
};

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
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTopLeft: {
    position: 'absolute',
    top: spacing.base,
    left: spacing.base,
  },
  heroBottomRight: {
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
  overline: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  titulo: {
    marginTop: -spacing.xs,
  },
  autor: {
    marginTop: -spacing.sm,
  },
  priceCard: {
    marginTop: spacing.sm,
  },
  priceCardInner: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    padding: spacing.base,
  },
  priceLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  priceValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
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
  footerBadgeWrap: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
