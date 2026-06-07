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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, radius, fontSize, controlHeight } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { authApi } from '../api/auth';
import { ApiError } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [email,     setEmail]     = useState('');
  const [nombre,    setNombre]    = useState('');
  const [apellido,  setApellido]  = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [loading,   setLoading]   = useState(false);

  async function handleContinuar() {
    if (!email.trim() || !nombre.trim() || !apellido.trim() || !domicilio.trim()) {
      Alert.alert('Campos requeridos', 'Completá todos los campos para continuar.');
      return;
    }

    setLoading(true);
    try {
      // El contrato actual no expone un listado publico de paises.
      await authApi.etapa1({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        domicilioLegal: domicilio.trim(),
        idPaisOrigen: 32,
      });
      navigation.navigate('Identity', { email: email.trim() });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'No se pudo conectar con el servidor.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>

      <ScreenHeader onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <Text style={styles.title}>Registro de Datos</Text>
          <Text style={styles.subtitle}>Paso 1 de 3: Información personal</Text>

          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="nombre@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={colors.textSubtle}
          />

          <Text style={styles.label}>NOMBRE</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ingresá tu nombre"
            autoCorrect={false}
            placeholderTextColor={colors.textSubtle}
          />

          <Text style={styles.label}>APELLIDO</Text>
          <TextInput
            style={styles.input}
            value={apellido}
            onChangeText={setApellido}
            placeholder="Ingresá tu apellido"
            autoCorrect={false}
            placeholderTextColor={colors.textSubtle}
          />

          <Text style={styles.label}>DOMICILIO LEGAL</Text>
          <TextInput
            style={styles.input}
            value={domicilio}
            onChangeText={setDomicilio}
            placeholder="Calle, número, ciudad"
            autoCorrect={false}
            placeholderTextColor={colors.textSubtle}
          />

          <Text style={styles.label}>PAÍS DE ORIGEN</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value="Argentina"
            editable={false}
          />

          <View style={styles.spacer} />

          <TouchableOpacity style={styles.btn} activeOpacity={0.85} onPress={handleContinuar} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.btnText}>Continuar registro</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: 28, paddingBottom: spacing['2xl'] },
  title:    { fontSize: fontSize['4xl'], fontWeight: 'bold', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: fontSize.base, color: colors.textMuted, marginBottom: 28 },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textLabel, letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 14, height: 48,
    fontSize: fontSize.md, color: colors.text, marginBottom: 18,
  },
  inputDisabled: {
    backgroundColor: colors.surfaceMuted,
    color: colors.textMuted,
  },
  spacer: { flex: 1, minHeight: 20 },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.base, height: controlHeight.base,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, marginTop: spacing.md,
  },
  btnText: { color: colors.textInverse, fontSize: fontSize.lg, fontWeight: '600', textAlign: 'center' },
});
