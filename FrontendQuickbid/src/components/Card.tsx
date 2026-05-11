import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  title: string;
  description: string;
};

export default function Card({ title, description }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2d333b',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    width: '100%',
  },

  title: {
    color: '#61dafb',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  description: {
    color: '#fff',
    fontSize: 15,
  },
});