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
import Svg, { Path, Circle } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const BLUE = '#0055D1';

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={BLUE}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GlobeIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#9CA3AF" strokeWidth="1.8" />
      <Path
        d="M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9M3 12h18"
        stroke="#9CA3AF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ChevronIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke="#9CA3AF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail]         = useState('');
  const [nombre, setNombre]       = useState('');
  const [apellido, setApellido]   = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [pais, setPais]           = useState('');

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.brand}>QuickBid</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">

          {/* Títulos */}
          <Text style={styles.title}>Registro de Datos</Text>
          <Text style={styles.subtitle}>Paso 1 de 3: Información personal</Text>

          {/* EMAIL */}
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="nombre@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#9CA3AF"
          />

          {/* NOMBRE */}
          <Text style={styles.label}>NOMBRE</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ingresá tu nombre"
            autoCorrect={false}
            placeholderTextColor="#9CA3AF"
          />

          {/* APELLIDO */}
          <Text style={styles.label}>APELLIDO</Text>
          <TextInput
            style={styles.input}
            value={apellido}
            onChangeText={setApellido}
            placeholder="Ingresá tu apellido"
            autoCorrect={false}
            placeholderTextColor="#9CA3AF"
          />

          {/* DOMICILIO LEGAL */}
          <Text style={styles.label}>DOMICILIO LEGAL</Text>
          <TextInput
            style={styles.input}
            value={domicilio}
            onChangeText={setDomicilio}
            placeholder="Calle, número, ciudad"
            autoCorrect={false}
            placeholderTextColor="#9CA3AF"
          />

          {/* PAÍS DE ORIGEN */}
          <Text style={styles.label}>PAÍS DE ORIGEN</Text>
          <TouchableOpacity style={styles.selectRow} activeOpacity={0.7}>
            <GlobeIcon />
            <Text style={[styles.selectText, pais ? styles.selectTextFilled : null]}>
              {pais || 'Elegí tu país'}
            </Text>
            <ChevronIcon />
          </TouchableOpacity>

          <View style={styles.spacer} />

          {/* Botón */}
          <TouchableOpacity style={styles.btn} activeOpacity={0.85} onPress={() => navigation.navigate('Identity')}>
            <Text style={styles.btnText}>Continuar registro</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  // Header
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
  backBtn: {
    padding: 2,
  },
  brand: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BLUE,
  },

  // Scroll
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },

  // Títulos
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 28,
  },

  // Inputs
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: '#111827',
    marginBottom: 18,
  },

  // Select país
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 18,
    gap: 10,
  },
  selectText: {
    flex: 1,
    fontSize: 15,
    color: '#9CA3AF',
  },
  selectTextFilled: {
    color: '#111827',
  },

  spacer: {
    flex: 1,
    minHeight: 20,
  },

  // Botón
  btn: {
    flexDirection: 'row',
    backgroundColor: BLUE,
    borderRadius: 10,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
