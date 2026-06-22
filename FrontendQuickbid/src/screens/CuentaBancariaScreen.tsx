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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, {
  NavTab,
  BOTTOM_NAV_HEIGHT,
} from '../components/BottomNavBar';
import { colors, spacing, radius, fontSize, controlHeight } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { mediosPagoApi } from '../api/mediosPago';
import { ApiError } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'CuentaBancaria'>;

export default function CuentaBancariaScreen({ navigation }: Props) {
  const [titular, setTitular] = useState('');
  const [cbu, setCbu] = useState('');
  const [alias, setAlias] = useState('');
  const [entidad, setEntidad] = useState('');
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS');
  const [nacional, setNacional] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('subastas');

  async function handleEnviar() {
    if (!titular.trim() || !cbu.trim() || !entidad.trim()) {
      Alert.alert(
        'Campos requeridos',
        'Completá titular, CBU/CVU y entidad bancaria.',
      );
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
        moneda,
        titular: titular.trim(),
        cbuCvu: digitos,
        nombreBanco: entidad.trim(),
        alias: alias.trim() || undefined,
        nacional,
      });
      navigation.navigate('ValidandoPago');
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : 'No se pudo contactar a QuickBid. Revisá tu conexión e intentá nuevamente.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Cuenta Bancaria</Text>
          <Text style={styles.subtitle}>
            Ingresá los datos para realizar y recibir transferencias.
          </Text>

          <Text style={styles.label}>TITULAR</Text>
          <TextInput
            style={styles.input}
            value={titular}
            onChangeText={setTitular}
            placeholder="Titular de la cuenta"
            placeholderTextColor={colors.textSubtle}
          />

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

          <Choice
            label="MONEDA"
            values={['ARS', 'USD']}
            selected={moneda}
            onSelect={value => setMoneda(value as 'ARS' | 'USD')}
          />
          <Choice
            label="ORIGEN"
            values={['Nacional', 'Extranjera']}
            selected={nacional ? 'Nacional' : 'Extranjera'}
            onSelect={value => setNacional(value === 'Nacional')}
          />

          <View style={styles.spacer} />

          <TouchableOpacity
            style={styles.btn}
            activeOpacity={0.85}
            onPress={handleEnviar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.btnText}>Enviar para verificación</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomNavBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

function Choice({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string;
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choiceRow}>
        {values.map(value => (
          <TouchableOpacity
            key={value}
            style={[styles.choice, selected === value && styles.choiceActive]}
            onPress={() => onSelect(value)}
          >
            <Text
              style={[
                styles.choiceText,
                selected === value && styles.choiceTextActive,
              ]}
            >
              {value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  spacer: { flex: 1, minHeight: 24 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 28,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg,
  },

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
  choiceRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: 18 },
  choice: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceActive: {
    borderColor: colors.primary,
    backgroundColor: colors.infoSoft,
  },
  choiceText: { color: colors.textMuted, fontWeight: '600' },
  choiceTextActive: { color: colors.primary },

  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.base,
    height: controlHeight.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  btnText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
});
