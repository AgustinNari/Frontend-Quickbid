import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, { NavTab, BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { colors, spacing, radius, fontSize, controlHeight } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'NuevaTarjeta'>;

function MiniCardIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={colors.textSubtle} strokeWidth="1.6" />
      <Path d="M2 10h20" stroke={colors.textSubtle} strokeWidth="1.6" strokeLinecap="round" />
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
      <ScreenHeader onBack={() => navigation.goBack()} />

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
            placeholderTextColor={colors.textSubtle}
            autoCorrect={false}
          />

          <Text style={styles.label}>NÚMERO DE TARJETA</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.inputFlex}
              value={numero}
              onChangeText={setNumero}
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
                onChangeText={setVencimiento}
                placeholder="MM / YY"
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

          <View style={{ flex: 1, minHeight: 24 }} />

          <TouchableOpacity style={styles.btn} activeOpacity={0.85} onPress={() => navigation.navigate('ValidandoPago')}>
            <Text style={styles.btnText}>Enviar para verificación</Text>
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
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 14, height: 48,
    marginBottom: 18, gap: spacing.xs,
  },
  inputFlex: { flex: 1, fontSize: fontSize.md, color: colors.text, padding: 0 },

  row:      { flexDirection: 'row', gap: spacing.md },
  halfWrap: { flex: 1 },

  btn: {
    backgroundColor: colors.primary, borderRadius: radius.base, height: controlHeight.base,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs,
  },
  btnText: { color: colors.textInverse, fontSize: fontSize.lg, fontWeight: '600' },
});
