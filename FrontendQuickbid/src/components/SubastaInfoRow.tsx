import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Icon, IconName, Typography } from '../ui';
import { colors, spacing, fontSize, fontWeight } from '../theme';

/**
 * Fila de metadata para la pantalla de detalle de subasta (tarea #11).
 *
 * Layout:
 *   ┌────┐ Ubicación
 *   │ 📍 │ Grosvenor Square, Londres
 *   └────┘
 *
 * Inspirado en las "Info rows" del frame `236:2658` (Colecciones Detalle).
 * El icono va en una "tile" cuadrada con fondo gris suave para anclar
 * visualmente cada dato.
 */

type Props = {
  icon: IconName;
  label: string;
  value: string;
  /** Si true, el valor va en negrita y un tono más oscuro (para destacar). */
  emphasized?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SubastaInfoRow({
  icon,
  label,
  value,
  emphasized = false,
  style,
}: Props) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.iconTile}>
        <Icon name={icon} size={18} color={colors.textMuted} />
      </View>

      <View style={styles.textWrap}>
        <Typography style={styles.label}>{label}</Typography>
        <Typography
          numberOfLines={2}
          style={[styles.value, emphasized ? styles.valueEmphasized : null]}
        >
          {value}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  value: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  valueEmphasized: {
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
});
