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
import { colors, spacing, radius, fontSize, controlHeight } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={colors.primary}
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
      <Circle cx="12" cy="12" r="9" stroke={colors.textSubtle} strokeWidth="1.8" />
      <Path
        d="M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9M3 12h18"
        stroke={colors.textSubtle}
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
        stroke={colors.textSubtle}
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
            placeholderTextColor={colors.textSubtle}
          />

          {/* NOMBRE */}
          <Text style={styles.label}>NOMBRE</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ingresá tu nombre"
            autoCorrect={false}
            placeholderTextColor={colors.textSubtle}
          />

          {/* APELLIDO */}
          <Text style={styles.label}>APELLIDO</Text>
          <TextInput
            style={styles.input}
            value={apellido}
            onChangeText={setApellido}
            placeholder="Ingresá tu apellido"
            autoCorrect={false}
            placeholderTextColor={colors.textSubtle}
          />

          {/* DOMICILIO LEGAL */}
          <Text style={styles.label}>DOMICILIO LEGAL</Text>
          <TextInput
            style={styles.input}
            value={domicilio}
            onChangeText={setDomicilio}
            placeholder="Calle, número, ciudad"
            autoCorrect={false}
            placeholderTextColor={colors.textSubtle}
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
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
    gap: spacing.xs,
  },
  backBtn: {
    padding: 2,
  },
  brand: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Scroll
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 28,
    paddingBottom: spacing['2xl'],
  },

  // Títulos
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    marginBottom: 28,
  },

  // Inputs
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textLabel,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 48,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: 18,
  },

  // Select país
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 18,
    gap: 10,
  },
  selectText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textSubtle,
  },
  selectTextFilled: {
    color: colors.text,
  },

  spacer: {
    flex: 1,
    minHeight: 20,
  },

  // Botón
  btn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radius.base,
    height: controlHeight.base,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  btnText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
});
