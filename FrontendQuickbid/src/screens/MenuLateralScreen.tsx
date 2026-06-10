import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, radius, fontSize, fontWeight } from '../theme';
import { useAuth } from '../context/AuthContext';
import { usuarioApi } from '../api/usuario';

type Props = NativeStackScreenProps<RootStackParamList, 'MenuLateral'>;

function AvatarIcon() {
  return (
    <Svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <Circle cx="22" cy="22" r="22" fill={colors.borderMuted} />
      <Circle cx="22" cy="18" r="8" fill={colors.textSubtle} />
      <Path
        d="M6 40c0-8.837 7.163-16 16-16s16 7.163 16 16"
        fill={colors.textSubtle}
      />
    </Svg>
  );
}

function CheckCircleIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <Circle cx="8" cy="8" r="8" fill={colors.primary} />
      <Path
        d="M5 8l2 2 4-4"
        stroke={colors.white}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SubastasIcon({ color }: { color: string }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 18h18M3 12h18M3 6h18"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function BagIcon({ color }: { color: string }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 6h18"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M16 10a4 4 0 0 1-8 0"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ConsignacionIcon({ color }: { color: string }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M7 8h10M7 12h10M7 16h6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function BellIcon({ color }: { color: string }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function UserIcon({ color }: { color: string }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" />
      <Path
        d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LogoutIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke={colors.danger}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 17l5-5-5-5"
        stroke={colors.danger}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 12H9"
        stroke={colors.danger}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onPress?: () => void;
};

