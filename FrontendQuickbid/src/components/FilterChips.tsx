import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Typography } from '../ui';
import { colors, radius, spacing, fontSize, fontWeight } from '../theme';

export type FilterOption<T> = {
  value: T | null;
  label: string;
};

type Props<T> = {
  options: ReadonlyArray<FilterOption<T>>;
  value: T | null;
  onChange: (value: T | null) => void;
  style?: StyleProp<ViewStyle>;
};

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  style,
}: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={style}
    >
      {options.map(opt => {
        const selected = opt.value === value;
        return (
          <TouchableOpacity
            key={String(opt.value ?? '__all__')}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.7}
            style={[
              styles.chip,
              selected ? styles.chipSelected : styles.chipIdle,
            ]}
          >
            <Typography
              style={[
                styles.chipText,
                selected ? styles.chipTextSelected : styles.chipTextIdle,
              ]}
            >
              {opt.label}
            </Typography>
          </TouchableOpacity>
        );
      })}
      <View style={{ width: spacing.base }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipIdle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  chipTextIdle: {
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.textInverse,
    fontWeight: fontWeight.semibold,
  },
});
