import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../App';

import { colors, spacing, radius, fontSize } from '../theme';

import PrimaryButton from '../components/PrimaryButton';
import Card from '../components/Card';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [name, setName] = useState('');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.centerContainer}>
        <View style={styles.statusBanner}>
          <Text style={styles.statusText}>
            ✅ APP FUNCIONANDO
          </Text>
        </View>

        <Text style={styles.title}>
          🚀 QuickBid
        </Text>

        <Text style={styles.subtitle}>
          Pantalla principal de prueba
        </Text>

        <TextInput
          placeholder="Escribí algo..."
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

        <PrimaryButton
          title="Mostrar Alert"
          onPress={() => Alert.alert('Texto ingresado', name || 'Vacío')}
        />

        <PrimaryButton
          title="Ir a Details"
          onPress={() => navigation.navigate('Details')}
        />

        <Card title="Card 1" description="Esto es una card de prueba." />
        <Card title="Card 2" description="Ideal para probar UI rápido." />
        <Card title="Card 3" description="Después la reemplazás por datos reales." />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  statusBanner: {
    backgroundColor: colors.primaryLight,
    padding: spacing.base,
    borderRadius: radius.sm,
    marginBottom: spacing.base,
    width: '100%',
  },
  statusText: {
    color: colors.textInverse,
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    textAlign: 'center',
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  input: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.base,
    marginBottom: spacing.md,
    fontSize: fontSize.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
});