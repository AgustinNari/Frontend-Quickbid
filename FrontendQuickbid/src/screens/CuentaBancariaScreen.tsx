import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, { NavTab } from '../components/BottomNavBar';

type Props = NativeStackScreenProps<RootStackParamList, 'CuentaBancaria'>;
const BLUE = '#0055D1';

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function CuentaBancariaScreen({ navigation }: Props) {
  const [cbu,      setCbu]      = useState('');
  const [alias,    setAlias]    = useState('');
  const [entidad,  setEntidad]  = useState('');
  const [cuit,     setCuit]     = useState('');
  const [activeTab,setActiveTab]= useState<NavTab>('subastas');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.brand}>QuickBid</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll}>

          <Text style={styles.title}>Cuenta Bancaria</Text>
          <Text style={styles.subtitle}>
            Ingresa los datos para realizar y recibir transferencias.
          </Text>

          <Text style={styles.label}>CBU O CVU (22 DÍGITOS)</Text>
          <TextInput
            style={styles.input}
            value={cbu}
            onChangeText={setCbu}
            placeholder="Ej: 0140000000000000000000"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            maxLength={22}
            autoCorrect={false}
          />

          <Text style={styles.label}>ALIAS BANCARIO (OPCIONAL)</Text>
          <TextInput
            style={styles.input}
            value={alias}
            onChangeText={setAlias}
            placeholder="juan.perez.mp"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>ENTIDAD BANCARIA</Text>
          <TextInput
            style={styles.input}
            value={entidad}
            onChangeText={setEntidad}
            placeholder="Mercado Pago"
            placeholderTextColor="#9CA3AF"
            autoCorrect={false}
          />

          <Text style={styles.label}>CUIT / CUIL DEL TITULAR</Text>
          <TextInput
            style={styles.input}
            value={cuit}
            onChangeText={setCuit}
            placeholder="20-XXXXXXXX-X"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            autoCorrect={false}
          />

          <View style={{ flex: 1, minHeight: 24 }} />

          <TouchableOpacity style={styles.btn} activeOpacity={0.85} onPress={() => navigation.navigate('ValidandoPago')}>
            <Text style={styles.btnText}>Enviar para verificación</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 8,
  },
  backBtn: { padding: 2 },
  brand:   { fontSize: 18, fontWeight: 'bold', color: BLUE },

  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 },

  title:    { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 28 },

  label: {
    fontSize: 12, fontWeight: '600', color: '#374151',
    letterSpacing: 0.5, marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1,
    borderColor: '#D1D5DB', paddingHorizontal: 14, height: 48,
    fontSize: 15, color: '#111827', marginBottom: 18,
  },

  btn: {
    backgroundColor: BLUE, borderRadius: 10, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
