import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, { NavTab, BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { colors, spacing, radius, fontSize, controlHeight } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { mediosPagoApi } from '../api/mediosPago';
import { ApiError } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'NuevaTarjeta'>;

function MiniCardIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={colors.textSubtle} strokeWidth="1.6" />
      <Path d="M2 10h20" stroke={colors.textSubtle} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function formatNumero(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatVencimiento(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

export default function NuevaTarjetaScreen({ navigation }: Props) {
  const [nombre,     setNombre]     = useState('');
  const [numero,     setNumero]     = useState('');
  const [vencimiento,setVencimiento]= useState('');
  const [cvv,        setCvv]        = useState('');
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS');
  const [nacional, setNacional] = useState(true);
  const [tipo,       setTipo]       = useState<'tarjeta_credito' | 'tarjeta_debito'>('tarjeta_credito');
  const [loading,    setLoading]    = useState(false);
  const [activeTab,  setActiveTab]  = useState<NavTab>('subastas');

  async function handleEnviar() {
    if (!nombre.trim() || !numero.trim() || !vencimiento.trim() || !cvv.trim()) {
      Alert.alert('Campos requeridos', 'Completá todos los campos.');
      return;
    }
    const digitos = numero.replace(/\s/g, '');
    if (digitos.length !== 16) {
      Alert.alert('Número inválido', 'El número debe tener 16 dígitos.');
      return;
    }
    if (cvv.length < 3) {
      Alert.alert('CVV inválido', 'El CVV debe tener 3 dígitos.');
      return;
    }
    const [mm, aa] = vencimiento.split('/');
    const mes = parseInt(mm, 10);
    const anio = parseInt('20' + aa, 10);
    const hoy = new Date();
    if (!mm || !aa || aa.length !== 2 || mes < 1 || mes > 12) {
      Alert.alert('Vencimiento inválido', 'Usá el formato MM/AA.');
      return;
    }
    if (anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth() + 1)) {
      Alert.alert('Tarjeta vencida', 'La fecha de vencimiento ya pasó.');
      return;
    }
    setLoading(true);
    try {
      await mediosPagoApi.crear({
        tipo: 'tarjeta',
        moneda,
        titular: nombre.trim(),
        numeroTarjeta: digitos,
        cvv: cvv.trim(),
        vencimientoMes: mes,
        vencimientoAnio: anio,
        marca: tipo === 'tarjeta_credito' ? 'Credito/Debito' : 'Debito',
        nacional,
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

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll}>

          <Text style={styles.title}>Nueva tarjeta</Text>
          <Text style={styles.subtitle}>Vincule una tarjeta de crédito o débito.</Text>

          <Text style={styles.label}>TIPO</Text>
          <View style={styles.segRow}>
            {(['tarjeta_credito', 'tarjeta_debito'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.seg, tipo === t && styles.segActive]}
                onPress={() => setTipo(t)}
                activeOpacity={0.8}>
                <Text style={[styles.segText, tipo === t && styles.segTextActive]}>
                  {t === 'tarjeta_credito' ? 'Crédito' : 'Débito'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>MONEDA</Text>
          <View style={styles.segRow}>
            {(['ARS', 'USD'] as const).map(value => <TouchableOpacity key={value} style={[styles.seg, moneda === value && styles.segActive]} onPress={() => setMoneda(value)}><Text style={[styles.segText, moneda === value && styles.segTextActive]}>{value}</Text></TouchableOpacity>)}
          </View>
          <Text style={styles.label}>ORIGEN</Text>
          <View style={styles.segRow}>
            {[true, false].map(value => <TouchableOpacity key={String(value)} style={[styles.seg, nacional === value && styles.segActive]} onPress={() => setNacional(value)}><Text style={[styles.segText, nacional === value && styles.segTextActive]}>{value ? 'Nacional' : 'Extranjera'}</Text></TouchableOpacity>)}
          </View>

          <Text style={styles.label}>NOMBRE EN LA TARJETA</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Juan Perez"
            placeholderTextColor={colors.textSubtle}
            autoCorrect={false}
          />

          <Text style={styles.label}>NÚMERO DE TARJETA</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.inputFlex}
              value={numero}
              onChangeText={v => setNumero(formatNumero(v))}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor={colors.textSubtle}
              keyboardType="numeric"
              maxLength={19}
            />
            <MiniCardIcon />
          </View>

          <View style={styles.row}>
            <View style={styles.halfWrap}>
              <Text style={styles.label}>VENCIMIENTO</Text>
              <TextInput
                style={styles.input}
                value={vencimiento}
                onChangeText={v => setVencimiento(formatVencimiento(v))}
                placeholder="MM/AA"
                placeholderTextColor={colors.textSubtle}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
            <View style={styles.halfWrap}>
              <Text style={styles.label}>CVV</Text>
              <TextInput
                style={styles.input}
                value={cvv}
                onChangeText={setCvv}
                placeholder="000"
                placeholderTextColor={colors.textSubtle}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.spacer} />

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
  flex: { flex: 1 },
  spacer: { flex: 1, minHeight: 24 },
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
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 14, height: 48,
    marginBottom: 18, gap: spacing.xs,
  },
  inputFlex: { flex: 1, fontSize: fontSize.md, color: colors.text, padding: 0 },

  row:      { flexDirection: 'row', gap: spacing.md },
  halfWrap: { flex: 1 },

  segRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: 18 },
  seg: {
    flex: 1, height: 40, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.borderMuted,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white,
  },
  segActive: { borderColor: colors.primary, backgroundColor: colors.infoSoft },
  segText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted },
  segTextActive: { color: colors.primary },

  btn: {
    backgroundColor: colors.primary, borderRadius: radius.base, height: controlHeight.base,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs,
  },
  btnText: { color: colors.textInverse, fontSize: fontSize.lg, fontWeight: '600' },
});
