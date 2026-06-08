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

type Variant = 'flat' | 'elevated' | 'outlined';
type Padding = 'none' | 'sm' | 'md' | 'lg';

type CommonProps = {
  variant?: Variant;
  padding?: Padding;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

type CardProps = CommonProps & {
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
