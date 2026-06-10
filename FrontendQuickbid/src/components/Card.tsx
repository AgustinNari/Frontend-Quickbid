import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSize } from '../theme';

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
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },

  title: {
    color: colors.primary,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },

  description: {
    color: colors.text,
    fontSize: fontSize.md,
  },
});
