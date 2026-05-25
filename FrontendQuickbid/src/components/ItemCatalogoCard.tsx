import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Card, Typography, Badge, Icon } from '../ui';
import {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  letterSpacing,
} from '../theme';
import {
  ItemCatalogo,
  ITEM_ESTADO_LABEL,
  SubastaMoneda,
} from '../types/subasta';
import { SEGMENTO_THEME } from './SubastaCard';

/**
 * Card horizontal de un ítem del catálogo de una subasta (tarea #11).
 *
 * Layout alineado al frame `178:1666` (Catálogo de Subasta Secuencial):
 *   ┌──────┬──────────────────────────────────────────┐
 *   │      │ LOTE #042                  [● EN VIVO]   │
 *   │ IMG  │ Título del ítem (max 2 líneas)           │
 *   │      │ Autor / referencia                       │
 *   │      │ Precio base: USD 1.500                   │
 *   └──────┴──────────────────────────────────────────┘
 *
 * Imagen es un placeholder temático del segmento (mismo lenguaje visual que
 * `SubastaCard`) mientras no haya foto real del backend.
 */

type Props = {
  item: ItemCatalogo;
  onPress?: () => void;
  /**
   * Si false, oculta el precio base — refleja el modo invitado del backend
   * (`GET /api/subastas/{id}/catalogo` omite precios para usuarios anónimos).
   * Default true (modo autenticado, asumido por la tarea #11).
   */
  showPrice?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ItemCatalogoCard({
  item,
  onPress,
  showPrice = true,
  style,
}: Props) {
  const theme = SEGMENTO_THEME[item.segmento];
  const estadoTone = ESTADO_TONE[item.estado];

  return (
    <Card
      onPress={onPress as any}
      variant="flat"
      padding="none"
      style={[styles.card, style]}
    >
      <View style={[styles.imageArea, { backgroundColor: theme.bg }]}>
        <Icon name={theme.icon} size={40} color={theme.fg} />
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Typography style={styles.lote}>LOTE {item.lote}</Typography>
          <Badge tone={estadoTone.tone} variant={estadoTone.variant}>
            {item.estado === 'en_vivo' ? '● ' : ''}
            {ITEM_ESTADO_LABEL[item.estado]}
          </Badge>
        </View>

        <Typography variant="h3" numberOfLines={2} style={styles.titulo}>
          {item.titulo}
        </Typography>

        {item.autor ? (
          <Typography variant="caption" muted numberOfLines={1}>
            {item.autor}
          </Typography>
        ) : null}

        {showPrice && item.precioBase !== undefined ? (
          <View style={styles.priceRow}>
            <Typography variant="caption" muted>
              Precio base
            </Typography>
            <Typography style={styles.priceValue}>
              {formatPrecio(item.precioBase, item.moneda)}
            </Typography>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

// ── Mapeos de presentación ──────────────────────────────────────────────────

type EstadoBadge = { tone: 'success' | 'primary' | 'neutral'; variant: 'solid' | 'soft' };

const ESTADO_TONE: Record<ItemCatalogo['estado'], EstadoBadge> = {
  en_vivo: { tone: 'primary', variant: 'solid' },
  pendiente: { tone: 'neutral', variant: 'soft' },
  vendido: { tone: 'success', variant: 'soft' },
  no_vendido: { tone: 'neutral', variant: 'soft' },
};

function formatPrecio(monto: number, moneda: SubastaMoneda): string {
  const formatted = new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0,
  }).format(monto);
  return `${moneda} ${formatted}`;
}

// ── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 124,
  },
  imageArea: {
    width: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: 2,
  },
  lote: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  titulo: {
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
    borderRadius: radius.none,
  },
  priceValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
});
