import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';

type Props = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
};

export default function PrimaryButton({ title, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#61dafb',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 8,
    width: '100%',
    alignItems: 'center',
  },

  text: {
    color: '#20232a',
    fontWeight: 'bold',
    fontSize: 16,
  },
});