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

type Props = NativeStackScreenProps<
  RootStackParamList,
  'CompletarRegistroLink'
>;

export default function CompletarRegistroLinkScreen({
  route,
  navigation,
}: Props) {
  useEffect(() => {
    const token = route.params?.token?.trim();
    if (token) {
      navigation.replace('Security', { mode: 'registro', setupToken: token });
      return;
    }

    Alert.alert(
      'Enlace incompleto',
      'El enlace de registro no incluye un token valido. Podes pedir un nuevo enlace o pegar el token manualmente.',
      [
        {
          text: 'Continuar',
          onPress: () => navigation.replace('EnlaceRegistro'),
        },
      ],
    );
  }, [navigation, route.params?.token]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.text}>Abriendo registro...</Text>
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
