import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ViewProps,
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

type CardProps = CommonProps & {
  /**
   * Si se pasa, la card se renderiza como `TouchableOpacity` y queda tappeable.
   * Si se omite (o es `undefined`), se renderiza como `View` estática.
   */
  onPress?: () => void;
  testID?: string;
  accessibilityLabel?: string;
  pointerEvents?: ViewProps['pointerEvents'];
};

export function Card({
  variant = 'flat',
  padding = 'md',
  style,
  children,
  onPress,
  testID,
  accessibilityLabel,
  pointerEvents,
}: CardProps) {
  const finalStyle = [
    styles.base,
    variantStyles[variant],
    paddingStyles[padding],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        style={finalStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      pointerEvents={pointerEvents}
      style={finalStyle}
    >
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
