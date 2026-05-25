import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Typography } from './Typography';
import { colors, radius, spacing, fontSize, fontWeight, letterSpacing } from '../theme';

/**
 * Badge / etiqueta de estado.
 *
 * Tones:
 *  - `primary` (default — azul, ej: "PRINCIPAL")
 *  - `success` (verde, ej: "VERIFICADO")
 *  - `warning` (amarillo, ej: "PENDIENTE")
 *  - `danger` (rojo, ej: "BLOQUEADO")
 *  - `info` (azul claro)
 *  - `neutral` (gris)
 *
 * Variants:
 *  - `solid` (default — fondo lleno, texto blanco)
 *  - `soft` (fondo suave, texto del color del tone)
 *
 * Uso:
 *   <Badge>PRINCIPAL</Badge>
 *   <Badge tone="success" variant="soft">VERIFICADO</Badge>
 */

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
type Variant = 'solid' | 'soft';

type BadgeProps = {
  children: React.ReactNode;
  tone?: Tone;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
};

export function Badge({
  children,
  tone = 'primary',
  variant = 'solid',
  style,
}: BadgeProps) {
  const tokens = TONE_TOKENS[tone];
  const bg = variant === 'solid' ? tokens.solid : tokens.soft;
  const color = variant === 'solid' ? colors.textInverse : tokens.solid;

  return (
    <View style={[styles.base, { backgroundColor: bg }, style]}>
      <Typography style={[styles.text, { color }]}>{children}</Typography>
    </View>
  );
}

const TONE_TOKENS: Record<Tone, { solid: string; soft: string }> = {
  primary: { solid: colors.primary, soft: colors.infoSoft },
  success: { solid: colors.success, soft: colors.successSoft },
  warning: { solid: colors.warning, soft: colors.warningSoft },
  danger: { solid: colors.danger, soft: colors.dangerSoft },
  info: { solid: colors.info, soft: colors.infoSoft },
  neutral: { solid: colors.textMuted, soft: colors.borderMuted },
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: radius.xs,
    paddingHorizontal: spacing.xs + 2, // 6
    paddingVertical: 2,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.wider,
  },
});
