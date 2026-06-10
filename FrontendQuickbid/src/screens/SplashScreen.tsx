import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { isAuthenticated, isGuest, isRestoring, estadoCuenta } = useAuth();

  useEffect(() => {
    if (isRestoring) return;
    const timer = setTimeout(() => {
      if (isAuthenticated && estadoCuenta === 'bloqueada_permanente') {
        navigation.replace('LimitedAccess');
      } else if (isAuthenticated || isGuest) {
        navigation.replace('Subastas');
      } else {
        navigation.replace('Login');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isRestoring, isAuthenticated, isGuest, estadoCuenta, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.white} barStyle="dark-content" />

      <Image
        source={require('../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.loadingBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  logo: {
    width: 220,
    height: 220,
  },
  loadingBar: {
    width: 120,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});
