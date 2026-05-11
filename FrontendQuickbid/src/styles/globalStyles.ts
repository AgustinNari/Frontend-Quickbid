import { StyleSheet } from 'react-native';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#20232a',
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#61dafb',
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 20,
  },

  input: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
});