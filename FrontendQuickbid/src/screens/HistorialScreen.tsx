import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, radius, fontSize, fontWeight, layout } from '../theme';
import BottomNavBar, { NavTab, BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { FadeIn } from '../components/FadeIn';
import { perfilApi } from '../api/perfil';

type Props = NativeStackScreenProps<RootStackParamList, 'Historial'>;

// ── Pantalla ──────────────────────────────────────────────────────────────────

export default function HistorialScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<NavTab>('compras');
  const [loading,   setLoading]   = useState(true);
  const [total,     setTotal]     = useState(0);

  useEffect(() => {
    perfilApi.getHistorial()
      .then(res => { if (res.data) setTotal(res.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isEmpty = total === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.titulo}>Historial de subastas</Text>
        <Text style={styles.subtitulo}>Todas tus pujas y compras.</Text>

        {loading ? (
          <View style={styles.emptyWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : isEmpty ? (
          <FadeIn>
            <View style={styles.emptyWrap}>
              <View style={styles.emptyCircle}>
                <Svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="9" stroke={colors.textSubtle} strokeWidth="1.8" />
                  <Path d="M12 7v5l3 3" stroke={colors.textSubtle} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <Text style={styles.emptyText}>Aún no tenés registros para mostrar</Text>
            </View>
          </FadeIn>
        ) : (
          <FadeIn>
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                Tenés {total} registro{total !== 1 ? 's' : ''} en tu historial.{'\n'}
                Disponible cuando se conecten las subastas.
              </Text>
            </View>
          </FadeIn>
        )}
      </ScrollView>

      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} navigation={navigation} />
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.xl,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg,
  },

  titulo: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitulo: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingTop: spacing['4xl'],
    gap: spacing.xl,
  },
  emptyCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.borderMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
  },
});
