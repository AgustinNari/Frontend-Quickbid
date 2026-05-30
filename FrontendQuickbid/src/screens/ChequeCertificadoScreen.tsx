import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, { NavTab } from '../components/BottomNavBar';
import { colors, spacing, radius, fontSize, controlHeight } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ChequeCertificado'>;

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UploadIcon() {
  return (
    <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <Path d="M12 16V4M8 8l4-4 4 4" stroke={colors.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={colors.primary} strokeWidth="1.8" strokeLinecap="round" />
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
            placeholderTextColor={colors.textSubtle}
            keyboardType="numeric"
            autoCorrect={false}
          />

          <Text style={styles.label}>BANCO EMISOR</Text>
          <TextInput
            style={styles.input}
            value={banco}
            onChangeText={setBanco}
            placeholder="Ej: Banco Galicia"
            placeholderTextColor={colors.textSubtle}
            autoCorrect={false}
          />

          <Text style={styles.label}>MONTO</Text>
          <TextInput
            style={styles.input}
            value={monto}
            onChangeText={setMonto}
            placeholder="Ej: 100.000"
            placeholderTextColor={colors.textSubtle}
            keyboardType="numeric"
            autoCorrect={false}
          />

          <Text style={styles.label}>FECHA DE VENCIMIENTO</Text>
          <TextInput
            style={styles.input}
            value={fecha}
            onChangeText={setFecha}
            placeholder="Ej: dd/mm/aaaa"
            placeholderTextColor={colors.textSubtle}
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
  safe:   { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, paddingHorizontal: spacing.base, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.borderMuted, gap: spacing.xs,
  },
  backBtn: { padding: 2 },
  brand:   { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.primary },

  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: 28, paddingBottom: spacing.xl },

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

  uploadBox: {
    borderWidth: 1.5, borderColor: '#93C5FD', borderStyle: 'dashed',
    borderRadius: radius.base, paddingVertical: 28, alignItems: 'center',
    justifyContent: 'center', backgroundColor: '#F8FAFF', gap: spacing.xs, marginBottom: spacing.xl,
  },
  uploadText:    { fontSize: fontSize.md, fontWeight: '600', color: colors.primary },
  uploadFormats: { fontSize: fontSize.sm, color: colors.textSubtle },

  btn: {
    backgroundColor: colors.primary, borderRadius: radius.base, height: controlHeight.base,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: colors.textInverse, fontSize: fontSize.lg, fontWeight: '600' },
});
