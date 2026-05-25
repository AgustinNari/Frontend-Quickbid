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

/**
 * Input de texto estándar de QuickBid.
 *
 * Encapsula el patrón: <Label> + <Container con icon prefix + TextInput> + <Helper/Error>.
 *
 * Uso:
 *   <TextField
 *     label="CORREO ELECTRÓNICO"
 *     placeholder="nombre@ejemplo.com"
 *     leftIcon={<UserIcon />}
 *     value={email}
 *     onChangeText={setEmail}
 *   />
 *
 *   <TextField
 *     label="CONTRASEÑA"
 *     secureTextEntry
 *     leftIcon={<LockIcon />}
 *     error="La contraseña es muy corta"
 *   />
 */

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  /** Label en mayúsculas que va arriba del input */
  label?: string;
  /** Texto de ayuda debajo del input */
  helperText?: string;
  /** Mensaje de error — gana sobre helperText y pinta el borde de rojo */
  error?: string;
  /** Icono a la izquierda dentro del input */
  leftIcon?: React.ReactNode;
  /** Icono / botón a la derecha (ej: toggle de password) */
  rightIcon?: React.ReactNode;
  /** Override de estilo del wrapper externo */
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

// ── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    alignSelf: 'stretch',
  },
  label: {
    marginBottom: spacing.xs + 2, // 6
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base - 2, // 14
    height: controlHeight.base,
    gap: spacing.sm + 2, // 10
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
    marginTop: spacing.xs + 2, // 6
  },
});
