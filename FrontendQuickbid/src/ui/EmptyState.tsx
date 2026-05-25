import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Typography, Subheading, Body } from './Typography';
import { Button } from './Button';
import { spacing } from '../theme';

/**
 * Estado vacío para listados sin datos o cargas fallidas.
 *
 * Uso:
 *   <EmptyState
 *     icon={<InboxIcon />}
 *     title="No hay subastas todavía"
 *     description="Vuelve más tarde para descubrir nuevas oportunidades."
 *     actionLabel="Recargar"
 *     onAction={() => refetch()}
 *   />
 */

type EmptyStateProps = {
  /** Icono / ilustración (opcional) */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Si se proveen, se renderiza un Button al final */
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}

      <Subheading align="center" style={styles.title}>
        {title}
      </Subheading>

      {description ? (
        <Body muted align="center" style={styles.description}>
          {description}
        </Body>
      ) : null}

      {actionLabel && onAction ? (
        <View style={styles.actionWrap}>
          <Button variant="secondary" fullWidth={false} onPress={onAction}>
            {actionLabel}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  iconWrap: {
    marginBottom: spacing.base,
    opacity: 0.6,
  },
  title: {
    marginBottom: spacing.xs,
  },
  description: {
    marginBottom: spacing.base,
    maxWidth: 320,
  },
  actionWrap: {
    marginTop: spacing.sm,
  },
});
