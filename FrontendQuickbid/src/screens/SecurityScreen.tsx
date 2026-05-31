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
import Svg, { Path } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, radius, fontSize, controlHeight } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { authApi } from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Security'>;

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      {visible ? (
        <>
          <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={colors.textSubtle} strokeWidth="1.8" />
          <Path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" stroke={colors.textSubtle} strokeWidth="1.8" />
        </>
      ) : (
        <>
          <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke={colors.textSubtle} strokeWidth="1.8" strokeLinecap="round" />
          <Path d="M1 1l22 22" stroke={colors.textSubtle} strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

export default function SecurityScreen({ route, navigation }: Props) {
  const { login } = useAuth();
  const params = route.params;

  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const isRegistro = params.mode === 'registro';

  async function handleConfirmar() {
    if (!password.trim() || !confirm.trim()) {
      Alert.alert('Campos requeridos', 'Completá ambos campos.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Clave muy corta', 'La clave debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Las claves no coinciden', 'Verificá que ambas contraseñas sean iguales.');
      return;
    }

    setLoading(true);
    try {
      if (isRegistro) {
        // Flujo de registro — etapa3 usa setupToken
        const setupToken = (params as { mode: 'registro'; setupToken: string }).setupToken;
        const res = await authApi.etapa3({ setupToken, clave: password, claveConfirmacion: confirm });
        if (!res.data) throw new Error('Respuesta inválida del servidor.');
        login(res.data);
        navigation.reset({ index: 0, routes: [{ name: 'Subastas' }] });
      } else {
        // Flujo de recuperación — cambiarClave
        await authApi.cambiarClave((params as { mode: 'recuperacion'; token: string }).token, password, confirm);
        Alert.alert(
          'Clave actualizada',
          'Tu contraseña fue cambiada. Iniciá sesión.',
          [{ text: 'Ir al Login', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }],
        );
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'No se pudo conectar con el servidor.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>

      <ScreenHeader onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <Text style={styles.title}>{isRegistro ? 'Nueva Clave' : 'Cambiar Clave'}</Text>
          <Text style={styles.subtitle}>
            {isRegistro ? 'Paso 3 de 3: Creá una contraseña segura para tu cuenta.' : 'Ingresá tu nueva contraseña.'}
          </Text>

          <Text style={styles.label}>NUEVA CONTRASEÑA</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              placeholder="••••••••"
              placeholderTextColor={colors.textSubtle}
            />
            <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
              <EyeIcon visible={showPass} />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Mínimo 8 caracteres.</Text>

          <Text style={styles.label}>REPETIR CONTRASEÑA</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showConf}
              placeholder="••••••••"
              placeholderTextColor={colors.textSubtle}
            />
            <TouchableOpacity onPress={() => setShowConf(v => !v)} style={styles.eyeBtn}>
              <EyeIcon visible={showConf} />
            </TouchableOpacity>
          </View>

          <View style={styles.spacer} />

          <TouchableOpacity style={styles.btn} activeOpacity={0.85} onPress={handleConfirmar} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.btnText}>{isRegistro ? 'Finalizar registro' : 'Actualizar clave'}</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: 28, paddingBottom: spacing['2xl'] },
  title:    { fontSize: fontSize['4xl'], fontWeight: 'bold', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: fontSize.base, color: colors.textMuted, marginBottom: 28 },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textLabel, letterSpacing: 0.5, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, height: 48, marginBottom: spacing.xs,
  },
  input:   { flex: 1, fontSize: fontSize.md, color: colors.text, padding: 0 },
  eyeBtn:  { padding: 4 },
  hint:    { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.lg },
  spacer:  { flex: 1, minHeight: 20 },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.base, height: controlHeight.base,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.base,
  },
  btnText: { color: colors.textInverse, fontSize: fontSize.lg, fontWeight: '600' },
});
