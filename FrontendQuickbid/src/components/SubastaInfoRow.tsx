import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Icon, IconName, Typography } from '../ui';
import { colors, spacing, fontSize, fontWeight } from '../theme';

const EXPANDABLE_TEXT_THRESHOLD = 120;

type Props = {
  icon: IconName;
  label: string;
  value: string;
  emphasized?: boolean;
  style?: StyleProp<ViewStyle>;
  numberOfLines?: number;
  expandable?: boolean;
  initialNumberOfLines?: number;
  expandedLabel?: string;
  collapsedLabel?: string;
};

export function SubastaInfoRow({
  icon,
  label,
  value,
  emphasized = false,
  style,
  numberOfLines = 2,
  expandable = false,
  initialNumberOfLines,
  expandedLabel = 'Ver menos',
  collapsedLabel = 'Ver más',
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const showToggle =
    expandable && value.trim().length > EXPANDABLE_TEXT_THRESHOLD;
  const visibleLines = expanded
    ? undefined
    : initialNumberOfLines ?? numberOfLines;

  return (
    <View style={[styles.row, style]}>
      <View style={styles.iconTile}>
        <Icon name={icon} size={18} color={colors.textMuted} />
      </View>

      <View style={styles.textWrap}>
        <Typography style={styles.label}>{label}</Typography>
        <Typography
          numberOfLines={visibleLines}
          style={[styles.value, emphasized ? styles.valueEmphasized : null]}
        >
          {value}
        </Typography>
        {showToggle ? (
          <TouchableOpacity
            onPress={() => setExpanded(current => !current)}
            activeOpacity={0.7}
            style={styles.expandButton}
          >
            <Typography style={styles.expandLabel}>
              {expanded ? expandedLabel : collapsedLabel}
            </Typography>
          </TouchableOpacity>
        ) : null}
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
  expandButton: {
    alignSelf: 'flex-start',
    paddingTop: spacing.xs,
    paddingRight: spacing.sm,
    paddingBottom: spacing.xs,
  },
  expandLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});
