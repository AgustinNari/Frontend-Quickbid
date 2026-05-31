import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, radius, fontSize, fontWeight, layout } from '../theme';
import BottomNavBar, { NavTab, BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { perfilApi, PerfilData } from '../api/perfil';
import { FadeIn } from '../components/FadeIn';

type Props = NativeStackScreenProps<RootStackParamList, 'Perfil'>;

// ── Config de categorías ──────────────────────────────────────────────────────

const CATEGORIA_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  comun:    { label: 'Pujador Común',    color: '#6B7280', bg: '#F3F4F6' },
  especial: { label: 'Pujador Especial', color: '#7C3AED', bg: '#F3E8FF' },
  plata:    { label: 'Pujador Plata',    color: '#6B7280', bg: '#F1F5F9' },
  oro:      { label: 'Pujador Oro',      color: '#D97706', bg: '#FEF3C7' },
  platino:  { label: 'Pujador Platino',  color: '#1D4ED8', bg: '#DBEAFE' },
};

// ── Íconos de secciones ───────────────────────────────────────────────────────

function RowIcon({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.rowIconWrap}>{children}</View>
  );
}

function IconHistorial() {
  return <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={colors.primary} strokeWidth="1.8" />
    <Path d="M12 7v5l3 3" stroke={colors.primary} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>;
}
function IconStats() {
  return <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M3 3v18h18" stroke={colors.primary} strokeWidth="1.8" strokeLinecap="round" />
    <Path d="M7 16l4-4 4 4 4-8" stroke={colors.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}
function IconCard() {
  return <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke={colors.primary} strokeWidth="1.8" />
    <Path d="M2 10h20" stroke={colors.primary} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>;
}
function IconLock() {
  return <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="11" width="14" height="10" rx="2" stroke={colors.primary} strokeWidth="1.8" />
    <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={colors.primary} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>;
}
function IconChevron() {
  return <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={colors.textSubtle} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}

// ── Fila de sección ───────────────────────────────────────────────────────────

type SectionRowProps = {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  onPress?: () => void;
};

function SectionRow({ icon, label, sublabel, onPress }: SectionRowProps) {
  return (
    <TouchableOpacity style={styles.sectionRow} onPress={onPress} activeOpacity={0.7}>
      <RowIcon>{icon}</RowIcon>
      <View style={styles.sectionRowText}>
        <Text style={styles.sectionRowLabel}>{label}</Text>
        <Text style={styles.sectionRowSub}>{sublabel}</Text>
      </View>
      <IconChevron />
    </TouchableOpacity>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────────────────

export default function PerfilScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<NavTab>('subastas');
  const { user } = useAuth();
  const [perfil,   setPerfil]   = useState<PerfilData | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    perfilApi.getPerfil()
      .then(res => res.data && setPerfil(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fallback al contexto de auth mientras carga /perfil
  const nombre    = perfil?.nombre    ?? user?.nombre    ?? '';
  const iniciales = perfil?.iniciales ?? (nombre ? nombre.split(' ').map(p => p[0]).join('').toUpperCase() : '?');
  const categoria = perfil?.categoria ?? user?.categoria ?? 'comun';
  const email     = perfil?.email     ?? user?.email     ?? '';
  const cfg = CATEGORIA_CONFIG[categoria] ?? CATEGORIA_CONFIG.comun;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      {loading && (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 16 }} />
      )}

      <FadeIn key={loading ? 'loading' : 'loaded'} duration={250}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.titulo}>Mi perfil</Text>

        {/* Tarjeta de usuario */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{iniciales}</Text>
              <View style={styles.avatarCheck}>
                <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <Circle cx="7" cy="7" r="7" fill={colors.primary} />
                  <Path d="M4 7l2 2 4-4" stroke={colors.white} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
            </View>

            {/* Info */}
            <View style={styles.cardInfo}>
              <Text style={styles.cardNombre}>{nombre}</Text>
              <Text style={styles.cardEmail}>{email}</Text>
              <View style={[styles.categoriaBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.categoriaText, { color: cfg.color }]}>🏆 {cfg.label}</Text>
              </View>
            </View>

          </View>

        </View>

        {/* Sección ACTIVIDAD */}
        <Text style={styles.seccionLabel}>ACTIVIDAD</Text>
        <View style={styles.seccionCard}>
          <SectionRow
            icon={<IconHistorial />}
            label="Historial de subastas"
            sublabel="Todas tus pujas y resultados"
            onPress={() => navigation.navigate('Historial')}
          />
          <View style={styles.separador} />
          <SectionRow
            icon={<IconStats />}
            label="Estadísticas"
            sublabel="Rendimiento y tendencias"
            onPress={() => navigation.navigate('Estadisticas')}
          />
        </View>

        {/* Sección CUENTA */}
        <Text style={styles.seccionLabel}>CUENTA</Text>
        <View style={styles.seccionCard}>
          <SectionRow
            icon={<IconCard />}
            label="Métodos de pago"
            sublabel="Tarjetas y cuentas bancarias"
            onPress={() => navigation.navigate('MetodosPago')}
          />
          <View style={styles.separador} />
          <SectionRow
            icon={<IconLock />}
            label="Cambio de contraseña"
            sublabel="Actualizá tu contraseña"
            onPress={() => navigation.navigate('RecuperacionCuenta')}
          />
        </View>

        {/* Footer */}
        <Text style={styles.footer}>QuickBid v2.4.1 · Todos los derechos reservados</Text>

      </ScrollView>
      </FadeIn>

      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} navigation={navigation} />
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.xl,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg,
  },

  titulo: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.base,
  },

  // Tarjeta usuario
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  avatarCheck: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  cardInfo: { flex: 1, gap: 3 },
  cardNombre: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  cardEmail:  { fontSize: fontSize.sm, color: colors.textMuted },
  categoriaBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: 2,
  },
  categoriaText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

  miembro: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },

  // Secciones
  seccionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textSubtle,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  seccionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  separador: {
    height: 1,
    backgroundColor: colors.borderMuted,
    marginLeft: 16 + 40 + 12, // icon offset
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    gap: spacing.md,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.base,
    backgroundColor: colors.infoSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionRowText: { flex: 1, gap: 2 },
  sectionRowLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  sectionRowSub:   { fontSize: fontSize.sm, color: colors.textMuted },

  footer: {
    fontSize: fontSize.xs,
    color: colors.textSubtle,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
