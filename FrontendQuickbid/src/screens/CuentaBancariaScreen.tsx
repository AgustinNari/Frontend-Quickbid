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

type Props = NativeStackScreenProps<RootStackParamList, 'CuentaBancaria'>;

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
            placeholderTextColor={colors.textSubtle}
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
            placeholderTextColor={colors.textSubtle}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>ENTIDAD BANCARIA</Text>
          <TextInput
            style={styles.input}
            value={entidad}
            onChangeText={setEntidad}
            placeholder="Mercado Pago"
            placeholderTextColor={colors.textSubtle}
            autoCorrect={false}
          />

          <Text style={styles.label}>CUIT / CUIL DEL TITULAR</Text>
          <TextInput
            style={styles.input}
            value={cuit}
            onChangeText={setCuit}
            placeholder="20-XXXXXXXX-X"
            placeholderTextColor={colors.textSubtle}
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

  btn: {
    backgroundColor: colors.primary, borderRadius: radius.base, height: controlHeight.base,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs,
  },
  btnText: { color: colors.textInverse, fontSize: fontSize.lg, fontWeight: '600' },
});
