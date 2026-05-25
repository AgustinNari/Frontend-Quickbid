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

type Props = NativeStackScreenProps<RootStackParamList, 'RecuperacionCuenta'>;

const BLUE = '#0055D1';

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MailIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="2" stroke="#9CA3AF" strokeWidth="1.8" />
      <Path d="M3 7l9 6 9-6" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function InfoIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#9CA3AF" strokeWidth="1.8" />
      <Path d="M12 11v5" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="7.5" r="1" fill="#9CA3AF" />
    </Svg>
  );
}

function RecuperacionIcon() {
  return (
    <Svg width="90" height="90" viewBox="0 0 90 90" fill="none">
      {/* Fondo */}
      <Circle cx="45" cy="45" r="40" fill="#EFF6FF" />
      {/* Arco 300° horario: desde (45,23) tope hasta (26,34) arriba-izquierda */}
      <Path
        d="M45 23 A22 22 0 1 1 26 34"
        stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" fill="none"
      />
      {/* Cabeza de flecha en (26,34), dirección horaria ≈ arriba-derecha */}
      <Path
        d="M28 42 L26 34 L18 36"
        stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      {/* Cuerpo del candado */}
      <Rect x="39" y="44" width="12" height="9" rx="2" stroke={BLUE} strokeWidth="1.8" fill="none" />
      {/* Arco del candado */}
      <Path d="M42 44 v-4 a3 3 0 0 1 6 0 v4" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

export default function RecuperacionCuentaScreen({ navigation }: Props) {
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
              placeholderTextColor="#9CA3AF"
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
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  backBtn: { padding: 2 },
  brand:   { fontSize: 18, fontWeight: 'bold', color: BLUE },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 32,
    alignItems: 'center',
  },

  iconWrap: { marginBottom: 28 },

  body: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },

  label: {
    alignSelf: 'flex-start',
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 24,
    gap: 10,
    width: '100%',
  },
  input: { flex: 1, fontSize: 15, color: '#111827', padding: 0 },

  btn: {
    backgroundColor: BLUE,
    borderRadius: 10,
    height: 52,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  hintBox: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    gap: 10,
    width: '100%',
    alignItems: 'flex-start',
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 20,
  },
});
