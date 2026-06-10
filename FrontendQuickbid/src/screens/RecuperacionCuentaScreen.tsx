import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, radius, fontSize, controlHeight } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { authApi } from '../api/auth';
import { ApiError } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'RecuperacionCuenta'>;

function MailIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke={colors.textSubtle}
        strokeWidth="1.8"
      />
      <Path
        d="M3 7l9 6 9-6"
        stroke={colors.textSubtle}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function InfoIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="9"
        stroke={colors.textSubtle}
        strokeWidth="1.8"
      />
      <Path
        d="M12 11v5"
        stroke={colors.textSubtle}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="7.5" r="1" fill={colors.textSubtle} />
    </Svg>
  );
}

function RecuperacionIcon() {
  return (
    <Svg width="90" height="90" viewBox="0 0 90 90" fill="none">
      <Circle cx="45" cy="45" r="40" fill={colors.infoSoft} />
      <Path
        d="M45 23 A22 22 0 1 1 26 34"
        stroke={colors.primary}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M28 42 L26 34 L18 36"
        stroke={colors.primary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Rect
        x="39"
        y="44"
        width="12"
        height="9"
        rx="2"
        stroke={colors.primary}
        strokeWidth="1.8"
        fill="none"
      />
      <Path
        d="M42 44 v-4 a3 3 0 0 1 6 0 v4"
        stroke={colors.primary}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

export default function RecuperacionCuentaScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [linkEnviado, setLinkEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleEnviar() {
    if (!email.trim()) {
      Alert.alert('Campo requerido', 'Ingresá tu email.');
      return;
    }
    setLoading(true);
    try {
      await authApi.recuperarClave(email.trim());
      setLinkEnviado(true);
      Alert.alert(
        'Enlace enviado',
        'Si tu email está registrado, recibirás el link de recuperación. En desarrollo, revisá los logs del servidor.',
      );
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : 'No se pudo conectar con el servidor.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  function handleContinuar() {
    if (!token.trim()) {
      Alert.alert('Token requerido', 'Ingresá el token recibido por email.');
      return;
    }
    navigation.navigate('Security', {
      mode: 'recuperacion',
      token: token.trim(),
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconWrap}>
            <RecuperacionIcon />
          </View>

          <Text style={styles.body}>
            Ingresá el correo electrónico asociado a tu cuenta para recibir un
            enlace de recuperación.
          </Text>

          <Text style={styles.label}>Correo Electrónico</Text>
          <View style={styles.inputRow}>
            <MailIcon />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ejemplo@correo.com"
              placeholderTextColor={colors.textSubtle}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!linkEnviado}
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, linkEnviado && styles.btnDisabled]}
            activeOpacity={0.85}
            onPress={handleEnviar}
            disabled={loading || linkEnviado}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.btnText}>
                {linkEnviado
                  ? 'Enlace enviado ✓'
                  : 'Enviar Enlace de Recuperación'}
              </Text>
            )}
          </TouchableOpacity>

          {linkEnviado && (
            <>
              <Text style={styles.label}>Token de recuperación</Text>
              <View style={styles.inputRow}>
                <MailIcon />
                <TextInput
                  style={styles.input}
                  value={token}
                  onChangeText={setToken}
                  placeholder="Pegá el token del email"
                  placeholderTextColor={colors.textSubtle}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={styles.btn}
                activeOpacity={0.85}
                onPress={handleContinuar}
              >
                <Text style={styles.btnText}>Continuar</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.hintBox}>
            <InfoIcon />
            <Text style={styles.hintText}>
              Si no recibes el correo en unos minutos, revisá tu carpeta de spam
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1, backgroundColor: colors.white },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 36,
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
  },
  iconWrap: { marginBottom: 28 },
  body: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: spacing.xl,
    gap: 10,
    width: '100%',
  },
  input: { flex: 1, fontSize: fontSize.md, color: colors.text, padding: 0 },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.base,
    height: controlHeight.base,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  btnDisabled: { backgroundColor: colors.textSubtle },
  btnText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  hintBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: 14,
    gap: 10,
    width: '100%',
    alignItems: 'flex-start',
  },
  hintText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSubtle,
    lineHeight: 20,
  },
});
