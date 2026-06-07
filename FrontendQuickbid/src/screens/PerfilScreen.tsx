import React, { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, { BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { EmptyState, Icon, Loader } from '../ui';
import { colors, fontSize, fontWeight, layout, radius, spacing } from '../theme';
import { usuarioApi } from '../api/usuario';
import { PerfilUsuario } from '../types/usuario';

type Props = NativeStackScreenProps<RootStackParamList, 'Perfil'>;

const CATEGORY_LABELS: Record<string, string> = {
  comun: 'Comun',
  especial: 'Especial',
  plata: 'Plata',
  oro: 'Oro',
  platino: 'Platino',
};

export default function PerfilScreen({ navigation }: Props) {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPerfil(await usuarioApi.perfil());
    } catch (loadError) {
      setPerfil(null);
      setError(loadError instanceof Error ? loadError.message : 'No pudimos cargar tu perfil.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const placeholder = (message: string) => Alert.alert('Proximamente', message);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />
      {loading ? (
        <Loader fullScreen label="Cargando perfil..." />
      ) : error || !perfil ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="alert" size={48} color={colors.textSubtle} />}
            title="No pudimos cargar tu perfil"
            description={error ?? 'El perfil no esta disponible.'}
            actionLabel="Reintentar"
            onAction={cargar}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Mi perfil</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(perfil.nombre, perfil.apellido)}</Text>
              </View>
              <View style={styles.profileText}>
                <Text style={styles.name}>{perfil.nombre} {perfil.apellido}</Text>
                <Text style={styles.muted}>{perfil.email}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{CATEGORY_LABELS[perfil.categoria] ?? perfil.categoria}</Text>
                </View>
              </View>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>QUICKBID ID: {perfil.cuentaId}</Text>
              <Text style={styles.meta}>{perfil.puntos} puntos</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${perfil.progreso.porcentaje}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {perfil.progreso.siguienteCategoria
                ? `${perfil.progreso.puntosFaltantes} puntos para ${perfil.progreso.siguienteCategoria}`
                : 'Categoria maxima alcanzada'}
            </Text>
            <Text style={styles.accountState}>Cuenta: {perfil.estadoCuenta.replaceAll('_', ' ')}</Text>
          </View>

          <Text style={styles.sectionLabel}>ACTIVIDAD</Text>
          <View style={styles.card}>
            <MenuRow icon="clock" title="Historial" subtitle="Pujas, compras y resultados reales" onPress={() => navigation.navigate('Historial')} />
            <Divider />
            <MenuRow icon="star" title="Estadisticas" subtitle="Rendimiento por periodo" onPress={() => navigation.navigate('Estadisticas')} />
            <Divider />
            <MenuRow icon="bell" title="Notificaciones" subtitle="Novedades de tu cuenta" onPress={() => navigation.navigate('Notificaciones')} />
          </View>

          <Text style={styles.sectionLabel}>CUENTA</Text>
          <View style={styles.card}>
            <MenuRow icon="card" title="Metodos de pago" subtitle="Gestion existente" onPress={() => navigation.navigate('MetodosPago')} />
            <Divider />
            <MenuRow icon="check-doc" title="Direccion de envio" subtitle="Gestiona tus direcciones" onPress={() => navigation.navigate('DireccionesEnvio')} />
            <Divider />
            <MenuRow icon="lock" title="Seguridad" subtitle="Cambio de contrasena pendiente" onPress={() => placeholder('El cambio de contrasena desde sesion se conectara en un bloque futuro.')} />
          </View>
        </ScrollView>
      )}
      <BottomNavBar activeTab="menu" navigation={navigation} />
    </SafeAreaView>
  );
}

function initials(nombre: string, apellido: string) {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase() || '?';
}

function MenuRow({ icon, title, subtitle, onPress }: { icon: 'clock' | 'star' | 'bell' | 'card' | 'check-doc' | 'lock'; title: string; subtitle: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIcon}><Icon name={icon} size={20} color={colors.primary} /></View>
      <View style={styles.menuText}><Text style={styles.menuTitle}>{title}</Text><Text style={styles.muted}>{subtitle}</Text></View>
      <Icon name="arrow-right" size={18} color={colors.textSubtle} />
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  errorWrap: { flex: 1, paddingHorizontal: layout.screenPaddingHorizontal },
  scroll: { padding: layout.screenPaddingHorizontal, paddingBottom: BOTTOM_NAV_HEIGHT + spacing.xl },
  title: { fontSize: fontSize['4xl'], fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.base },
  profileCard: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderMuted, padding: spacing.base, marginBottom: spacing.xl },
  profileTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  profileText: { flex: 1, gap: 3 },
  name: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  muted: { fontSize: fontSize.sm, color: colors.textMuted },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: colors.infoSoft, borderRadius: radius.xs, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  categoryText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.base },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: fontWeight.semibold },
  progressTrack: { height: 7, borderRadius: radius.pill, backgroundColor: colors.borderMuted, overflow: 'hidden', marginTop: spacing.sm },
  progressFill: { height: 7, backgroundColor: colors.primary, borderRadius: radius.pill },
  progressText: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  accountState: { fontSize: fontSize.xs, color: colors.textMuted, textTransform: 'capitalize', marginTop: spacing.sm },
  sectionLabel: { fontSize: fontSize.xs, color: colors.textSubtle, fontWeight: fontWeight.bold, letterSpacing: 0.8, marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderMuted, overflow: 'hidden', marginBottom: spacing.xl },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, gap: spacing.md },
  menuIcon: { width: 40, height: 40, borderRadius: radius.base, backgroundColor: colors.infoSoft, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1, gap: 2 },
  menuTitle: { fontSize: fontSize.base, color: colors.text, fontWeight: fontWeight.semibold },
  divider: { height: 1, backgroundColor: colors.borderMuted, marginLeft: 68 },
});
