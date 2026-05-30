import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';

import { colors, spacing, radius, fontSize } from '../theme';

const data = [
  { id: '1', title: 'Elemento 1' },
  { id: '2', title: 'Elemento 2' },
  { id: '3', title: 'Elemento 3' },
  { id: '4', title: 'Elemento 4' },
  { id: '5', title: 'Elemento 5' },
];

export default function DetailsScreen() {
  return (
    <View style={styles.container}>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: {
    color: colors.primary,
    fontSize: fontSize['3xl'],
    fontWeight: 'bold',
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  item: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemText: {
    color: colors.text,
    fontSize: fontSize.xl,
  },
});