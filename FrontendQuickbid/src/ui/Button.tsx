import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  View,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Typography } from './Typography';
import { colors, radius, spacing, controlHeight, fontSize, fontWeight } from '../theme';

/**
 * Botón estándar de QuickBid.
 *
 * Variants: `primary` (default), `secondary`, `ghost`, `danger`.
 * Sizes: `sm`, `md`, `base` (default), `lg`.
 *
 * Uso:
 *   <Button onPress={handleSubmit}>Iniciar Sesión</Button>
 *   <Button variant="secondary" leftIcon={<Plus />}>Agregar</Button>
 *   <Button loading disabled>Procesando...</Button>
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'base' | 'lg';

type ButtonProps = Omit<TouchableOpacityProps, 'style'> & {
  variant?: Variant;
  size?: Size;
  /** Estado de carga: muestra spinner y deshabilita */
  loading?: boolean;
  /** Ancho completo (default true) */
  fullWidth?: boolean;
  /** Icono a la izquierda del label */
  leftIcon?: React.ReactNode;
  /** Icono a la derecha del label */
  rightIcon?: React.ReactNode;
  /** Override de estilos del contenedor */
  style?: StyleProp<ViewStyle>;
  /** Override de estilos del texto */
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'base',
  loading = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  disabled,
  style,
  textStyle,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = variantStyles[variant];
  const variantTextColor = variantTextColors[variant];
  const sizeStyle = sizeStyles[size];
  const sizeTextSize = sizeTextSizes[size];

  return (
    <TouchableOpacity
      {...rest}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.base,
        variantStyle,
        sizeStyle,
        fullWidth ? styles.fullWidth : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantTextColor} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.iconSlot}>{leftIcon}</View> : null}
          {typeof children === 'string' ? (
            <Typography
              color={variantTextColor}
              style={[
                {
                  fontSize: sizeTextSize,
                  fontWeight: fontWeight.semibold,
                },
                textStyle,
              ]}
            >
              {children}
            </Typography>
          ) : (
            children
          )}
          {rightIcon ? <View style={styles.iconSlot}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.base,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: colors.transparent,
  },
  danger: {
    backgroundColor: colors.danger,
  },
});

const variantTextColors: Record<Variant, string> = {
  primary: colors.textInverse,
  secondary: colors.text,
  ghost: colors.primary,
  danger: colors.textInverse,
};

const sizeStyles = StyleSheet.create({
  sm: { height: controlHeight.sm, paddingHorizontal: spacing.md },
  md: { height: controlHeight.md, paddingHorizontal: spacing.base },
  base: { height: controlHeight.base, paddingHorizontal: spacing.lg },
  lg: { height: controlHeight.lg, paddingHorizontal: spacing.xl },
});

const sizeTextSizes: Record<Size, number> = {
  sm: fontSize.base,
  md: fontSize.base,
  base: fontSize.lg,
  lg: fontSize.lg,
};
