import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/context/AuthContext';

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
import SubastaDetailScreen from './src/screens/SubastaDetailScreen';
import CatalogoSubastaScreen from './src/screens/CatalogoSubastaScreen';
import ItemDetailScreen from './src/screens/ItemDetailScreen';
import InscripcionSubastaScreen from './src/screens/InscripcionSubastaScreen';
import InscripcionExitoScreen from './src/screens/InscripcionExitoScreen';
import PujaEnVivoScreen from './src/screens/PujaEnVivoScreen';
import PujaExitoScreen from './src/screens/PujaExitoScreen';
import MenuLateralScreen from './src/screens/MenuLateralScreen';
import NotificacionesScreen from './src/screens/NotificacionesScreen';
import HistorialScreen from './src/screens/HistorialScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import EstadisticasScreen from './src/screens/EstadisticasScreen';
import ConsignacionesScreen from './src/screens/ConsignacionesScreen';
import AltaConsignacionScreen from './src/screens/AltaConsignacionScreen';
import ConsignacionExitoScreen from './src/screens/ConsignacionExitoScreen';
import ConsignacionDetailScreen from './src/screens/ConsignacionDetailScreen';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Identity: { email: string; nombre: string; apellido: string; telefono: string; domicilio: string };
  Security: { mode: 'registro'; email: string } | { mode: 'recuperacion'; token: string };
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
  SubastaDetail: { id: string };
  CatalogoSubasta: { subastaId: string; titulo?: string };
  ItemDetail: { itemId: string; subastaId: string };
  InscripcionSubasta: { subastaId: string };
  InscripcionExito: { subastaId: string; idMedioPago: string };
  PujaEnVivo: { subastaId: string };
  PujaExito: {
    subastaId: string;
    itemId: string;
    montoFinal: number;
    numeroPostor: number;
  };
  MenuLateral: undefined;
  Notificaciones: undefined;
  Historial: undefined;
  Perfil: undefined;
  Estadisticas: undefined;
  Consignaciones: undefined;
  AltaConsignacion: undefined;
  ConsignacionExito: { id: string; codigo: string; titulo: string };
  ConsignacionDetail: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AuthProvider>
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
        <Stack.Screen name="SubastaDetail" component={SubastaDetailScreen} />
        <Stack.Screen name="CatalogoSubasta" component={CatalogoSubastaScreen} />
        <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
        <Stack.Screen name="InscripcionSubasta" component={InscripcionSubastaScreen} />
        <Stack.Screen name="InscripcionExito" component={InscripcionExitoScreen} />
        <Stack.Screen name="PujaEnVivo" component={PujaEnVivoScreen} />
        <Stack.Screen name="PujaExito" component={PujaExitoScreen} />
        <Stack.Screen name="Notificaciones" component={NotificacionesScreen} />
        <Stack.Screen name="Historial" component={HistorialScreen} />
        <Stack.Screen name="Perfil" component={PerfilScreen} />
        <Stack.Screen name="Estadisticas" component={EstadisticasScreen} />
        <Stack.Screen name="Consignaciones" component={ConsignacionesScreen} />
        <Stack.Screen name="AltaConsignacion" component={AltaConsignacionScreen} />
        <Stack.Screen name="ConsignacionExito" component={ConsignacionExitoScreen} />
        <Stack.Screen name="ConsignacionDetail" component={ConsignacionDetailScreen} />
        <Stack.Screen
          name="MenuLateral"
          component={MenuLateralScreen}
          options={{ presentation: 'transparentModal', animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
    </AuthProvider>
  );
}