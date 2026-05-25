import React, { useEffect, useState } from 'react';
import {
  View,
  SafeAreaView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  Heading,
  Body,
  Typography,
  Icon,
  EmptyState,
  Loader,
} from '../ui';
import {
  colors,
  spacing,
  layout,
  radius,
  fontSize,
  fontWeight,
  letterSpacing,
} from '../theme';
import BottomNavBar, { NavTab } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { ItemCatalogoCard } from '../components/ItemCatalogoCard';
import { getMockCatalogo, getMockDetalle } from '../mocks/subastas';
import { ItemCatalogo } from '../types/subasta';

type Props = NativeStackScreenProps<RootStackParamList, 'CatalogoSubasta'>;

/**
 * Pantalla del catálogo de una subasta (tarea #11 del Trello).
 *
 * Alineada al frame `178:1666` (Catálogo de Subasta Secuencial):
 *  - Header con back y brand QuickBid.
 *  - Switch de pestañas: "Catálogo completo" / "Ver en puja actual" (la 2da
 *    queda deshabilitada porque la puja en vivo es de otra tarea).
 *  - Subtítulo: nombre de la subasta + cantidad de lotes.
 *  - Lista vertical con `<ItemCatalogoCard>` (10–12 lotes).
 *  - Empty state si el catálogo está vacío.
 *  - Tocar un ítem: por ahora muestra un Alert ("Tarea #12 pendiente") porque
 *    el detalle de ítem es la siguiente tarea.
 *
 * El precio base se muestra para todos los usuarios — para esta tarea
 * asumimos "autenticado" (el modo invitado es la tarea #9 aparte).
 */
export default function CatalogoSubastaScreen({ navigation, route }: Props) {
  const { subastaId, titulo: tituloParam } = route.params;
  const [activeTab, setActiveTab] = useState<NavTab>('subastas');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ItemCatalogo[]>([]);
  const [tituloResolved, setTituloResolved] = useState<string | undefined>(
    tituloParam,
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setItems(getMockCatalogo(subastaId));
      if (!tituloParam) {
        const detalle = getMockDetalle(subastaId);
        if (detalle) setTituloResolved(detalle.titulo);
      }
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [subastaId, tituloParam]);

  const handleBack = () => navigation.goBack();

  const handleOpenItem = (item: ItemCatalogo) => {
    navigation.navigate('ItemDetail', {
      itemId: item.id,
      subastaId: item.subastaId,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={handleBack} />

      {loading ? (
        <Loader fullScreen label="Cargando catálogo..." />
      ) : (
        <>
          <View style={styles.tabs}>
            <CatalogoTab label="Catálogo completo" active />
            <CatalogoTab
              label="Ver en puja actual"
              comingSoon
              onPress={() =>
                Alert.alert(
                  'Puja en vivo',
                  'La puja en vivo se va a habilitar en una tarea posterior.',
                )
              }
            />
          </View>

          <View style={styles.titleBlock}>
            <Heading numberOfLines={2}>
              {tituloResolved ?? 'Catálogo'}
            </Heading>
            <Body muted style={styles.subtitle}>
              {items.length === 0
                ? 'Sin lotes cargados todavía'
                : `${items.length} ${items.length === 1 ? 'lote' : 'lotes'} en catálogo`}
            </Body>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon={
                  <Icon name="inbox" size={48} color={colors.textSubtle} />
                }
                title="El catálogo está vacío"
                description="Esta subasta todavía no publicó los lotes. Volvé a chequear más cerca de la fecha de inicio."
                actionLabel="Volver al detalle"
                onAction={handleBack}
              />
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(it) => it.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <ItemCatalogoCard
                  item={item}
                  onPress={() => handleOpenItem(item)}
                />
              )}
              ItemSeparatorComponent={() => (
                <View style={{ height: spacing.md }} />
              )}
            />
          )}
        </>
      )}

      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────

function CatalogoTab({
  label,
  active = false,
  comingSoon = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  /**
   * Estilo "no disponible" pero el tap sigue funcionando si hay `onPress`
   * (típicamente para Alert placeholder de tarea futura).
   */
  comingSoon?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      style={[
        styles.tab,
        active ? styles.tabActive : styles.tabIdle,
        comingSoon ? styles.tabDisabled : null,
      ]}
    >
      <Typography
        style={[
          styles.tabLabel,
          active ? styles.tabLabelActive : styles.tabLabelIdle,
          comingSoon ? styles.tabLabelDisabled : null,
        ]}
      >
        {label}
      </Typography>
    </TouchableOpacity>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.base,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabIdle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  tabDisabled: {
    opacity: 0.85,
  },
  tabLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.wide,
  },
  tabLabelActive: {
    color: colors.textInverse,
  },
  tabLabelIdle: {
    color: colors.text,
  },
  tabLabelDisabled: {
    color: colors.textMuted,
  },
  titleBlock: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.base,
    gap: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
  },
  list: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing['2xl'],
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
});
