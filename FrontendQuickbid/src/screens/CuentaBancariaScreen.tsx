import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, { NavTab, BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { colors, spacing, radius, fontSize, controlHeight } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { mediosPagoApi } from '../api/mediosPago';
import { ApiError } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'CuentaBancaria'>;

export default function CuentaBancariaScreen({ navigation }: Props) {
  const [cbu,      setCbu]      = useState('');
  const [alias,    setAlias]    = useState('');
  const [entidad,  setEntidad]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [activeTab,setActiveTab]= useState<NavTab>('subastas');

  async function handleEnviar() {
    if (!cbu.trim() || !entidad.trim()) {
      Alert.alert('Campos requeridos', 'Completá el CBU/CVU y la entidad bancaria.');
      return;
    }
    const digitos = cbu.replace(/\D/g, '');
    if (digitos.length !== 22) {
      Alert.alert('CBU/CVU inválido', 'Debe tener exactamente 22 dígitos.');
      return;
    }
    setLoading(true);
    try {
      await mediosPagoApi.crear({
        tipo: 'cuenta_bancaria',
        moneda: 'ARS',
        numeroCuenta: digitos,
        nombreBanco: entidad.trim(),
        alias: alias.trim() || undefined,
        nacional: true,
      });
      navigation.navigate('ValidandoPago');
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

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll}>

          <Text style={styles.title}>Cuenta Bancaria</Text>
          <Text style={styles.subtitle}>
            Ingresá los datos para realizar y recibir transferencias.
          </Text>

          <Text style={styles.label}>CBU O CVU (22 DÍGITOS)</Text>
          <TextInput
            style={styles.input}
            value={cbu}
            onChangeText={v => setCbu(v.replace(/\D/g, '').slice(0, 22))}
            placeholder="Ej: 0140000000000000000000"
            placeholderTextColor={colors.textSubtle}
            keyboardType="numeric"
            maxLength={22}
            autoCorrect={false}
          />

          <Text style={styles.label}>ENTIDAD BANCARIA</Text>
          <TextInput
            style={styles.input}
            value={entidad}
            onChangeText={setEntidad}
            placeholder="Ej: Banco Galicia"
            placeholderTextColor={colors.textSubtle}
            autoCorrect={false}
          />

          <Text style={styles.label}>ALIAS BANCARIO (OPCIONAL)</Text>
          <TextInput
            style={styles.input}
            value={alias}
            onChangeText={setAlias}
            placeholder="juan.perez.mp"
            placeholderTextColor={colors.textSubtle}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={{ flex: 1, minHeight: 24 }} />

          <TouchableOpacity style={styles.btn} activeOpacity={0.85} onPress={handleEnviar} disabled={loading}>
            {loading
              ? <ActivityIndicator color={colors.textInverse} />
              : <Text style={styles.btnText}>Enviar para verificación</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.white },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: 28, paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg },

  title:    { fontSize: fontSize['4xl'], fontWeight: 'bold', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: fontSize.base, color: colors.textMuted, marginBottom: 28 },

  label: {
    fontSize: fontSize.sm, fontWeight: '600', color: colors.textLabel,
    letterSpacing: 0.5, marginBottom: 6,
  },
  input: {
    backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 14, height: 48,
    fontSize: fontSize.md, color: colors.text, marginBottom: 18,
  },

  btn: {
    backgroundColor: colors.primary, borderRadius: radius.base, height: controlHeight.base,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs,
  },
  btnText: { color: colors.textInverse, fontSize: fontSize.lg, fontWeight: '600' },
});
