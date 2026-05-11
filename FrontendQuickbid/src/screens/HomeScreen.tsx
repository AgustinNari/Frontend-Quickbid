import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../App';

import { globalStyles } from '../styles/globalStyles';

import PrimaryButton from '../components/PrimaryButton';
import Card from '../components/Card';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [name, setName] = useState('');

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.centerContainer}>
        <Text style={globalStyles.title}>
          🚀 QuickBid
        </Text>

        <Text style={globalStyles.subtitle}>
          Pantalla principal de prueba
        </Text>

        <TextInput
          placeholder="Escribí algo..."
          placeholderTextColor="#888"
          style={globalStyles.input}
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

        <Card
          title="Card 1"
          description="Esto es una card de prueba."
        />

        <Card
          title="Card 2"
          description="Ideal para probar UI rápido."
        />

        <Card
          title="Card 3"
          description="Después la reemplazás por datos reales."
        />
      </View>
    </ScrollView>
  );
}