import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ViewProps,
  TouchableOpacityProps,
} from 'react-native';
import { colors, radius, spacing, shadow } from '../theme';

/**
 * Tarjeta / superficie contenedora.
 *
 * Variants:
 *  - `flat`: solo bordered, sin shadow (default — matchea el `listCard` actual).
 *  - `elevated`: con shadow.
 *  - `outlined`: borde sin background (transparente).
 *
 * Padding:
 *  - `none`, `sm`, `md`, `lg` (default `md`).
 *
 * Si se pasa `onPress`, se renderiza como `TouchableOpacity` y la card es tappeable.
 *
 * Uso:
 *   <Card>
 *     <Body>Contenido</Body>
 *   </Card>
 *
 *   <Card variant="elevated" onPress={() => navigation.navigate('Detalle')}>
 *     ...
 *   </Card>
 */

type Variant = 'flat' | 'elevated' | 'outlined';
type Padding = 'none' | 'sm' | 'md' | 'lg';

type CommonProps = {
  variant?: Variant;
  padding?: Padding;
  /** Override de estilos */
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

type CardStaticProps = ViewProps & CommonProps;
type CardPressableProps = TouchableOpacityProps & CommonProps & { onPress: () => void };

export function Card(props: CardStaticProps | CardPressableProps) {
  const { variant = 'flat', padding = 'md', style, children, ...rest } = props;

  const finalStyle = [
    styles.base,
    variantStyles[variant],
    paddingStyles[padding],
    style,
  ];

  if ('onPress' in props && props.onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} {...(rest as TouchableOpacityProps)} style={finalStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View {...(rest as ViewProps)} style={finalStyle}>
      {children}
    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
});

const variantStyles = StyleSheet.create({
  flat: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  elevated: {
    ...shadow.md,
  },
  outlined: {
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
});

const paddingStyles = StyleSheet.create({
  none: { padding: 0 },
  sm: { padding: spacing.md },
  md: { padding: spacing.base },
  lg: { padding: spacing.lg },
});
