import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, { NavTab } from '../components/BottomNavBar';

type Props = NativeStackScreenProps<RootStackParamList, 'NuevaTarjeta'>;
const BLUE = '#0055D1';

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MiniCardIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke="#9CA3AF" strokeWidth="1.6" />
      <Path d="M2 10h20" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export default function NuevaTarjetaScreen({ navigation }: Props) {
  const [nombre,     setNombre]     = useState('');
  const [numero,     setNumero]     = useState('');
  const [vencimiento,setVencimiento]= useState('');
  const [cvv,        setCvv]        = useState('');
  const [activeTab,  setActiveTab]  = useState<NavTab>('subastas');

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

          <Text style={styles.title}>Nueva tarjeta</Text>
          <Text style={styles.subtitle}>Vincule una tarjeta de crédito o débito.</Text>

          <Text style={styles.label}>NOMBRE EN LA TARJETA</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Juan Perez"
            placeholderTextColor="#9CA3AF"
            autoCorrect={false}
          />

          <Text style={styles.label}>NÚMERO DE TARJETA</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.inputFlex}
              value={numero}
              onChangeText={setNumero}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor="#9CA3AF"
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
                onChangeText={setVencimiento}
                placeholder="MM / YY"
                placeholderTextColor="#9CA3AF"
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
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>

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
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1,
    borderColor: '#D1D5DB', paddingHorizontal: 14, height: 48,
    marginBottom: 18, gap: 8,
  },
  inputFlex: { flex: 1, fontSize: 15, color: '#111827', padding: 0 },

  row:      { flexDirection: 'row', gap: 12 },
  halfWrap: { flex: 1 },

  btn: {
    backgroundColor: BLUE, borderRadius: 10, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
