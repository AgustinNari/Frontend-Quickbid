import React, { useEffect, useState } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
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
  IconName,
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
import BottomNavBar, {
  NavTab,
  BOTTOM_NAV_HEIGHT,
} from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { SubastaInfoRow } from '../components/SubastaInfoRow';
import { SEGMENTO_THEME } from '../components/SubastaCard';
import { subastasApi } from '../api/subastas';
import { userFacingError } from '../api/client';
import { mapItemDetalle, mapSubastaDetalle } from '../mappers/subastas';
import { formatPrecio } from '../utils/format';
import {
  ItemDetalle,
  ItemEstado,
  ITEM_ESTADO_LABEL,
  SEGMENTO_LABEL,
} from '../types/subasta';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemDetail'>;

type ItemTab = 'detalles' | 'historia' | 'datos';

export default function ItemDetailScreen({ navigation, route }: Props) {
  const { estadoCuenta, isAuthenticated, isGuest } = useAuth();
  const { itemId, subastaId } = route.params;
  const [activeTab, setActiveTab] = useState<NavTab>('subastas');
  const [itemTab, setItemTab] = useState<ItemTab>('detalles');
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ItemDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, subastaId]);

  const loadItem = async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemDto, subastaDto] = await Promise.all([
        subastasApi.item(Number(itemId)),
        subastasApi.detalle(Number(subastaId)),
      ]);
      setItem(mapItemDetalle(itemDto, mapSubastaDetalle(subastaDto)));
    } catch (loadError) {
      setItem(null);
      setError(userFacingError(loadError, 'No pudimos cargar el lote.'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigation.goBack();

  const handlePujar = () => {
    if (estadoCuenta === 'bloqueada_permanente') {
      navigation.navigate('LimitedAccess');
      return;
    }
    if (isGuest) {
      navigation.navigate('PujaEnVivo', { subastaId });
      return;
    }
    navigation.navigate('PujaEnVivo', { subastaId });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={handleBack} />

      {loading ? (
        <Loader fullScreen label="Cargando ítem..." />
      ) : !item ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="alert" size={48} color={colors.textSubtle} />}
            title="No pudimos cargar el lote"
            description={error ?? 'El lote no existe o no está disponible.'}
            actionLabel="Reintentar"
            onAction={() => loadItem()}
          />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <Hero item={item} />

            <View style={styles.body}>
              <Typography style={styles.overline}>LOTE {item.lote}</Typography>

              <Heading style={styles.titulo}>{item.titulo}</Heading>

              {item.autor ? (
                <Body muted style={styles.autor}>
                  {item.autor}
                </Body>
              ) : null}

              {isAuthenticated && item.precioBase !== undefined ? (
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
                  label="Datos"
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
            onPujar={handlePujar}
          />
        </>
      )}

      <BottomNavBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

function Hero({ item }: { item: ItemDetalle }) {
  const theme = SEGMENTO_THEME[item.segmento];
  const estadoTone = HERO_ESTADO_TONE[item.estado];
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(item.imagen) && !imageFailed;
  return (
    <View style={[styles.hero, { backgroundColor: theme.bg }]}>
      {showImage ? (
        <Image
          source={{ uri: item.imagen }}
          style={styles.heroImage}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Icon name={theme.icon} size={96} color={theme.fg} />
      )}

      <View style={styles.heroTopLeft}>
        <Badge tone={estadoTone.tone} variant={estadoTone.variant}>
          {item.estado === 'en_vivo' ? '● ' : ''}
          {ITEM_ESTADO_LABEL[item.estado]}
        </Badge>
      </View>

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
  onPujar,
}: {
  estado: ItemEstado;
  onPujar: () => void;
}) {
  if (estado === 'sin_estado') {
    return null;
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
          leftIcon={
            <Icon name="plus-circle" color={colors.textInverse} size={18} />
          }
        >
          Pujar ahora
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.footer}>
      <View style={styles.footerBadgeWrap}>
        <Badge tone="info" variant="soft">
          Lote programado
        </Badge>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

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

const LONG_TEXT_PREVIEW_LINES = 3;

function ReadableInfoRow({
  icon,
  label,
  value,
  openFullTextEnabled = false,
}: {
  icon: IconName;
  label: string;
  value: string;
  openFullTextEnabled?: boolean;
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const openFullText = () => {
    if (openFullTextEnabled) {
      setModalVisible(true);
    }
  };

  const rowContent = (
    <>
      <View style={styles.iconTile}>
        <Icon name={icon} size={18} color={colors.textMuted} />
      </View>
      <View style={styles.readableTextWrap}>
        <Typography style={styles.readableLabel}>{label}</Typography>
        <Typography
          numberOfLines={LONG_TEXT_PREVIEW_LINES}
          style={styles.readableValue}
        >
          {value}
        </Typography>
        {openFullTextEnabled ? (
          <View style={styles.readFullButton}>
            <Typography style={styles.readFullLabel}>Leer completo</Typography>
          </View>
        ) : null}
      </View>
    </>
  );

  return (
    <>
      {openFullTextEnabled ? (
        <TouchableOpacity
          onPress={openFullText}
          activeOpacity={0.75}
          style={styles.readableRow}
        >
          {rowContent}
        </TouchableOpacity>
      ) : (
        <View style={styles.readableRow}>{rowContent}</View>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Typography style={styles.modalTitle}>{label}</Typography>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator
            >
              <Body style={styles.modalBody}>{value}</Body>
            </ScrollView>
            <Button variant="secondary" onPress={() => setModalVisible(false)}>
              Cerrar
            </Button>
          </View>
        </View>
      </Modal>
    </>
  );
}

function TabDetalles({ item }: { item: ItemDetalle }) {
  return (
    <View style={styles.infoList}>
      {item.descripcion ? (
        <>
          <ReadableInfoRow
            icon="check-doc"
            label="Descripción"
            value={item.descripcion}
            openFullTextEnabled
          />
          <Divider />
        </>
      ) : null}
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

function TabHistoria({ item }: { item: ItemDetalle }) {
  const hasContent = item.historia || item.historiaExtendida;
  if (!hasContent) {
    return <TabEmpty mensaje="Este lote aún no tiene historia cargada." />;
  }
  return (
    <View style={styles.tabPanel}>
      <View style={styles.infoList}>
        {item.historia ? (
          <ReadableInfoRow
            icon="bank"
            label="Historia / procedencia"
            value={item.historia}
            openFullTextEnabled
          />
        ) : null}
        {item.historia && item.historiaExtendida ? <Divider /> : null}
        {item.historiaExtendida ? (
          <ReadableInfoRow
            icon="check-doc"
            label="Historia extendida"
            value={item.historiaExtendida}
            openFullTextEnabled
          />
        ) : null}
      </View>
    </View>
  );
}

function TabDatos({ item }: { item: ItemDetalle }) {
  const dataRows = [
    item.duenioActual
      ? { icon: 'bank' as const, label: 'Dueño actual', value: item.duenioActual }
      : null,
    item.fechaObjeto
      ? { icon: 'calendar' as const, label: 'Fecha / año aproximado', value: item.fechaObjeto }
      : null,
    item.artistaDisenador
      ? { icon: 'star' as const, label: 'Artista / diseñador', value: item.artistaDisenador }
      : null,
    item.segmentoConsignacion
      ? { icon: 'image' as const, label: 'Segmento', value: humanize(item.segmentoConsignacion) }
      : null,
    item.categoriaAsignada
      ? { icon: 'check-circle' as const, label: 'Categoría asignada', value: humanize(item.categoriaAsignada) }
      : null,
  ].filter(Boolean) as Array<{
    icon: 'bank' | 'calendar' | 'star' | 'image' | 'check-circle';
    label: string;
    value: string;
  }>;
  const hasContent = dataRows.length > 0 || item.dimensiones || item.condicion;
  if (!hasContent) {
    return <TabEmpty mensaje="Sin datos adicionales para este lote." />;
  }
  return (
    <View style={styles.infoList}>
      {dataRows.map((row, index) => (
        <React.Fragment key={row.label}>
          {index > 0 ? <Divider /> : null}
          <SubastaInfoRow
            icon={row.icon}
            label={row.label}
            value={row.value}
          />
        </React.Fragment>
      ))}
      {dataRows.length > 0 && (item.dimensiones || item.condicion) ? (
        <Divider />
      ) : null}
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
    </View>
  );
}

function humanize(value: string) {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w|\s\w/g, match => match.toUpperCase());
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

type HeroBadgeTone = {
  tone: 'primary' | 'success' | 'neutral' | 'info';
  variant: 'solid' | 'soft';
};

const HERO_ESTADO_TONE: Record<ItemEstado, HeroBadgeTone> = {
  en_vivo: { tone: 'primary', variant: 'solid' },
  pendiente: { tone: 'info', variant: 'soft' },
  vendido: { tone: 'success', variant: 'soft' },
  no_vendido: { tone: 'neutral', variant: 'soft' },
  comprado_por_empresa: { tone: 'neutral', variant: 'soft' },
  sin_estado: { tone: 'neutral', variant: 'soft' },
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.xl,
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
  heroImage: {
    width: '100%',
    height: '100%',
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
  readableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readableTextWrap: {
    flex: 1,
    gap: 2,
  },
  readableLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  readableValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text,
    lineHeight: fontSize.base * 1.45,
  },
  readFullButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingTop: 2,
    paddingRight: spacing.sm,
    paddingBottom: 2,
  },
  readFullLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing['3xl'],
  },
  modalCard: {
    maxHeight: '82%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.base,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalScrollContent: {
    paddingBottom: spacing.sm,
  },
  modalBody: {
    color: colors.textLabel,
    lineHeight: fontSize.lg * 1.5,
  },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.base,
    marginBottom: BOTTOM_NAV_HEIGHT + spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  footerBadgeWrap: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
