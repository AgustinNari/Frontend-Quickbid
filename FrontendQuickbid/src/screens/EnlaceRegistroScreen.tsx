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
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, radius, fontSize, controlHeight } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EnlaceRegistro'>;

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MailIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="2" stroke={colors.textSubtle} strokeWidth="1.8" />
      <Path d="M3 7l9 6 9-6" stroke={colors.textSubtle} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function InfoIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={colors.textMuted} strokeWidth="1.8" />
      <Path d="M12 11v5" stroke={colors.textMuted} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="7.5" r="1" fill={colors.textMuted} />
    </Svg>
  );
}

export default function EnlaceRegistroScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');

  return (
    <SafeAreaView style={styles.safe}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.brand}>QuickBid</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <Text style={styles.title}>Solicitud de Enlace para Completar Registro</Text>

          <Text style={styles.body}>
            Para acceder a la sala de pujas, necesitamos validar tus datos ya registrados
            anteriormente, este proceso puede requerir hasta 72hs hábiles.
          </Text>

          <Text style={styles.label}>Ingresar el correo electrónico ya registrado</Text>
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
            />
          </View>

          {/* Caja informativa */}
          <View style={styles.infoBox}>
            <View style={styles.infoIcon}>
              <InfoIcon />
            </View>
            <Text style={styles.infoText}>
              El enlace de acceso seguro solo se enviará a esta dirección si tu cuenta ha sido{' '}
              <Text style={styles.infoBold}>validada y aprobada</Text>
              {' '}previamente por la empresa.
            </Text>
          </View>

          <View style={styles.spacer} />

          <TouchableOpacity
            style={styles.btn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Security')}>
            <Text style={styles.btnText}>Enviar Enlace de Acceso</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1, backgroundColor: colors.white },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
    gap: spacing.xs,
  },
  backBtn: { padding: 2 },
  brand:   { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.primary },

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
    marginBottom: 28,
    alignItems: 'flex-start',
  },
  infoIcon: { marginTop: 1 },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  infoBold: { fontWeight: '700', color: colors.textLabel },

  spacer: { flex: 1, minHeight: 16 },

  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.base,
    height: controlHeight.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: colors.textInverse, fontSize: fontSize.lg, fontWeight: '600' },
});
