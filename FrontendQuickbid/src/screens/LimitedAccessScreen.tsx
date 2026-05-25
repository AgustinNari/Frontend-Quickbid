import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'LimitedAccess'>;

const BLUE = '#0055D1';

function UserBadgeIcon() {
  return (
    <Svg width="90" height="90" viewBox="0 0 90 90" fill="none">
      {/* Fondo */}
      <Circle cx="45" cy="45" r="44" stroke="#E0EDFF" strokeWidth="2" fill="#EFF6FF" />
      {/* Cabeza */}
      <Circle cx="45" cy="33" r="12" stroke={BLUE} strokeWidth="2" fill="none" />
      {/* Cuerpo */}
      <Path d="M19 76c0-14.359 11.641-26 26-26s26 11.641 26 26" stroke={BLUE} strokeWidth="2" strokeLinecap="round" />
      {/* Badge rojo */}
      <Circle cx="71" cy="22" r="11" fill="#EF4444" />
      {/* Línea del ! */}
      <Path d="M71 16v7" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      {/* Punto del ! */}
      <Circle cx="71" cy="27" r="1.8" fill="#FFFFFF" />
    </Svg>
  );
}

function ShieldIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.25C17.25 23.15 21 18.25 21 13V7L12 2z"
        stroke={BLUE} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M9 12l2 2 4-4" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={BLUE} strokeWidth="1.8" />
      <Path d="M12 7v5l3 3" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>{icon}</View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{description}</Text>
      </View>
    </View>
  );
}

export default function LimitedAccessScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.brand}>QuickBid</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.iconWrap}>
          <UserBadgeIcon />
        </View>

        <Text style={styles.title}>Acceso Limitado</Text>

        <Text style={styles.body}>
          Para participar en subastas en vivo, realizar pujas en tiempo real y consignar bienes, es necesario vincular un medio de pago verificado a tu{' '}
          <Text style={styles.boldBlue}>cuenta QuickBid.</Text>
        </Text>

        <View style={styles.features}>
          <FeatureItem
            icon={<ShieldIcon />}
            title="Pujas Seguras"
            description="Garantizamos la legitimidad de cada oferta en nuestra plataforma."
          />
          <FeatureItem
            icon={<ClockIcon />}
            title="Validación requerida"
            description="Es recomendable vincularlo hoy para poder utilizarlo lo antes posible."
          />
        </View>

        <TouchableOpacity style={styles.btnPrimary} activeOpacity={0.85} onPress={() => navigation.navigate('MetodosPago')}>
          <Text style={styles.btnPrimaryText}>Agregar Medio de Pago</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondary} activeOpacity={0.85} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.btnSecondaryText}>Continuar como Observador</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  brand: { fontSize: 18, fontWeight: 'bold', color: BLUE },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 36,
    alignItems: 'center',
  },

  iconWrap: { marginBottom: 24 },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  boldBlue: { color: BLUE, fontWeight: '600' },

  features: { width: '100%', gap: 16, marginBottom: 32 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  featureDesc:  { fontSize: 13, color: '#6B7280', lineHeight: 20 },

  btnPrimary: {
    backgroundColor: BLUE,
    borderRadius: 10,
    height: 52,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  btnSecondary: {
    borderRadius: 10,
    height: 52,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BLUE,
  },
  btnSecondaryText: { color: BLUE, fontSize: 16, fontWeight: '600' },
});
