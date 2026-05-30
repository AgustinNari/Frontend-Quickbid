import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, radius, fontSize, controlHeight } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// ── Iconos SVG inline ─────────────────────────────────────────────────────────

function UserIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={colors.textSubtle} strokeWidth="1.8" />
      <Path
        d="M4 20c0-3.866 3.582-7 8-7s8 3.134 8 7"
        stroke={colors.textSubtle}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Rect
        x="5" y="11" width="14" height="10" rx="2"
        stroke={colors.textSubtle} strokeWidth="1.8"
      />
      <Path
        d="M8 11V7a4 4 0 0 1 8 0v4"
        stroke={colors.textSubtle}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Componentes ───────────────────────────────────────────────────────────────

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header separado */}
      <View style={styles.header}>
        <Text style={styles.brand}>QuickBid</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">

          {/* Título */}
          <Text style={styles.title}>Entrar a QuickBid</Text>
          <Text style={styles.subtitle}>Ingresa tus credenciales.</Text>

          {/* Email */}
          <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
          <View style={styles.inputRow}>
            <UserIcon />
            <TextInput
              style={styles.input}
              placeholder="nombre@ejemplo.com"
              placeholderTextColor={colors.textSubtle}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Contraseña */}
          <Text style={styles.label}>CONTRASEÑA</Text>
          <View style={styles.inputRow}>
            <LockIcon />
            <TextInput
              style={styles.input}
              placeholder="••••••••••"
              placeholderTextColor={colors.textSubtle}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Olvidé contraseña */}
          <TouchableOpacity style={styles.forgotWrap} onPress={() => navigation.navigate('RecuperacionCuenta')}>
            <Text style={styles.forgotText}>Olvidé mi contraseña</Text>
          </TouchableOpacity>

          {/* Botones */}
          <TouchableOpacity style={styles.btn} activeOpacity={0.85} onPress={() => {}}>
            <Text style={styles.btnText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn} activeOpacity={0.85} onPress={() => {}}>
            <Text style={styles.btnText}>Continuar como Invitado</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              ¿No tienes una cuenta?{' '}
              <Text style={styles.footerLink} onPress={() => navigation.navigate('Register')}>Registrarte</Text>
            </Text>
            <Text style={styles.footerText}>
              ¿Ya completaste el primer registro?{' '}
              <Text style={styles.footerLink} onPress={() => navigation.navigate('EnlaceRegistro')}>Consultalo</Text>
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  brand: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Scroll
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 36,
    paddingBottom: 36,
  },

  // Títulos
  title: {
    fontSize: fontSize['5xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
    marginBottom: spacing['2xl'],
  },

  // Inputs
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textLabel,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: controlHeight.base,
    marginBottom: spacing.lg,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    padding: 0,
  },

  // Olvidé contraseña
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: 28,
  },
  forgotText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },

  // Botones
  btn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radius.base,
    height: controlHeight.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  btnText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Footer
  footer: {
    paddingTop: 40,
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
