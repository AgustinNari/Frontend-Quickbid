import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, fontSize } from '../theme';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Icon } from '../ui';

type Props = NativeStackScreenProps<RootStackParamList, 'LimitedAccess'>;

function UserBadgeIcon() {
  return (
    <Svg width="90" height="90" viewBox="0 0 90 90" fill="none">
      <Circle cx="45" cy="45" r="44" stroke="#E0EDFF" strokeWidth="2" fill={colors.infoSoft} />
      <Circle cx="45" cy="33" r="12" stroke={colors.primary} strokeWidth="2" fill="none" />
      <Path d="M19 76c0-14.359 11.641-26 26-26s26 11.641 26 26" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="71" cy="22" r="11" fill={colors.danger} />
      <Path d="M71 16v7" stroke={colors.white} strokeWidth="2.5" strokeLinecap="round" />
      <Circle cx="71" cy="27" r="1.8" fill={colors.white} />
    </Svg>
  );
}

function ShieldIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.25C17.25 23.15 21 18.25 21 13V7L12 2z"
        stroke={colors.primary} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M9 12l2 2 4-4" stroke={colors.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={colors.primary} strokeWidth="1.8" />
      <Path d="M12 7v5l3 3" stroke={colors.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
  const { isGuest, estadoCuenta, logout, clearSession } = useAuth();
  const isBlocked = estadoCuenta === 'bloqueada_permanente';
  const isRestricted = estadoCuenta === 'restriccion_multa';
  const statusColor = isBlocked ? colors.danger : isRestricted ? colors.warning : colors.primary;

  const title = isBlocked
    ? 'Cuenta bloqueada'
    : isRestricted
      ? 'Cuenta restringida'
      : isGuest
        ? 'Acceso como invitado'
        : 'Acceso limitado';

  const description = isBlocked
    ? 'Tu cuenta tiene un bloqueo permanente. Podes cerrar sesion, pero no navegar ni operar funciones normales.'
    : isRestricted
      ? 'Podes navegar normalmente, pero las acciones economicas estan deshabilitadas mientras exista una multa activa.'
      : isGuest
        ? 'Podes explorar subastas y catalogos publicos. Inicia sesion para acceder a precios, perfil y operaciones protegidas.'
        : 'Para participar en subastas y realizar acciones economicas necesitas una cuenta habilitada.';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.brand}>QuickBid</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.iconWrap, { backgroundColor: `${statusColor}18` }]}>
          <UserBadgeIcon />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{description}</Text>

        <Card variant="flat" padding="lg" style={styles.features}>
          <View style={styles.statusRow}>
            <Icon
              name={isBlocked || isRestricted ? 'alert' : 'info'}
              size={18}
              color={statusColor}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {isBlocked
                ? 'La navegacion normal esta bloqueada'
                : isRestricted
                  ? 'Las acciones economicas estan bloqueadas'
                  : 'Estas navegando con acceso limitado'}
            </Text>
          </View>
          <FeatureItem
            icon={<ShieldIcon />}
            title={isRestricted ? 'Multa activa' : isBlocked ? 'Cuenta bloqueada' : 'Acceso protegido'}
            description={isRestricted
              ? 'Regulariza la multa desde tus compras para volver a inscribirte y pujar.'
              : isBlocked
                ? 'Los endpoints protegidos no estan disponibles para esta sesion limitada.'
                : 'Las operaciones requieren una cuenta registrada y habilitada.'}
          />
          <FeatureItem
            icon={<ClockIcon />}
            title={isGuest ? 'Sesion requerida' : 'Estado de cuenta'}
            description={isGuest
              ? 'Al iniciar sesion vas a poder ver precios, compras, consignaciones y notificaciones.'
              : 'QuickBid respeta el estado que informa el backend para cada accion.'}
          />
        </Card>

        {isBlocked ? (
          <Button
            variant="danger"
            style={styles.actionButton}
            onPress={async () => {
              await logout();
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            }}>
            Cerrar sesion
          </Button>
        ) : isGuest ? (
          <>
            <Button
              style={styles.actionButton}
              onPress={async () => {
                await clearSession();
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              }}>
              Iniciar sesion
            </Button>
            <Button
              variant="secondary"
              style={styles.actionButton}
              onPress={async () => {
                await clearSession();
                navigation.reset({ index: 0, routes: [{ name: 'Register' }] });
              }}>
              Registrarme
            </Button>
            <Button variant="ghost" style={styles.actionButton} onPress={() => navigation.navigate('Subastas')}>
              Continuar como observador
            </Button>
          </>
        ) : isRestricted ? (
          <>
            <Button style={styles.actionButton} onPress={() => navigation.navigate('MisCompras')}>Ver compras y multas</Button>
            <Button variant="secondary" style={styles.actionButton} onPress={() => navigation.navigate('Subastas')}>Volver a subastas</Button>
          </>
        ) : (
          <>
            <Button style={styles.actionButton} onPress={() => navigation.navigate('MetodosPago')}>Agregar medio de pago</Button>
            <Button variant="secondary" style={styles.actionButton} onPress={() => navigation.navigate('Subastas')}>Volver a subastas</Button>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  brand: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.primary },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 36,
    alignItems: 'center',
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  body: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  features: { width: '100%', gap: 16, marginBottom: spacing['2xl'] },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  statusText: { flex: 1, fontSize: fontSize.sm, fontWeight: '600' },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.infoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: 4 },
  featureDesc: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20 },
  actionButton: { marginBottom: spacing.sm },
});
