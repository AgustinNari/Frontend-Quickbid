import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Body, Icon, Typography } from '../ui';
import { colors, fontSize, fontWeight, radius, spacing } from '../theme';

export type DropdownOption = {
  id: number | string;
  label: string;
  description?: string;
};

type Props = {
  options: DropdownOption[];
  selectedId: number | string | null;
  onSelect: (id: number | string) => void;
  placeholder?: string;
  disabled?: boolean;
  testID?: string;
};

export function DropdownSelector({
  options,
  selectedId,
  onSelect,
  placeholder = 'Seleccionar una opcion',
  disabled = false,
  testID = 'dropdown-selector',
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.id === selectedId) ?? null;
  const canOpen = !disabled && options.length > 1;

  const choose = (id: number | string) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <View style={styles.wrap} testID={testID}>
      <TouchableOpacity
        testID={`${testID}-trigger`}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canOpen, expanded: open }}
        disabled={!canOpen}
        activeOpacity={0.75}
        onPress={() => setOpen(value => !value)}
        style={[
          styles.trigger,
          open ? styles.triggerOpen : null,
          disabled ? styles.disabled : null,
        ]}
      >
        <View style={styles.copy}>
          <Typography style={styles.label} numberOfLines={2}>
            {selected?.label ?? placeholder}
          </Typography>
          {selected?.description ? (
            <Body muted style={styles.description} numberOfLines={2}>
              {selected.description}
            </Body>
          ) : null}
        </View>
        {options.length > 1 ? (
          <View style={open ? styles.chevronOpen : styles.chevronClosed}>
            <Icon name="chevron-right" size={18} color={colors.textMuted} />
          </View>
        ) : null}
      </TouchableOpacity>

      {open ? (
        <View style={styles.options} testID={`${testID}-options`}>
          {options.map(option => {
            const isSelected = option.id === selectedId;
            return (
              <TouchableOpacity
                key={String(option.id)}
                testID={`${testID}-option-${option.id}`}
                activeOpacity={0.72}
                onPress={() => choose(option.id)}
                style={[
                  styles.option,
                  isSelected ? styles.optionSelected : null,
                ]}
              >
                <View style={styles.copy}>
                  <Typography style={styles.label} numberOfLines={2}>
                    {option.label}
                  </Typography>
                  {option.description ? (
                    <Body muted style={styles.description} numberOfLines={3}>
                      {option.description}
                    </Body>
                  ) : null}
                </View>
                {isSelected ? (
                  <Icon name="check-circle" size={19} color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: spacing.xs },
  trigger: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  triggerOpen: { borderColor: colors.primary },
  disabled: { opacity: 0.65 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  label: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  description: { fontSize: fontSize.xs, lineHeight: fontSize.xs * 1.45 },
  chevronClosed: { transform: [{ rotate: '90deg' }] },
  chevronOpen: { transform: [{ rotate: '-90deg' }] },
  options: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  option: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderMuted,
  },
  optionSelected: { backgroundColor: colors.infoSoft },
});
