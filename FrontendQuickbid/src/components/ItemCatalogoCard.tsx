import React from 'react';
import {
  Image,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Card, Typography, Badge, Icon } from '../ui';
import {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  letterSpacing,
} from '../theme';
import { ItemCatalogo, ITEM_ESTADO_LABEL } from '../types/subasta';
import { SEGMENTO_THEME } from './SubastaCard';
import { formatPrecio } from '../utils/format';

type Props = {
  item: ItemCatalogo;
  onPress?: () => void;
  showPrice?: boolean;
  showStatus?: boolean;
  totalLotes?: number;
  style?: StyleProp<ViewStyle>;
};

export function ItemCatalogoCard({
  item,
  onPress,
  showPrice = true,
  showStatus = true,
  totalLotes,
  style,
}: Props) {
  const theme = SEGMENTO_THEME[item.segmento];
  const estadoTone = ESTADO_TONE[item.estado];
  const pastLot =
    showStatus &&
    (item.estado === 'vendido' ||
      item.estado === 'no_vendido' ||
      item.estado === 'comprado_por_empresa');
  const [imageFailed, setImageFailed] = React.useState(false);
  const showImage = Boolean(item.imagen) && !imageFailed;
  const loteLabel =
    item.ordenLote != null && totalLotes != null
      ? `Lote ${item.ordenLote} de ${totalLotes}`
      : `Lote ${item.lote}`;

  return (
    <Card
      onPress={onPress}
      variant="flat"
      padding="none"
      style={[styles.card, pastLot ? styles.cardPast : null, style]}
    >
      <View
        style={[
          styles.imageArea,
          { backgroundColor: theme.bg },
          pastLot ? styles.imagePast : null,
        ]}
      >
        {showImage ? (
          <Image
            source={{ uri: item.imagen }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Icon name={theme.icon} size={40} color={theme.fg} />
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Typography style={styles.lote}>{loteLabel}</Typography>
          {showStatus ? (
            <Badge tone={estadoTone.tone} variant={estadoTone.variant}>
              {item.estado === 'en_vivo' ? '● ' : ''}
              {ITEM_ESTADO_LABEL[item.estado]}
            </Badge>
          ) : null}
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

type EstadoBadge = {
  tone: 'success' | 'primary' | 'neutral';
  variant: 'solid' | 'soft';
};

const ESTADO_TONE: Record<ItemCatalogo['estado'], EstadoBadge> = {
  en_vivo: { tone: 'primary', variant: 'solid' },
  pendiente: { tone: 'neutral', variant: 'soft' },
  vendido: { tone: 'success', variant: 'soft' },
  no_vendido: { tone: 'neutral', variant: 'soft' },
  comprado_por_empresa: { tone: 'neutral', variant: 'soft' },
  sin_estado: { tone: 'neutral', variant: 'soft' },
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    overflow: 'hidden',
    height: 164,
  },
  cardPast: {
    opacity: 0.72,
  },
  imageArea: {
    width: 116,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePast: {
    opacity: 0.72,
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
