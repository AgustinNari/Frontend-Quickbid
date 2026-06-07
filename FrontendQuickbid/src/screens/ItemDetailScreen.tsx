import React, { useEffect, useState } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
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
  Button,
  Card,
  Badge,
  Icon,
  EmptyState,
  Loader,
} from '../ui';
import {
  colors,
  spacing,
  radius,
  layout,
  fontSize,
  fontWeight,
  letterSpacing,
} from '../theme';
import BottomNavBar, { NavTab, BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { SubastaInfoRow } from '../components/SubastaInfoRow';
import { SEGMENTO_THEME } from '../components/SubastaCard';
import { getMockItemDetalle } from '../mocks/subastas';
import { formatPrecio } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import {
  ItemDetalle,
  ItemEstado,
  ITEM_ESTADO_LABEL,
  SEGMENTO_LABEL,
} from '../types/subasta';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemDetail'>;

/**
 * Pantalla de detalle de un ítem (lote) del catálogo (tarea #12 del Trello).
 *
 * Sin frame de Figma asignado todavía — alineamos al lenguaje visual ya
 * establecido por `SubastaDetailScreen`:
 *  - Header compartido (`ScreenHeader`) con back.
 *  - Hero tematizado por segmento + badge de estado top-left + badge de
 *    moneda bottom-right.
 *  - Body con overline "LOTE #XXX", título grande, autor, card de precio
 *    base y lista de info rows (segmento, moneda, dimensiones, procedencia,
 *    condición).
 *  - Descripción larga.
 *  - Footer con CTA que cambia según el estado del lote:
 *      • `en_vivo`     → "Pujar ahora" (placeholder de tarea #14).
 *      • `pendiente`   → "Avisarme cuando empiece" (placeholder).
 *      • `vendido`     → Badge "Adjudicado" (sin CTA).
 *      • `no_vendido`  → Badge "No vendido" (sin CTA).
 *
 * El precio base se muestra para todos los usuarios — la tarea #12 asume
 * autenticado (modo invitado es tarea #9). La prop `showPrice` queda lista
 * para cuando se integre el modo invitado.
 *
 * Cuando el backend exponga `GET /api/subastas/{subastaId}/catalogo/{itemId}`,
 * `subastaId` (recibido en params) se va a usar para construir la URL.
 */
type ItemTab = 'detalles' | 'historia' | 'datos';

export default function ItemDetailScreen({ navigation, route }: Props) {
  const { itemId, subastaId } = route.params;
  const { esInvitado } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('subastas');
  const [itemTab, setItemTab] = useState<ItemTab>('detalles');
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ItemDetalle | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setItem(getMockItemDetalle(itemId));
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [itemId]);

  const handleBack = () => navigation.goBack();

  const handlePujar = () => navigation.navigate('PujaEnVivo', { subastaId });

  const irALogin = () => navigation.navigate('Login');

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={handleBack} />

      {loading ? (
        <Loader fullScreen label="Cargando ítem..." />
      ) : !item ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="alert" size={48} color={colors.textSubtle} />}
            title="No encontramos el ítem"
            description="El lote que intentás abrir no existe o fue removido del catálogo."
            actionLabel="Volver"
            onAction={handleBack}
          />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <Hero item={item} esInvitado={esInvitado} />

            <View style={styles.body}>
              <Typography style={styles.overline}>LOTE {item.lote}</Typography>

              <Heading style={styles.titulo}>{item.titulo}</Heading>

              {item.autor ? (
                <Body muted style={styles.autor}>
                  {item.autor}
                </Body>
              ) : null}

              {!esInvitado && item.precioBase !== undefined ? (
                <Card variant="flat" padding="none" style={styles.priceCard}>
                  <View style={styles.priceCardInner}>
                    <Typography style={styles.priceLabel}>
                      Precio base
                    </Typography>
                    <Typography style={styles.priceValue}>
                      {formatPrecio(item.precioBase, item.moneda)}
                    </Typography>
                  </View>
                </Card>
              ) : null}

              {/* Tab bar — Detalles / Historia / Datos de interes (wireframe textual) */}
              <View style={styles.tabBar}>
                <ItemTabButton
                  label="Detalles"
                  active={itemTab === 'detalles'}
                  onPress={() => setItemTab('detalles')}
                />
                <ItemTabButton
                  label="Historia"
                  active={itemTab === 'historia'}
                  onPress={() => setItemTab('historia')}
                />
                <ItemTabButton
                  label="Datos de interés"
                  active={itemTab === 'datos'}
                  onPress={() => setItemTab('datos')}
                />
              </View>

              {itemTab === 'detalles' ? (
                <TabDetalles item={item} />
              ) : itemTab === 'historia' ? (
                <TabHistoria item={item} />
              ) : (
                <TabDatos item={item} />
              )}
            </View>
          </ScrollView>

          <ItemFooter
            estado={item.estado}
            esInvitado={esInvitado}
            onPujar={handlePujar}
            onLogin={irALogin}
          />
        </>
      )}

      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} navigation={navigation} />
    </SafeAreaView>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────

