import React, { useCallback, useEffect, useState } from 'react';
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
  BackHandler,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, radius, fontSize, controlHeight } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { authApi } from '../api/auth';
import { userFacingError } from '../api/client';
import { catalogosApi } from '../api/catalogos';
import { PaisCatalogo } from '../types/catalogos';
import { safeGoBack } from '../navigation/navigationUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [loading, setLoading] = useState(false);
  const [busquedaPais, setBusquedaPais] = useState('');
  const [paisSeleccionado, setPaisSeleccionado] = useState<PaisCatalogo | null>(
    null,
  );
  const [paises, setPaises] = useState<PaisCatalogo[]>([]);
  const [loadingPaises, setLoadingPaises] = useState(true);
  const [errorPaises, setErrorPaises] = useState<string | null>(null);
  const [dropdownPaisAbierto, setDropdownPaisAbierto] = useState(false);
  const [reintentoPaises, setReintentoPaises] = useState(0);

  const volverAlLogin = useCallback(() => {
    safeGoBack(navigation, () => {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    });
  }, [navigation]);

  const seleccionarPais = useCallback((pais: PaisCatalogo) => {
    setPaisSeleccionado(pais);
    setBusquedaPais('');
    setDropdownPaisAbierto(false);
  }, []);

  const cambiarBusquedaPais = useCallback((texto: string) => {
    setBusquedaPais(texto);
  }, []);

  const toggleDropdownPais = useCallback(() => {
    if (dropdownPaisAbierto) setBusquedaPais('');
    setDropdownPaisAbierto(!dropdownPaisAbierto);
  }, [dropdownPaisAbierto]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(
      async () => {
        setLoadingPaises(true);
        setErrorPaises(null);
        try {
          const response = await catalogosApi.buscarPaises(busquedaPais);
          if (active) setPaises(response.content);
        } catch (error) {
          if (!active) return;
          setPaises([]);
          setErrorPaises(readableError(error));
        } finally {
          if (active) setLoadingPaises(false);
        }
      },
      busquedaPais.trim() ? 300 : 0,
    );

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [busquedaPais, reintentoPaises]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        volverAlLogin();
        return true;
      },
    );

    return () => subscription.remove();
  }, [volverAlLogin]);

  async function handleContinuar() {
    if (
      !email.trim() ||
      !nombre.trim() ||
      !apellido.trim() ||
      !domicilio.trim()
    ) {
      Alert.alert(
        'Campos requeridos',
        'Completá todos los campos para continuar.',
      );
      return;
    }
    if (!paisSeleccionado) {
      Alert.alert(
        'País requerido',
        'Buscá y seleccioná un país de origen para continuar.',
      );
      return;
    }

    setLoading(true);
    try {
      await authApi.etapa1({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        domicilioLegal: domicilio.trim(),
        idPaisOrigen: paisSeleccionado.id,
      });
      navigation.navigate('Identity', { email: email.trim() });
    } catch (error) {
      Alert.alert('Error', readableError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={volverAlLogin} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Registro de Datos</Text>
          <Text style={styles.subtitle}>Paso 1 de 3: Información personal</Text>

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

          <Text style={styles.label}>NOMBRE</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ingresá tu nombre"
            autoCorrect={false}
            placeholderTextColor={colors.textSubtle}
          />

          <Text style={styles.label}>APELLIDO</Text>
          <TextInput
            style={styles.input}
            value={apellido}
            onChangeText={setApellido}
            placeholder="Ingresá tu apellido"
            autoCorrect={false}
            placeholderTextColor={colors.textSubtle}
          />

          <Text style={styles.label}>DOMICILIO LEGAL</Text>
          <TextInput
            style={styles.input}
            value={domicilio}
            onChangeText={setDomicilio}
            placeholder="Calle, número, ciudad"
            autoCorrect={false}
            placeholderTextColor={colors.textSubtle}
          />

          <Text style={styles.label}>PAÍS DE ORIGEN</Text>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={toggleDropdownPais}
            style={[
              styles.countryTrigger,
              dropdownPaisAbierto && styles.countryTriggerOpen,
            ]}
          >
            <View style={styles.countryTriggerText}>
              <Text
                style={
                  paisSeleccionado
                    ? styles.countryTriggerValue
                    : styles.countryTriggerPlaceholder
                }
              >
                {paisSeleccionado
                  ? `${paisSeleccionado.nombre}${
                      paisSeleccionado.nombreCorto
                        ? ` (${paisSeleccionado.nombreCorto})`
                        : ''
                    }`
                  : 'Seleccionar país de origen'}
              </Text>
              {paisSeleccionado?.nacionalidad ? (
                <Text style={styles.countryTriggerMeta}>
                  {paisSeleccionado.nacionalidad}
                </Text>
              ) : null}
            </View>
            <Text style={styles.countryTriggerAction}>
              {dropdownPaisAbierto ? 'Cerrar' : 'Abrir'}
            </Text>
          </TouchableOpacity>

          {dropdownPaisAbierto ? (
            <View style={styles.countryDropdown}>
              <TextInput
                style={styles.countrySearch}
                value={busquedaPais}
                onChangeText={cambiarBusquedaPais}
                placeholder="Buscá por nombre, código o nacionalidad"
                autoCorrect={false}
                autoFocus
                placeholderTextColor={colors.textSubtle}
              />
              {loadingPaises ? (
                <View style={styles.countryStatus}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.countryStatusText}>
                    Cargando paises...
                  </Text>
                </View>
              ) : errorPaises ? (
                <View style={styles.countryStatus}>
                  <Text style={styles.countryError}>{errorPaises}</Text>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => setReintentoPaises(value => value + 1)}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryText}>Reintentar</Text>
                  </TouchableOpacity>
                </View>
              ) : paises.length === 0 ? (
                <Text style={styles.countryStatusText}>
                  No encontramos paises para esa busqueda.
                </Text>
              ) : (
                <ScrollView
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                  style={styles.countryOptionsScroll}
                >
                  {paises.map(pais => (
                    <TouchableOpacity
                      key={pais.id}
                      activeOpacity={0.75}
                      onPress={() => seleccionarPais(pais)}
                      style={[
                        styles.countryOption,
                        paisSeleccionado?.id === pais.id &&
                          styles.countryOptionSelected,
                      ]}
                    >
                      <Text style={styles.countryName}>{pais.nombre}</Text>
                      <Text style={styles.countryMeta}>
                        {[pais.nombreCorto, pais.nacionalidad]
                          .filter(Boolean)
                          .join(' - ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : null}

          <View style={styles.spacer} />

          <TouchableOpacity
            style={[
              styles.btn,
              (!paisSeleccionado || loading) && styles.btnDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleContinuar}
            disabled={loading || !paisSeleccionado}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.btnText}>Continuar registro</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function readableError(error: unknown) {
  return userFacingError(
    error,
    'No se pudo cargar el catálogo de países. Probalo de nuevo en unos minutos.',
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 28,
    paddingBottom: spacing['2xl'],
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
  countryTrigger: {
    minHeight: 48,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countryTriggerOpen: { borderColor: colors.primary, marginBottom: spacing.sm },
  countryTriggerText: { flex: 1 },
  countryTriggerValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  countryTriggerPlaceholder: {
    fontSize: fontSize.md,
    color: colors.textSubtle,
  },
  countryTriggerMeta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  countryTriggerAction: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  countryDropdown: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  countrySearch: {
    height: 46,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  countryOptionsScroll: { maxHeight: 220 },
  countryOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  countryOptionSelected: { backgroundColor: colors.infoSoft },
  countryName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  countryMeta: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  countryStatus: {
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.sm,
  },
  countryStatusText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    padding: spacing.base,
    textAlign: 'center',
  },
  countryError: {
    color: colors.danger,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  spacer: { flex: 1, minHeight: 20 },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.base,
    height: controlHeight.base,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  btnDisabled: { backgroundColor: colors.textSubtle },
  btnText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
});
