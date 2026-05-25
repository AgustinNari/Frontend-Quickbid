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

type Props = NativeStackScreenProps<RootStackParamList, 'EnlaceRegistro'>;

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
      <Circle cx="12" cy="12" r="9" stroke="#6B7280" strokeWidth="1.8" />
      <Path d="M12 11v5" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="7.5" r="1" fill="#6B7280" />
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
              placeholderTextColor="#9CA3AF"
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
    paddingTop: 28,
    paddingBottom: 32,
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 14,
    lineHeight: 34,
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 28,
  },

  label: {
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
    marginBottom: 20,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: '#111827', padding: 0 },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    gap: 10,
    marginBottom: 28,
    alignItems: 'flex-start',
  },
  infoIcon: { marginTop: 1 },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  infoBold: { fontWeight: '700', color: '#374151' },

  spacer: { flex: 1, minHeight: 16 },

  btn: {
    backgroundColor: BLUE,
    borderRadius: 10,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
