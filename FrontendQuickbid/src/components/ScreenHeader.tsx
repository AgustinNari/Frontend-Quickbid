import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon, Typography } from '../ui';
import { colors, layout, spacing } from '../theme';

type Props = {
  onBack?: () => void;
};

const BACK_SIZE = 24;

export function ScreenHeader({ onBack }: Props) {
  return (
    <View style={styles.header}>
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.backSlot}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-left" color={colors.primary} size={22} />
        </TouchableOpacity>
      )}

      <Typography variant="h2" primary>
        QuickBid
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  backSlot: {
    width: BACK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
