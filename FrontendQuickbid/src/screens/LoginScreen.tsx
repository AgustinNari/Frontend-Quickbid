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

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// ── Iconos SVG inline ─────────────────────────────────────────────────────────

function UserIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke="#9CA3AF" strokeWidth="1.8" />
      <Path
        d="M4 20c0-3.866 3.582-7 8-7s8 3.134 8 7"
        stroke="#9CA3AF"
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
        stroke="#9CA3AF" strokeWidth="1.8"
      />
      <Path
        d="M8 11V7a4 4 0 0 1 8 0v4"
        stroke="#9CA3AF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Componentes ───────────────────────────────────────────────────────────────

const BLUE = '#0055D1';
const BG   = '#F3F4F6';

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
              placeholderTextColor="#9CA3AF"
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
              placeholderTextColor="#9CA3AF"
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
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
    backgroundColor: BG,
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  brand: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BLUE,
  },

  // Scroll
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 36,
  },

  // Títulos
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },

  // Inputs
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 20,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },

  // Olvidé contraseña
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: 28,
  },
  forgotText: {
    fontSize: 13,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },

  // Botones
  btn: {
    flexDirection: 'row',
    backgroundColor: BLUE,
    borderRadius: 10,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
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
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  footerLink: {
    color: BLUE,
    fontWeight: '600',
  },
});
