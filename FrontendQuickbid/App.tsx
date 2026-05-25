import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import DetailsScreen from './src/screens/DetailsScreen';
import LoginScreen from './src/screens/LoginScreen';
import SplashScreen from './src/screens/SplashScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import IdentityScreen from './src/screens/IdentityScreen';
import VerifyingScreen from './src/screens/VerifyingScreen';
import SecurityScreen from './src/screens/SecurityScreen';
import LimitedAccessScreen from './src/screens/LimitedAccessScreen';
import EnlaceRegistroScreen from './src/screens/EnlaceRegistroScreen';
import RecuperacionCuentaScreen from './src/screens/RecuperacionCuentaScreen';
import MetodosPagoScreen from './src/screens/MetodosPagoScreen';
import SeleccionTipoPagoScreen from './src/screens/SeleccionTipoPagoScreen';
import NuevaTarjetaScreen from './src/screens/NuevaTarjetaScreen';
import CuentaBancariaScreen from './src/screens/CuentaBancariaScreen';
import ChequeCertificadoScreen from './src/screens/ChequeCertificadoScreen';
import ValidandoPagoScreen from './src/screens/ValidandoPagoScreen';
import UIShowcaseScreen from './src/screens/UIShowcaseScreen';
import SubastasScreen from './src/screens/SubastasScreen';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Identity: undefined;
  Security: undefined;
  Verifying: undefined;
  LimitedAccess: undefined;
  EnlaceRegistro: undefined;
  RecuperacionCuenta: undefined;
  MetodosPago: undefined;
  SeleccionTipoPago: undefined;
  NuevaTarjeta: undefined;
  CuentaBancaria: undefined;
  ChequeCertificado: undefined;
  ValidandoPago: undefined;
  Home: undefined;
  Details: undefined;
  UIShowcase: undefined;
  Subastas: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Identity" component={IdentityScreen} />
        <Stack.Screen name="Security" component={SecurityScreen} />
        <Stack.Screen name="Verifying" component={VerifyingScreen} />
        <Stack.Screen name="LimitedAccess" component={LimitedAccessScreen} />
        <Stack.Screen name="MetodosPago" component={MetodosPagoScreen} />
        <Stack.Screen name="SeleccionTipoPago" component={SeleccionTipoPagoScreen} />
        <Stack.Screen name="NuevaTarjeta" component={NuevaTarjetaScreen} />
        <Stack.Screen name="CuentaBancaria" component={CuentaBancariaScreen} />
        <Stack.Screen name="ChequeCertificado" component={ChequeCertificadoScreen} />
        <Stack.Screen name="ValidandoPago" component={ValidandoPagoScreen} />
        <Stack.Screen name="EnlaceRegistro" component={EnlaceRegistroScreen} />
        <Stack.Screen name="RecuperacionCuenta" component={RecuperacionCuentaScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="UIShowcase" component={UIShowcaseScreen} />
        <Stack.Screen name="Subastas" component={SubastasScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}