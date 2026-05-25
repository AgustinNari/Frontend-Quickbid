import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Body } from './Typography';
import { colors, spacing } from '../theme';

/**
 * Spinner / loader con label opcional.
 *
 * Uso:
 *   <Loader />                                     // inline pequeño
 *   <Loader fullScreen />                          // overlay pantalla completa
 *   <Loader label="Validando tus datos..." />      // con label
 */

type LoaderProps = {
  /** Tamaño nativo del ActivityIndicator */
  size?: 'small' | 'large';
  /** Color del spinner. Default: primary */
  color?: string;
  /** Si true, ocupa toda la pantalla centrado (overlay) */
  fullScreen?: boolean;
  /** Label debajo del spinner */
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export function Loader({
  size = 'large',
  color = colors.primary,
  fullScreen = false,
  label,
  style,
}: LoaderProps) {
  return (
    <View style={[fullScreen ? styles.fullScreen : styles.inline, style]}>
      <ActivityIndicator size={size} color={color} />
      {label ? (
        <Body muted align="center" style={styles.label}>
          {label}
        </Body>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
    gap: spacing.sm,
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  label: {
    marginTop: spacing.xs,
  },
});
