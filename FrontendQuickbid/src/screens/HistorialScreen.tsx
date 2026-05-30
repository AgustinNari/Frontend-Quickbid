import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, radius, fontSize, fontWeight, layout, controlHeight } from '../theme';
import BottomNavBar, { NavTab, BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { MOCK_HISTORIAL, HistorialItem } from '../mocks/historial';

type Props = NativeStackScreenProps<RootStackParamList, 'Historial'>;

// ── Config de estado ──────────────────────────────────────────────────────────

const ESTADO_CONFIG = {
  ganada:     { label: 'GANADA',      color: '#16A34A' },
  adjudicado: { label: 'ADJUDICADO',  color: colors.primary },
  superada:   { label: 'SUPERADA',    color: '#DC2626' },
  perdida:    { label: 'PERDIDA',     color: colors.textMuted },
};

const TIPO_LABEL = {
  puja:   'PUJA',
  compra: 'COMPRA',
};

// ── Item ──────────────────────────────────────────────────────────────────────

function HistorialItemRow({ item }: { item: HistorialItem }) {
  const estado = ESTADO_CONFIG[item.estado];
  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.7}>
      <View style={styles.itemTop}>
        <Text style={styles.itemFecha}>{item.fecha} · <Text style={styles.itemTipo}>{TIPO_LABEL[item.tipo]}</Text></Text>
        <Text style={[styles.itemEstado, { color: estado.color }]}>{estado.label}</Text>
      </View>
      <View style={styles.itemBottom}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemNombre}>{item.itemNombre}</Text>
          <Text style={styles.itemSubasta}>{item.subastaNombre}</Text>
        </View>
        <Text style={styles.itemMonto}>{item.monto}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────────────────

const PREVIEW_COUNT = 5;

export default function HistorialScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<NavTab>('compras');
  const [verTodo, setVerTodo] = useState(false);

  const items = MOCK_HISTORIAL;
  const visible = verTodo ? items : items.slice(0, PREVIEW_COUNT);
  const isEmpty = items.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.titulo}>Historial de subastas</Text>
        <Text style={styles.subtitulo}>
          {isEmpty ? 'Tu actividad aparecerá acá.' : 'Todas tus pujas y compras.'}
        </Text>

        {isEmpty ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCircle}>
              <Svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="9" stroke={colors.textSubtle} strokeWidth="1.8" />
                <Path d="M12 7v5l3 3" stroke={colors.textSubtle} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={styles.emptyText}>Aún no tienes registros para mostrar</Text>
          </View>
        ) : (
          <>
            <View style={styles.lista}>
              {visible.map(item => <HistorialItemRow key={item.id} item={item} />)}
            </View>

            {!verTodo && items.length > PREVIEW_COUNT && (
              <TouchableOpacity style={styles.verTodoBtn} onPress={() => setVerTodo(true)} activeOpacity={0.8}>
                <Text style={styles.verTodoBtnText}>Ver todo el historial</Text>
              </TouchableOpacity>
            )}
          </>
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

  // Lista
  lista: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemFecha: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  itemTipo: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  itemEstado: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },
  itemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemNombre: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  itemSubasta: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  itemMonto: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginLeft: spacing.md,
  },

  // Botón ver todo
  verTodoBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.base,
    height: controlHeight.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verTodoBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
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
