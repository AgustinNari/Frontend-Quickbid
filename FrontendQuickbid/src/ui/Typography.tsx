import React from 'react';
import { Text, TextProps, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { colors, fontSize, fontWeight, letterSpacing } from '../theme';

/**
 * Sistema tipográfico de QuickBid.
 *
 * Reemplaza el uso directo de <Text> con estilos hardcodeados en cada pantalla.
 * Cada variant codifica las decisiones de tamaño + peso + color del diseño.
 *
 * Uso:
 *   <Heading>Entrar a QuickBid</Heading>
 *   <Body muted>Ingresa tus credenciales.</Body>
 *   <Label>CORREO ELECTRÓNICO</Label>
 */

type Variant =
  | 'displayLg'
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodySm'
  | 'label'
  | 'caption'
  | 'overline';

type TypographyProps = TextProps & {
  variant?: Variant;
  /** Color secundario (`colors.textMuted`) */
  muted?: boolean;
  /** Color sutil (`colors.textSubtle`) */
  subtle?: boolean;
  /** Color primario (`colors.primary`) */
  primary?: boolean;
  /** Color de error (`colors.danger`) */
  danger?: boolean;
  /** Color blanco (sobre fondos oscuros / primarios) */
  inverse?: boolean;
  /** Color custom — gana sobre los flags */
  color?: string;
  /** Forzar peso del texto */
  weight?: keyof typeof fontWeight;
  /** Alineación */
  align?: TextStyle['textAlign'];
  /** Estilos adicionales (siempre como override) */
  style?: StyleProp<TextStyle>;
};

export function Typography({
  variant = 'body',
  muted,
  subtle,
  primary,
  danger,
  inverse,
  color,
  weight,
  align,
  style,
  children,
  ...rest
}: TypographyProps) {
  const variantStyle = variantStyles[variant];

  const resolvedColor =
    color ??
    (danger && colors.danger) ??
    (primary && colors.primary) ??
    (inverse && colors.textInverse) ??
    (subtle && colors.textSubtle) ??
    (muted && colors.textMuted) ??
    undefined;

  return (
    <Text
      {...rest}
      style={[
        variantStyle,
        resolvedColor ? { color: resolvedColor } : null,
        weight ? { fontWeight: fontWeight[weight] } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ── Aliases convenientes ─────────────────────────────────────────────────────

export const Heading = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="h1" {...props} />
);

export const Subheading = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="h2" {...props} />
);

export const Body = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="body" {...props} />
);

export const Label = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="label" {...props} />
);

export const Caption = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="caption" {...props} />
);

export const Overline = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="overline" {...props} />
);

// ── Estilos por variante ─────────────────────────────────────────────────────

const variantStyles = StyleSheet.create({
  displayLg: {
    fontSize: fontSize['6xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: letterSpacing.tight,
  },
  display: {
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: letterSpacing.tight,
  },
  h1: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  h2: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  h3: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  body: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    color: colors.text,
  },
  bodySm: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    color: colors.text,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textLabel,
    letterSpacing: letterSpacing.wider,
  },
  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    color: colors.textMuted,
  },
  overline: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
    letterSpacing: letterSpacing.wider,
  },
});
