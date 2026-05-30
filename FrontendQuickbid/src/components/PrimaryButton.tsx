import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import { colors, radius, spacing, fontSize, controlHeight } from '../theme';

type Props = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
};

export default function PrimaryButton({ title, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.base,
    marginVertical: spacing.xs,
    width: '100%',
    height: controlHeight.base,
    alignItems: 'center',
    justifyContent: 'center',
  },

  text: {
    color: colors.textInverse,
    fontWeight: 'bold',
    fontSize: fontSize.lg,
  },
});