function Hero({ item, esInvitado }: { item: ItemDetalle; esInvitado: boolean }) {
  const theme = SEGMENTO_THEME[item.segmento];
  const estadoTone = HERO_ESTADO_TONE[item.estado];
  return (
    <View style={[styles.hero, { backgroundColor: theme.bg }]}>
      <Icon name={theme.icon} size={96} color={theme.fg} />

      {!esInvitado ? (
        <View style={styles.heroTopLeft}>
          <Badge tone={estadoTone.tone} variant={estadoTone.variant}>
            {item.estado === 'en_vivo' ? '● ' : ''}
            {ITEM_ESTADO_LABEL[item.estado]}
          </Badge>
        </View>
      ) : null}

      <View style={styles.heroBottomRight}>
        <View style={styles.currencyBadge}>
          <Typography style={styles.currencyText}>{item.moneda}</Typography>
        </View>
      </View>
    </View>
  );
}

function ItemFooter({
  estado,
  esInvitado,
  onPujar,
  onLogin,
}: {
  estado: ItemEstado;
  esInvitado: boolean;
  onPujar: () => void;
  onLogin: () => void;
}) {
  if (esInvitado) {
    return (
      <View style={styles.footer}>
        <Button
          onPress={onLogin}
          leftIcon={<Icon name="lock" color={colors.textInverse} size={18} />}
        >
          Iniciá sesión para pujar
        </Button>
      </View>
    );
  }

  if (estado === 'vendido') {
    return (
      <View style={styles.footer}>
        <View style={styles.footerBadgeWrap}>
          <Badge tone="success" variant="soft">
            Adjudicado
          </Badge>
        </View>
      </View>
    );
  }

  if (estado === 'no_vendido') {
    return (
      <View style={styles.footer}>
        <View style={styles.footerBadgeWrap}>
          <Badge tone="neutral" variant="soft">
            No vendido
          </Badge>
        </View>
      </View>
    );
  }

  if (estado === 'en_vivo') {
    return (
      <View style={styles.footer}>
        <Button
          onPress={onPujar}
          leftIcon={<Icon name="plus-circle" color={colors.textInverse} size={18} />}
        >
          Pujar ahora
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.footer}>
      <Button
        variant="secondary"
        onPress={() =>
          Alert.alert(
            'Notificación',
            'Las notificaciones llegan con la tarea de notificaciones.',
          )
        }
        leftIcon={<Icon name="bell" color={colors.text} size={18} />}
      >
        Avisarme cuando empiece
      </Button>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// ── Tab system del item (wireframe textual: Detalles / Historia / Datos) ─────

function ItemTabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.tab, active ? styles.tabActive : null]}
    >
      <Typography
        style={[styles.tabLabel, active ? styles.tabLabelActive : null]}
        numberOfLines={1}
      >
        {label}
      </Typography>
    </TouchableOpacity>
  );
}

/**
 * Tab "Detalles" — info estructural del item: segmento, moneda y, si esta
 * disponible, cantidad de pujas. Es el tab default por ser el mas informativo
 * para alguien que recien abre el item.
 */
function TabDetalles({ item }: { item: ItemDetalle }) {
  return (
    <View style={styles.infoList}>
      <SubastaInfoRow
        icon="image"
        label="Segmento"
        value={SEGMENTO_LABEL[item.segmento]}
      />
      <Divider />
      <SubastaInfoRow
        icon="card"
        label="Moneda"
        value={item.moneda === 'USD' ? 'USD (US$)' : 'ARS ($)'}
      />
      {item.cantidadPujas !== undefined ? (
        <>
          <Divider />
          <SubastaInfoRow
            icon="plus-circle"
            label="Pujas registradas"
            value={`${item.cantidadPujas} ${
              item.cantidadPujas === 1 ? 'puja' : 'pujas'
            }`}
            emphasized
          />
        </>
      ) : null}
    </View>
  );
}

