import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { authApi } from '../api/auth';
import { ApiError } from '../api/client';
import { ScreenHeader } from '../components/ScreenHeader';
import { Body, Button, Heading, Icon, TextField } from '../ui';
import { colors, layout, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CambiarClave'>;

export default function CambiarClaveScreen({ navigation }: Props) {
  const [claveActual, setClaveActual] = useState('');
  const [claveNueva, setClaveNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!claveActual.trim() || !claveNueva.trim() || !confirmacion.trim()) {
      Alert.alert(
        'Campos requeridos',
        'Completa los tres campos para continuar.',
      );
      return;
    }
    if (!PASSWORD_POLICY.test(claveNueva)) {
      Alert.alert(
        'Clave no valida',
        'Usa al menos 8 caracteres, con mayuscula, minuscula, numero y simbolo.',
      );
      return;
    }
    if (claveNueva !== confirmacion) {
      Alert.alert(
        'Las claves no coinciden',
        'Verifica que la nueva contrasena y su confirmacion sean iguales.',
      );
      return;
    }

    setLoading(true);
    try {
      await authApi.cambiarClaveAutenticado(
        claveActual,
        claveNueva,
        confirmacion,
      );
      setClaveActual('');
      setClaveNueva('');
      setConfirmacion('');
      Alert.alert(
        'Clave actualizada',
        'Tu contrasena fue cambiada y tu sesion sigue activa.',
        [{ text: 'Aceptar', onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'No se pudo actualizar la contrasena.';
      Alert.alert('No se pudo cambiar la clave', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Heading>Cambiar contrasena</Heading>
          <Body muted style={styles.subtitle}>
            Ingresa tu clave actual y elegi una nueva. Tu sesion permanecera
            activa.
          </Body>

          <TextField
            label="CLAVE ACTUAL"
            value={claveActual}
            onChangeText={setClaveActual}
            secureTextEntry
            leftIcon={<Icon name="lock" color={colors.textSubtle} />}
          />
          <TextField
            label="NUEVA CLAVE"
            value={claveNueva}
            onChangeText={setClaveNueva}
            secureTextEntry
            helperText="Minimo 8 caracteres, con mayuscula, minuscula, numero y simbolo."
            leftIcon={<Icon name="lock" color={colors.textSubtle} />}
          />
          <TextField
            label="CONFIRMAR NUEVA CLAVE"
            value={confirmacion}
            onChangeText={setConfirmacion}
            secureTextEntry
            leftIcon={<Icon name="lock" color={colors.textSubtle} />}
          />

          <Button onPress={submit} loading={loading}>
            Actualizar clave
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
});

const PASSWORD_POLICY =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