function MenuItem({ icon, label, active, badge, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, active && styles.menuItemActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemIcon}>{icon}</View>
      <Text
        style={[styles.menuItemLabel, active && styles.menuItemLabelActive]}
      >
        {label}
      </Text>
      {badge != null && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function MenuLateralScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [noLeidas, setNoLeidas] = useState(0);

  const close = () => navigation.goBack();

  const state = navigation.getState();
  const currentRoute = state.routes[state.routes.length - 2]?.name;

  useEffect(() => {
    if (!user) return;
    usuarioApi
      .notificaciones({ leida: false, page: 0, size: 1 })
      .then(res => setNoLeidas(res.totalElements))
      .catch(() => {});
  }, [user]);

  const categoriaLabel: Record<string, string> = {
    comun: 'COMÚN',
    especial: 'ESPECIAL',
    plata: 'PLATA',
    oro: 'ORO',
    platino: 'PLATINO',
  };

  const nombre = user?.nombre ?? user?.email ?? 'Invitado';
  const categoria = user?.categoria ?? 'comun';

  return (
    <View style={styles.root}>
      <Pressable style={styles.overlay} onPress={close} />

      <SafeAreaView style={styles.panel}>
        <Text style={styles.panelTitle}>Menú Lateral</Text>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatarWrap}>
              <AvatarIcon />
              <View style={styles.avatarCheck}>
                <CheckCircleIcon />
              </View>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{nombre}</Text>
              <View style={styles.categoriaBadge}>
                <Text style={styles.categoriaText}>
                  {categoriaLabel[categoria] ?? categoria}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.idRow}>
            <Text style={styles.idText}>{user?.email ?? ''}</Text>
            <View style={styles.verificadoBadge}>
              <Text style={styles.verificadoText}>Cuenta verificada</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <MenuItem
            icon={
              <SubastasIcon
                color={
                  currentRoute === 'Subastas'
                    ? colors.primary
                    : colors.textMuted
                }
              />
            }
            label="Subastas"
            active={currentRoute === 'Subastas'}
            onPress={() => {
              close();
              navigation.navigate('Subastas');
            }}
          />
          <MenuItem
            icon={<BagIcon color={colors.textMuted} />}
            label="Mis Compras"
            onPress={() => {
              close();
              navigation.navigate('MisCompras');
            }}
          />
          <MenuItem
            icon={
              <ConsignacionIcon
                color={
                  currentRoute === 'Consignaciones'
                    ? colors.primary
                    : colors.textMuted
                }
              />
            }
            label="Consignación"
            active={currentRoute === 'Consignaciones'}
            onPress={() => {
              close();
              navigation.navigate('Consignaciones');
            }}
          />
          <MenuItem
            icon={
              <BellIcon
                color={
                  currentRoute === 'Notificaciones'
                    ? colors.primary
                    : colors.textMuted
                }
              />
            }
            label="Notificaciones"
            badge={noLeidas}
            active={currentRoute === 'Notificaciones'}
            onPress={() => {
              close();
              navigation.navigate('Notificaciones');
            }}
          />
          <MenuItem
            icon={
              <UserIcon
                color={
                  currentRoute === 'Perfil' ? colors.primary : colors.textMuted
                }
              />
            }
            label="Mi perfil"
            active={currentRoute === 'Perfil'}
            onPress={() => {
              close();
              navigation.navigate('Perfil');
            }}
          />
          <MenuItem
            icon={
              <SubastasIcon
                color={
                  currentRoute === 'Estadisticas'
                    ? colors.primary
                    : colors.textMuted
                }
              />
            }
            label="Estadísticas"
            active={currentRoute === 'Estadisticas'}
            onPress={() => {
              close();
              navigation.navigate('Estadisticas');
            }}
          />
          <MenuItem
            icon={
              <SubastasIcon
                color={
                  currentRoute === 'Historial'
                    ? colors.primary
                    : colors.textMuted
                }
              />
            }
            label="Historial"
            active={currentRoute === 'Historial'}
            onPress={() => {
              close();
              navigation.navigate('Historial');
            }}
          />
          <MenuItem
            icon={<BagIcon color={colors.textMuted} />}
            label="Métodos de pago"
            onPress={() => {
              close();
              navigation.navigate('MetodosPago');
            }}
          />
          <MenuItem
            icon={<UserIcon color={colors.textMuted} />}
            label="Dirección de envío"
            onPress={() => {
              close();
              navigation.navigate('DireccionesEnvio');
            }}
          />
          <MenuItem
            icon={<UserIcon color={colors.textMuted} />}
            label="Seguridad"
            onPress={() => {
              close();
              navigation.navigate('CambiarClave');
            }}
          />
          <MenuItem
            icon={
              <BellIcon
                color={
                  currentRoute === 'Ayuda' ? colors.primary : colors.textMuted
                }
              />
            }
            label="Ayuda y soporte"
            active={currentRoute === 'Ayuda'}
            onPress={() => {
              close();
              navigation.navigate('Ayuda');
            }}
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={async () => {
              await logout();
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            }}
          >
            <LogoutIcon />
            <View>
              <Text style={styles.logoutLabel}>Cerrar sesión</Text>
              <Text style={styles.logoutSub}>Salir de tu cuenta QuickBid</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.brand}>QuickBid</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const PANEL_WIDTH = 290;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  panel: {
    width: PANEL_WIDTH,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  panelTitle: {
    fontSize: fontSize.sm,
    color: colors.textSubtle,
    fontWeight: fontWeight.medium,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  scroll: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl,
  },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.base,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarCheck: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  profileInfo: {
    gap: spacing.xs,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  categoriaBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.infoSoft,
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  categoriaText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: 0.5,
  },

  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.base,
    flexWrap: 'wrap',
  },
  idText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  verificadoBadge: {
    backgroundColor: colors.infoSoft,
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  verificadoText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },

  divider: {
    height: 1,
    backgroundColor: colors.borderMuted,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.sm,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radius.md,
    marginBottom: 2,
  },
  menuItemActive: {
    backgroundColor: colors.infoSoft,
  },
  menuItemIcon: {
    width: 24,
    alignItems: 'center',
  },
  menuItemLabel: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  menuItemLabelActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  badge: {
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },

  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
    gap: spacing.base,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radius.base,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  logoutLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.danger,
  },
  logoutSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  brand: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
});
