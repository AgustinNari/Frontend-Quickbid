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
import { ScreenHeader } from '../components/ScreenHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'RecuperacionCuenta'>;

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
      <Circle cx="12" cy="12" r="9" stroke={colors.textSubtle} strokeWidth="1.8" />
      <Path d="M12 11v5" stroke={colors.textSubtle} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="7.5" r="1" fill={colors.textSubtle} />
    </Svg>
  );
}

function RecuperacionIcon() {
  return (
    <Svg width="90" height="90" viewBox="0 0 90 90" fill="none">
      {/* Fondo */}
      <Circle cx="45" cy="45" r="40" fill={colors.infoSoft} />
      {/* Arco 300° horario: desde (45,23) tope hasta (26,34) arriba-izquierda */}
      <Path
        d="M45 23 A22 22 0 1 1 26 34"
        stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" fill="none"
      />
      {/* Cabeza de flecha en (26,34), dirección horaria ≈ arriba-derecha */}
      <Path
        d="M28 42 L26 34 L18 36"
        stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      {/* Cuerpo del candado */}
      <Rect x="39" y="44" width="12" height="9" rx="2" stroke={colors.primary} strokeWidth="1.8" fill="none" />
      {/* Arco del candado */}
      <Path d="M42 44 v-4 a3 3 0 0 1 6 0 v4" stroke={colors.primary} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

export default function RecuperacionCuentaScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');

  return (
    <SafeAreaView style={styles.safe}>

      <ScreenHeader onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.iconWrap}>
            <RecuperacionIcon />
          </View>

          <Text style={styles.body}>
            Ingresa el correo electrónico asociado a tu cuenta para recibir un enlace de
            recuperación.
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
            />
          </View>

          <TouchableOpacity
            style={styles.btn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Security')}>
            <Text style={styles.btnText}>Enviar Enlace de Recuperación</Text>
          </TouchableOpacity>

          <View style={styles.hintBox}>
            <InfoIcon />
            <Text style={styles.hintText}>
              Si no recibes el correo en unos minutos, revisa tu carpeta de spam
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
    marginBottom: 28,
  },
  btnText: { color: colors.textInverse, fontSize: fontSize.lg, fontWeight: '600' },

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
