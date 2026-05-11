import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';

import { globalStyles } from '../styles/globalStyles';

const data = [
  { id: '1', title: 'Elemento 1' },
  { id: '2', title: 'Elemento 2' },
  { id: '3', title: 'Elemento 3' },
  { id: '4', title: 'Elemento 4' },
  { id: '5', title: 'Elemento 5' },
];

export default function DetailsScreen() {
  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          📋 Lista de prueba
        </Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>
              {item.title}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    alignItems: 'center',
  },

  title: {
    color: '#61dafb',
    fontSize: 28,
    fontWeight: 'bold',
  },

  list: {
    paddingHorizontal: 20,
  },

  item: {
    backgroundColor: '#2d333b',
    padding: 20,
    borderRadius: 10,
    marginBottom: 12,
  },

  itemText: {
    color: '#fff',
    fontSize: 18,
  },
});