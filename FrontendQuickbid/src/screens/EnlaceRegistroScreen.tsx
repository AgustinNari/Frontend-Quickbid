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

type Props = NativeStackScreenProps<RootStackParamList, 'EnlaceRegistro'>;

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
        stroke={colors.textMuted}
        strokeWidth="1.8"
      />
      <Path
        d="M12 11v5"
        stroke={colors.textMuted}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="7.5" r="1" fill={colors.textMuted} />
    </Svg>
  );
}

export default function EnlaceRegistroScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [linkEnviado, setLinkEnviado] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);
  const [loadingVerificar, setLoadingVerificar] = useState(false);

  async function handleEnviarLink() {
    if (!email.trim()) {
      Alert.alert('Campo requerido', 'Ingresá tu email.');
      return;
    }
    setLoadingLink(true);
    try {
      await authApi.reenviarLink(email.trim());
      setLinkEnviado(true);
      Alert.alert(
        'Enlace enviado',
        'Revisá tu correo y pegá el código aquí abajo.',
      );
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : 'No se pudo contactar a QuickBid. Revisá tu conexión e intentá nuevamente.';
      Alert.alert('Error', msg);
    } finally {
      setLoadingLink(false);
    }
  }

  async function handleVerificarToken() {
    if (!tokenInput.trim()) {
      Alert.alert(
        'Campo requerido',
        'Ingresá el código que recibiste por email.',
      );
      return;
    }
    setLoadingVerificar(true);
    try {
      await authApi.verificarToken(tokenInput.trim());
      navigation.navigate('Security', {
        mode: 'registro',
        setupToken: tokenInput.trim(),
      });
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : 'No se pudo contactar a QuickBid. Revisá tu conexión e intentá nuevamente.';
      Alert.alert('Error', msg);
    } finally {
      setLoadingVerificar(false);
    }
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
          <Text style={styles.title}>Completar Registro</Text>

          <Text style={styles.body}>
            Ingresá el email con el que iniciaste el registro para reenviar el
            enlace de verificación.
          </Text>

          <Text style={styles.label}>Correo electrónico registrado</Text>
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
            onPress={handleEnviarLink}
            disabled={loadingLink || linkEnviado}
          >
            {loadingLink ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.btnText}>
                {linkEnviado ? 'Enlace enviado ✓' : 'Enviar enlace de acceso'}
              </Text>
            )}
          </TouchableOpacity>

          {linkEnviado && (
            <>
              <View style={styles.infoBox}>
                <View style={styles.infoIcon}>
                  <InfoIcon />
                </View>
                <Text style={styles.infoText}>
                  Revisá tu correo y copiá el código de verificación si la app
                  no se abre automáticamente.
                </Text>
              </View>

              <Text style={styles.label}>Código de verificación</Text>
              <View style={styles.inputRow}>
                <MailIcon />
                <TextInput
                  style={styles.input}
                  value={tokenInput}
                  onChangeText={setTokenInput}
                  placeholder="Pegá el código aquí"
                  placeholderTextColor={colors.textSubtle}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={styles.btn}
                activeOpacity={0.85}
                onPress={handleVerificarToken}
                disabled={loadingVerificar}
              >
                {loadingVerificar ? (
                  <ActivityIndicator color={colors.textInverse} />
                ) : (
                  <Text style={styles.btnText}>Verificar y continuar</Text>
                )}
              </TouchableOpacity>
            </>
          )}
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
    paddingTop: 28,
    paddingBottom: spacing['2xl'],
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 14,
    lineHeight: 34,
  },
  body: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 28,
  },
  label: {
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
    marginBottom: spacing.lg,
    gap: 10,
  },
  input: { flex: 1, fontSize: fontSize.md, color: colors.text, padding: 0 },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: 14,
    gap: 10,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoIcon: { marginTop: 1 },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.base,
    height: controlHeight.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  btnDisabled: { backgroundColor: colors.textSubtle },
  btnText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
});
