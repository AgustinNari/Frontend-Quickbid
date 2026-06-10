import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, fontSize, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RecuperarClaveLink'>;

export default function RecuperarClaveLinkScreen({ route, navigation }: Props) {
  useEffect(() => {
    const token = route.params?.token?.trim();
    if (token) {
      navigation.replace('Security', { mode: 'recuperacion', token });
      return;
    }

    Alert.alert(
      'Enlace incompleto',
      'El enlace de recuperacion no incluye un token valido. Podes pedir un nuevo enlace o pegar el token manualmente.',
      [
        {
          text: 'Continuar',
          onPress: () => navigation.replace('RecuperacionCuenta'),
        },
      ],
    );
  }, [navigation, route.params?.token]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.text}>Abriendo recuperacion...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  text: {
    marginTop: spacing.base,
    color: colors.textMuted,
    fontSize: fontSize.base,
  },
});
