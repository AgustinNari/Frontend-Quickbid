import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Typography, Label } from './Typography';
import { colors, radius, spacing, controlHeight, fontSize } from '../theme';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      containerStyle,
      onFocus,
      onBlur,
      editable = true,
      ...rest
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);
    const hasError = !!error;

    return (
      <View style={[styles.container, containerStyle]}>
        {label ? <Label style={styles.label}>{label}</Label> : null}

        <View
          style={[
            styles.inputRow,
            focused && styles.inputRowFocused,
            hasError && styles.inputRowError,
            !editable && styles.inputRowDisabled,
          ]}
        >
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}

          <TextInput
            ref={ref}
            {...rest}
            editable={editable}
            placeholderTextColor={colors.textSubtle}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={styles.input}
          />

          {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
        </View>

        {hasError ? (
          <Typography variant="caption" danger style={styles.helper}>
            {error}
          </Typography>
        ) : helperText ? (
          <Typography variant="caption" muted style={styles.helper}>
            {helperText}
          </Typography>
        ) : null}
      </View>
    );
  },
);

TextField.displayName = 'TextField';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    alignSelf: 'stretch',
  },
  label: {
    marginBottom: spacing.xs + 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base - 2,
    height: controlHeight.base,
    gap: spacing.sm + 2,
  },
  inputRowFocused: {
    borderColor: colors.primary,
  },
  inputRowError: {
    borderColor: colors.danger,
  },
  inputRowDisabled: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    padding: 0,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  helper: {
    marginTop: spacing.xs + 2,
  },
});
