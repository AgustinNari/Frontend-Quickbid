import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, { NavTab } from '../components/BottomNavBar';

type Props = NativeStackScreenProps<RootStackParamList, 'ChequeCertificado'>;
const BLUE = '#0055D1';

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UploadIcon() {
  return (
    <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <Path d="M12 16V4M8 8l4-4 4 4" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export default function ChequeCertificadoScreen({ navigation }: Props) {
  const [numero,   setNumero]   = useState('');
  const [banco,    setBanco]    = useState('');
  const [monto,    setMonto]    = useState('');
  const [fecha,    setFecha]    = useState('');
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

          <Text style={styles.title}>Cheque Certificado</Text>
          <Text style={styles.subtitle}>Pre-aprobación para depósitos físicos.</Text>

          <Text style={styles.label}>NÚMERO DE CHEQUE</Text>
          <TextInput
            style={styles.input}
            value={numero}
            onChangeText={setNumero}
            placeholder="Ej: 0000123456"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            autoCorrect={false}
          />

          <Text style={styles.label}>BANCO EMISOR</Text>
          <TextInput
            style={styles.input}
            value={banco}
            onChangeText={setBanco}
            placeholder="Ej: Banco Galicia"
            placeholderTextColor="#9CA3AF"
            autoCorrect={false}
          />

          <Text style={styles.label}>MONTO</Text>
          <TextInput
            style={styles.input}
            value={monto}
            onChangeText={setMonto}
            placeholder="Ej: 100.000"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            autoCorrect={false}
          />

          <Text style={styles.label}>FECHA DE VENCIMIENTO</Text>
          <TextInput
            style={styles.input}
            value={fecha}
            onChangeText={setFecha}
            placeholder="Ej: dd/mm/aaaa"
            placeholderTextColor="#9CA3AF"
            autoCorrect={false}
          />

          <Text style={styles.label}>FOTOS DEL CHEQUE (FRENTE Y DORSO)</Text>
          <TouchableOpacity style={styles.uploadBox} activeOpacity={0.7} onPress={() => {}}>
            <UploadIcon />
            <Text style={styles.uploadText}>Toca para subir imágenes</Text>
            <Text style={styles.uploadFormats}>Formatos aceptados: JPG o PNG</Text>
          </TouchableOpacity>

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

  uploadBox: {
    borderWidth: 1.5, borderColor: '#93C5FD', borderStyle: 'dashed',
    borderRadius: 10, paddingVertical: 28, alignItems: 'center',
    justifyContent: 'center', backgroundColor: '#F8FAFF', gap: 8, marginBottom: 24,
  },
  uploadText:    { fontSize: 15, fontWeight: '600', color: BLUE },
  uploadFormats: { fontSize: 12, color: '#9CA3AF' },

  btn: {
    backgroundColor: BLUE, borderRadius: 10, height: 52,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