/**
 * Tab "Historia" — narrativa del item: descripcion larga, autor y procedencia.
 * Si el item no tiene descripcion, muestra mensaje vacio.
 */
function TabHistoria({ item }: { item: ItemDetalle }) {
  const hasContent = item.descripcion || item.autor || item.procedencia;
  if (!hasContent) {
    return <TabEmpty mensaje="Este lote aun no tiene historia cargada." />;
  }
  return (
    <View style={styles.tabPanel}>
      {item.descripcion ? (
        <View style={styles.descripcionWrap}>
          <Typography style={styles.descripcionLabel}>DESCRIPCIÓN</Typography>
          <Body style={styles.descripcion}>{item.descripcion}</Body>
        </View>
      ) : null}
      {item.autor || item.procedencia ? (
        <View style={styles.infoList}>
          {item.autor ? (
            <SubastaInfoRow
              icon="star"
              label="Autor / Artista"
              value={item.autor}
            />
          ) : null}
          {item.autor && item.procedencia ? <Divider /> : null}
          {item.procedencia ? (
            <SubastaInfoRow
              icon="bank"
              label="Procedencia"
              value={item.procedencia}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Tab "Datos de interes" — informacion fisica / fechas / condicion del item.
 * Si nada de eso esta disponible, muestra mensaje vacio.
 */
function TabDatos({ item }: { item: ItemDetalle }) {
  const hasContent =
    item.dimensiones || item.condicion || item.fechaAproximada;
  if (!hasContent) {
    return <TabEmpty mensaje="Sin datos adicionales para este lote." />;
  }
  return (
    <View style={styles.infoList}>
      {item.dimensiones ? (
        <SubastaInfoRow
          icon="check-doc"
          label="Dimensiones"
          value={item.dimensiones}
        />
      ) : null}
      {item.dimensiones && item.condicion ? <Divider /> : null}
      {item.condicion ? (
        <SubastaInfoRow
          icon="check-circle"
          label="Condición"
          value={item.condicion}
          emphasized
        />
      ) : null}
      {(item.dimensiones || item.condicion) && item.fechaAproximada ? (
        <Divider />
      ) : null}
      {item.fechaAproximada ? (
        <SubastaInfoRow
          icon="calendar"
          label="Fecha aproximada"
          value={item.fechaAproximada}
        />
      ) : null}
    </View>
  );
}

function TabEmpty({ mensaje }: { mensaje: string }) {
  return (
    <View style={styles.tabEmpty}>
      <Body muted style={styles.tabEmptyText}>
        {mensaje}
      </Body>
    </View>
  );
}

// ── Mapeos de presentación ─────────────────────────────────────────────────

type HeroBadgeTone = {
  tone: 'primary' | 'success' | 'neutral' | 'info';
  variant: 'solid' | 'soft';
};

const HERO_ESTADO_TONE: Record<ItemEstado, HeroBadgeTone> = {
  en_vivo: { tone: 'primary', variant: 'solid' },
  pendiente: { tone: 'info', variant: 'soft' },
  vendido: { tone: 'success', variant: 'soft' },
  no_vendido: { tone: 'neutral', variant: 'soft' },
};

// ── Estilos ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg,
  },
  errorWrap: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  hero: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTopLeft: {
    position: 'absolute',
    top: spacing.base,
    left: spacing.base,
  },
  heroBottomRight: {
    position: 'absolute',
    bottom: spacing.base,
    right: spacing.base,
  },
  currencyBadge: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  currencyText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: letterSpacing.wider,
  },
  body: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    gap: spacing.base,
  },
  overline: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  titulo: {
    marginTop: -spacing.xs,
  },
  autor: {
    marginTop: -spacing.sm,
  },
  priceCard: {
    marginTop: spacing.sm,
  },
  priceCardInner: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    padding: spacing.base,
  },
  priceLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  priceValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  tabBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    letterSpacing: letterSpacing.wide,
  },
  tabLabelActive: {
    color: colors.textInverse,
  },
  tabPanel: {
    gap: spacing.base,
  },
  tabEmpty: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  tabEmptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    paddingHorizontal: spacing.base,
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderMuted,
  },
  descripcionWrap: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  descripcionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  descripcion: {
    color: colors.textLabel,
    lineHeight: fontSize.lg * 1.5,
  },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.base,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  footerBadgeWrap: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
