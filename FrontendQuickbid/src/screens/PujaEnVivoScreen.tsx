import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  Badge,
  Body,
  Button,
  Card,
  EmptyState,
  Heading,
  Icon,
  Loader,
  Typography,
} from '../ui';
import {
  colors,
  fontSize,
  fontWeight,
  layout,
  letterSpacing,
  radius,
  spacing,
} from '../theme';
import BottomNavBar, {
  BOTTOM_NAV_HEIGHT,
  NavTab,
} from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { SEGMENTO_THEME } from '../components/SubastaCard';
import { useAuth } from '../context/AuthContext';
import { userFacingError } from '../api/client';
import { createLiveRealtimeClient } from '../api/realtime';
import { DropdownSelector } from '../components/DropdownSelector';
import { createBidIdempotencyKey, pujasApi } from '../api/pujas';
import { subastasApi } from '../api/subastas';
import { mediosPagoApi } from '../api/mediosPago';
import { mapItemDetalle, mapSubastaDetalle } from '../mappers/subastas';
import {
  applyPujaEvent,
  calcularLimites,
  mapPujaActual,
} from '../mappers/pujas';
import { formatPrecio } from '../utils/format';
import {
  canMedioPagoCoverAmount,
  getMedioPagoLimitUsage,
  MedioPagoDto,
} from '../types/mediosPago';
import {
  formatPaymentMethodLabel,
  paymentMethodTypeLabel,
} from '../utils/displayLabels';
import { PujaActual, PujaEventoApi } from '../types/puja';
import { useNetwork } from '../context/NetworkContext';

type Props = NativeStackScreenProps<RootStackParamList, 'PujaEnVivo'>;

type FeedbackTone = 'success' | 'danger' | 'info';

type Feedback = {
  tone: FeedbackTone;
  title: string;
  message: string;
};

type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'offline';

export default function PujaEnVivoScreen({ navigation, route }: Props) {
  const { subastaId } = route.params;
  const {
    accessToken,
    canPerformEconomicActions,
    estadoCuenta,
    isAuthenticated,
    isGuest,
  } = useAuth();
  const { type: connectionType, confirmHeavyAction } = useNetwork();
  const [activeTab, setActiveTab] = useState<NavTab>('subastas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [puja, setPuja] = useState<PujaActual | null>(null);
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('idle');
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [networkConfirmed, setNetworkConfirmed] = useState(false);
  const pujaRef = useRef<PujaActual | null>(null);
  const networkPromptHandled = useRef(false);

  const liveId = Number(subastaId);
  const realtimeSubastaId = puja?.subastaId ?? null;
  const realtimeItemId = puja?.item.id ?? null;

  const loadLive = useCallback(async () => {
    if (!networkConfirmed) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [snapshot, subastaDto, verification, mediosUsuario] =
        await Promise.all([
        pujasApi.pujaActual(liveId),
        subastasApi.detalle(liveId),
        subastasApi.verificarAcceso(liveId),
        mediosPagoApi.listar(),
      ]);

      if (!snapshot.itemActivoId) {
        setPuja(null);
        setError('Esta subasta no tiene un lote activo en este momento.');
        return;
      }

      const itemDto = await subastasApi.item(snapshot.itemActivoId);
      const subasta = mapSubastaDetalle(subastaDto);
      const item = mapItemDetalle(itemDto, subasta);
      const idsHabilitados = new Set(
        (
          verification.mediosPagoVerificadosVigentesCompatiblesParaPuja ?? []
        ).map(medio => medio.id),
      );
      setPuja(
        mapPujaActual(
          snapshot,
          subasta,
          item,
          mediosUsuario.filter(medio => idsHabilitados.has(medio.id)),
        ),
      );
    } catch (loadError) {
      setPuja(null);
      setError(readableError(loadError, 'No pudimos cargar la sala de puja.'));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, liveId, networkConfirmed]);

  useEffect(() => {
    if (networkPromptHandled.current || connectionType === 'unknown') return;
    networkPromptHandled.current = true;
    confirmHeavyAction().then(confirmed => {
      if (confirmed) setNetworkConfirmed(true);
      else navigation.goBack();
    });
  }, [confirmHeavyAction, connectionType, navigation]);

  useEffect(() => {
    loadLive();
  }, [loadLive]);

  useEffect(() => {
    pujaRef.current = puja;
  }, [puja]);

  const winningRetentionActive = Boolean(
    puja?.esGanadorActual && puja.retencionHasta && (secondsRemaining ?? 0) > 0,
  );

  const explainNavigationLock = useCallback(() => {
    setFeedback({
      tone: 'info',
      title: 'Debés permanecer en la sala',
      message:
        'Tenés la mejor oferta. Debés permanecer en la sala hasta que te superen o finalice la retención.',
    });
  }, []);

  useEffect(() => {
    if (!winningRetentionActive) return;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        explainNavigationLock();
        return true;
      },
    );
    return () => subscription.remove();
  }, [explainNavigationLock, winningRetentionActive]);

  useEffect(() => {
    if (!puja?.retencionHasta) {
      setSecondsRemaining(null);
      return;
    }
    let refreshed = false;
    const tick = () => {
      const until = Date.parse(puja.retencionHasta as string);
      const serverNow = Date.now() + puja.serverTimeOffsetMs;
      const remaining = Number.isNaN(until)
        ? 0
        : Math.max(0, Math.ceil((until - serverNow) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0 && !refreshed) {
        refreshed = true;
        loadLive();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [loadLive, puja?.retencionHasta, puja?.serverTimeOffsetMs]);

  const handleRealtimeEvent = useCallback(
    (event: PujaEventoApi) => {
      if (event.tipo === 'LOTE_ACTIVADO') {
        loadLive();
        return;
      }
      setPuja(current => {
        if (!current) return current;
        if (event.subastaId && String(event.subastaId) !== current.subastaId)
          return current;
        if (
          event.itemCatalogoId &&
          String(event.itemCatalogoId) !== current.item.id
        )
          return current;
        return applyPujaEvent(current, event);
      });

      if (event.tipo === 'PUJA_ACEPTADA') {
        setFeedback({
          tone: 'success',
          title: 'Puja aceptada',
          message:
            event.monto != null
              ? `Tu oferta de ${formatPrecio(
                  event.monto,
                  event.moneda === 'USD' ? 'USD' : 'ARS',
          )} quedó registrada.`
              : 'Tu oferta quedó registrada.',
        });
      } else if (event.tipo === 'PUJA_SUPERADA') {
        setFeedback({
          tone: 'info',
          title: 'Tu puja fue superada',
          message:
            'Otro postor acaba de superar tu oferta. Podés ofertar otra vez si el lote sigue abierto.',
        });
      } else if (event.tipo === 'PUJA_RECHAZADA') {
        setFeedback({
          tone: 'danger',
          title: 'Puja rechazada',
          message:
            event.message ??
            'No pudimos registrar la oferta. Actualizá la sala e intentá nuevamente.',
        });
      } else if (event.tipo === 'LOTE_CERRADO') {
        setFeedback({
          tone: 'info',
          title: 'Lote cerrado',
          message: event.proximoLoteProgramadoAt
            ? 'Este lote ya cerró. El próximo lote comienza en instantes.'
            : 'Este lote ya cerró. la subasta está por finalizar.',
        });
      } else if (event.tipo === 'LOTE_GANADO') {
        const current = pujaRef.current;
        navigation.replace('PujaExito', {
          subastaId: String(event.subastaId ?? current?.subastaId),
          itemId: String(event.itemCatalogoId ?? current?.item.id),
          montoFinal: event.montoAdjudicacion ?? current?.mejorOferta ?? 0,
          numeroPostor: current?.numeroPostorGanador ?? undefined,
        });
      } else if (event.tipo === 'SUBASTA_INICIADA') {
        setFeedback({
          tone: 'info',
          title: 'Subasta en vivo',
          message: 'La subasta acaba de comenzar.',
        });
      } else if (event.tipo === 'SUBASTA_FINALIZADA') {
        setFeedback({
          tone: 'info',
          title: 'Subasta finalizada',
          message: 'La subasta termino. Gracias por participar.',
        });
      } else if (
        event.tipo !== 'MEJOR_OFERTA_ACTUALIZADA' &&
        event.tipo !== 'ESTADO_ACTUALIZADO'
      ) {
        console.warn('Evento live no reconocido', event);
      }
    },
    [loadLive, navigation],
  );

  useEffect(() => {
    if (
      !accessToken ||
      !realtimeSubastaId ||
      !realtimeItemId ||
      isGuest ||
      (estadoCuenta !== 'activa' && estadoCuenta !== 'restriccion_multa')
    ) {
      return;
    }

    setRealtimeStatus('connecting');
    const client = createLiveRealtimeClient({
      subastaId: Number(realtimeSubastaId),
      itemId: Number(realtimeItemId),
      accessToken,
      includePrivateQueues: isAuthenticated,
      onEvent: handleRealtimeEvent,
      onConnected: () => setRealtimeStatus('connected'),
      onDisconnected: () =>
        setRealtimeStatus(current =>
          current === 'connected' ? 'offline' : current,
        ),
      onError: () => setRealtimeStatus('offline'),
    });

    client.connect();
    return () => client.disconnect();
  }, [
    accessToken,
    estadoCuenta,
    handleRealtimeEvent,
    isAuthenticated,
    isGuest,
    realtimeItemId,
    realtimeSubastaId,
  ]);

  const refreshSnapshot = async () => {
    await loadLive();
  };

  const handleOpenBid = () => {
    if (!puja) return;
    if (isGuest || !isAuthenticated) {
      setFeedback({
        tone: 'info',
        title: 'Acceso limitado',
        message: 'Iniciá sesión para ver la sala en vivo y ofertar.',
      });
      return;
    }
    if (estadoCuenta === 'restriccion_multa') {
      setFeedback({
        tone: 'danger',
        title: 'Puja bloqueada',
        message:
          'Tu cuenta tiene una restricción por multa. Podés mirar la sala, pero no pujar.',
      });
      return;
    }
    if (estadoCuenta === 'bloqueada_permanente') {
      setFeedback({
        tone: 'danger',
        title: 'Cuenta bloqueada',
        message: 'tu cuenta está bloqueada y no puede operar en subastas.',
      });
      return;
    }
    if (!canPerformEconomicActions || !puja.puedePujar) {
      setFeedback({
        tone: 'info',
        title: 'No podés pujar ahora',
        message: puja.motivoNoPuedePujar ?? bloqueoPujaMessage(puja),
      });
      return;
    }
    setBidModalVisible(true);
  };

  const handleConfirmBid = async (monto: number, medioPagoId: number) => {
    if (!puja || submitting) return;
    setSubmitting(true);
    setBidModalVisible(false);
    const idempotencyKey = createBidIdempotencyKey();
    try {
      const response = await pujasApi.pujar(Number(puja.subastaId), {
        itemCatalogoId: Number(puja.item.id),
        monto,
        medioPagoId,
        clientStateVersion: puja.versionEstado,
        idempotencyKey,
      });
      setPuja(current =>
        current
          ? applyPujaEvent(current, {
              tipo: 'PUJA_ACEPTADA',
              subastaId: response.subastaId,
              itemCatalogoId: response.itemCatalogoId,
              pujaId: response.id,
              monto: response.monto,
              moneda: response.moneda,
              secuencia: response.secuencia,
              versionEstado: response.versionEstado,
              numeroPostor: response.numeroPostor,
              postorAlias:
                response.numeroPostor != null
                  ? `Postor #${response.numeroPostor}`
                  : 'Tu oferta',
              retencionHasta: response.retencionHasta,
            })
          : current,
      );
      setFeedback({
        tone: 'success',
        title: response.idempotentReplay
          ? 'Oferta ya registrada'
          : 'Oferta aceptada',
        message: `${formatPrecio(
          response.monto,
          response.moneda === 'USD' ? 'USD' : 'ARS',
            )} quedó registrada.`,
      });
    } catch (bidError) {
      const message = readableError(bidError, 'No pudimos registrar la puja.');
      setFeedback({
        tone: 'danger',
        title: 'No se pudo procesar la puja',
        message,
      });
      await refreshSnapshot();
    } finally {
      setSubmitting(false);
    }
  };

  if (isGuest || !isAuthenticated) {
    return (
      <LiveShell
        navigation={navigation}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      >
        <EmptyState
          icon={<Icon name="lock" size={48} color={colors.textSubtle} />}
          title="Acceso limitado"
          description="La sala en vivo muestra importes y eventos protegidos. Iniciá sesión para entrar a la sala de puja."
          actionLabel="Ir al inicio de sesión"
          onAction={() => navigation.navigate('Login')}
        />
      </LiveShell>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        onBack={
          winningRetentionActive
            ? explainNavigationLock
            : () => navigation.goBack()
        }
      />

      {loading ? (
        <Loader fullScreen label="Entrando a la sala..." />
      ) : !puja ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="clock" size={48} color={colors.textSubtle} />}
            title={error ? 'Conexión en vivo no disponible' : 'No hay lote activo'}
            description={
              error ?? 'Esta subasta no tiene un lote activo en este momento.'
            }
            actionLabel="Reintentar"
            onAction={refreshSnapshot}
          />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.body}>
              <SalaHeader puja={puja} realtimeStatus={realtimeStatus} />
              {realtimeStatus === 'offline' ? (
                <StatusBanner
                  tone="danger"
                  icon="alert"
                  text="La actualización en vivo no está disponible. Podés refrescar antes de ofertar."
                  actionLabel="Reintentar"
                  onAction={refreshSnapshot}
                />
              ) : null}
              {estadoCuenta === 'restriccion_multa' ? (
                <StatusBanner
                  tone="danger"
                  icon="alert"
                  text="Cuenta restringida por multa: podés mirar la sala en vivo, pero no pujar."
                />
              ) : null}
              {!puja.puedePujar ? (
                <StatusBanner
                  tone="info"
                  icon="info"
                  text={puja.motivoNoPuedePujar ?? bloqueoPujaMessage(puja)}
                />
              ) : null}
              {winningRetentionActive ? (
                <StatusBanner
                  tone="info"
                  icon="info"
                  text="Tenés la mejor oferta. Debés permanecer en la sala hasta que te superen o finalice la retención."
                />
              ) : null}
              <ItemEnVivoCard puja={puja} />
              <MejorOfertaBlock
                puja={puja}
                secondsRemaining={secondsRemaining}
              />
              <PujarButton
                puja={puja}
                submitting={submitting}
                onPress={handleOpenBid}
              />
              <HistorialReciente puja={puja} />
              <View style={styles.liveNavigationActions}>
                <Button
                  variant="secondary"
                  disabled={winningRetentionActive}
                  onPress={
                    winningRetentionActive
                      ? explainNavigationLock
                      : () =>
                          navigation.navigate('ItemDetail', {
                            itemId: puja.item.id,
                            subastaId: puja.subastaId,
                          })
                  }
                >
                  Ver detalle del artículo
                </Button>
                <Button
                  variant="secondary"
                  disabled={winningRetentionActive}
                  onPress={
                    winningRetentionActive
                      ? explainNavigationLock
                      : () =>
                          navigation.navigate('CatalogoSubasta', {
                            subastaId: puja.subastaId,
                            titulo: puja.subastaTitulo,
                          })
                  }
                >
                  Ver catálogo
                </Button>
              </View>
            </View>
          </ScrollView>

          <BidModal
            visible={bidModalVisible}
            puja={puja}
            submitting={submitting}
            onClose={() => setBidModalVisible(false)}
            onConfirm={handleConfirmBid}
            onManage={() => {
              setBidModalVisible(false);
              navigation.navigate('MetodosPago');
            }}
          />
          <SubmittingOverlay visible={submitting} puja={puja} />
        </>
      )}

      <FeedbackModal feedback={feedback} onClose={() => setFeedback(null)} />
      <BottomNavBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        navigation={navigation}
        locked={winningRetentionActive}
        onLockedPress={explainNavigationLock}
      />
    </SafeAreaView>
  );
}

function LiveShell({
  navigation,
  activeTab,
  setActiveTab,
  children,
}: {
  navigation: Props['navigation'];
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />
      <View style={styles.errorWrap}>{children}</View>
      <BottomNavBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

function SalaHeader({
  puja,
  realtimeStatus,
}: {
  puja: PujaActual;
  realtimeStatus: RealtimeStatus;
}) {
  return (
    <View style={styles.salaHeader}>
      <View style={styles.salaHeaderTop}>
        <Badge tone="danger">EN VIVO</Badge>
        <View style={styles.realtimePill}>
          <View
            style={[
              styles.realtimeDot,
              realtimeStatus === 'connected'
                ? styles.realtimeDotOk
                : styles.realtimeDotWarn,
            ]}
          />
          <Typography style={styles.realtimeText}>
            {realtimeStatus === 'connected'
              ? 'En vivo'
              : realtimeStatus === 'connecting'
              ? 'Conectando'
              : 'Actualizar'}
          </Typography>
        </View>
      </View>
      <Heading style={styles.salaTitulo}>{puja.subastaTitulo}</Heading>
      <Body muted style={styles.salaSubtitulo}>
        Lote en subasta ahora
      </Body>
    </View>
  );
}

function StatusBanner({
  tone,
  icon,
  text,
  actionLabel,
  onAction,
}: {
  tone: 'info' | 'danger';
  icon: 'info' | 'alert';
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View
      style={[
        styles.statusBanner,
        tone === 'danger' ? styles.statusDanger : styles.statusInfo,
      ]}
    >
      <Icon
        name={icon}
        size={18}
        color={tone === 'danger' ? colors.danger : colors.primary}
      />
      <Body style={styles.statusText}>{text}</Body>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} hitSlop={hitSlop}>
          <Typography style={styles.statusAction}>{actionLabel}</Typography>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function ItemEnVivoCard({ puja }: { puja: PujaActual }) {
  const theme = SEGMENTO_THEME[puja.item.segmento];
  return (
    <Card variant="flat" padding="none" style={styles.itemCard}>
      <View style={[styles.itemHero, { backgroundColor: theme.bg }]}>
        <Icon name={theme.icon} size={72} color={theme.fg} />
        <View style={styles.loteBadge}>
          <Typography style={styles.loteText}>LOTE {puja.item.lote}</Typography>
        </View>
      </View>
      <View style={styles.itemInfo}>
        <Heading style={styles.itemTitulo}>{puja.item.titulo}</Heading>
        {puja.item.descripcion ? (
          <Body muted numberOfLines={2}>
            {puja.item.descripcion}
          </Body>
        ) : null}
        <View style={styles.precioBaseRow}>
          <Typography style={styles.precioBaseLabel}>Precio base</Typography>
          <Typography style={styles.precioBaseValue}>
            {formatPrecio(puja.precioBase, puja.moneda)}
          </Typography>
        </View>
      </View>
    </Card>
  );
}

function MejorOfertaBlock({
  puja,
  secondsRemaining,
}: {
  puja: PujaActual;
  secondsRemaining: number | null;
}) {
  const hayOferta = puja.mejorOferta != null;
  return (
    <View style={styles.mejorOfertaWrap}>
      <Typography style={styles.mejorOfertaLabel}>
        MEJOR OFERTA ACTUAL
      </Typography>
      {hayOferta ? (
        <>
          <View style={styles.postorRow}>
            <View style={styles.postorDot} />
            <Typography style={styles.postorText}>
              {puja.esGanadorActual
                ? 'Tu oferta va ganando'
                : puja.postorGanadorAlias ?? 'Mejor postor'}
            </Typography>
          </View>
          <Typography style={styles.mejorOfertaValue}>
            {formatPrecio(puja.mejorOferta as number, puja.moneda)}
          </Typography>
        </>
      ) : (
        <>
          <Typography style={styles.postorText}>
            todavía nadie pujo. La primera oferta puede ser el precio base.
          </Typography>
          <Typography style={styles.mejorOfertaValue}>
            {formatPrecio(puja.precioBase, puja.moneda)}
          </Typography>
        </>
      )}
      <Typography style={styles.versionText}>
        Última actualización reciente
      </Typography>
      {secondsRemaining != null ? (
        <View style={styles.countdownRow}>
          <Icon name="clock" size={18} color={colors.warning} />
          <Typography style={styles.countdownText}>
            Retencion: {formatCountdown(secondsRemaining)}
          </Typography>
        </View>
      ) : null}
    </View>
  );
}

function PujarButton({
  puja,
  submitting,
  onPress,
}: {
  puja: PujaActual;
  submitting: boolean;
  onPress: () => void;
}) {
  if (puja.subastaFinalizada) {
    return <Button variant="secondary" disabled>Subasta finalizada</Button>;
  }
  if (puja.loteCerrado) {
    return (
      <Button variant="secondary" disabled>
        {puja.proximoLoteAt ? 'Lote cerrado - esperando próximo lote' : 'Lote cerrado'}
      </Button>
    );
  }
  if (puja.esGanadorActual) {
    return (
      <Button variant="secondary" disabled>
        Tenés la oferta ganadora
      </Button>
    );
  }
  return (
    <Button
      onPress={onPress}
      loading={submitting}
      leftIcon={
        <Icon name="plus-circle" color={colors.textInverse} size={18} />
      }
    >
      PUJAR AHORA
    </Button>
  );
}

function HistorialReciente({ puja }: { puja: PujaActual }) {
  return (
    <View style={styles.historialWrap}>
      <Typography style={styles.historialLabel}>EVENTOS RECIENTES</Typography>
      <Card variant="flat" padding="none" style={styles.historialCard}>
        {puja.historialReciente.length === 0 ? (
          <Body muted style={styles.emptyHistory}>
            Todavía no hay ofertas para este lote.
          </Body>
        ) : (
          puja.historialReciente.map((item, index) => (
            <View key={item.id}>
              {index > 0 ? <View style={styles.historialDivider} /> : null}
              <View style={styles.historialRow}>
                <Icon name="user" size={18} color={colors.textMuted} />
                <View style={styles.historialInfo}>
                  <Typography style={styles.historialPostor}>
                    {item.postorAlias}
                  </Typography>
                  <Typography style={styles.historialTiempo}>
                    {item.ganadora
                      ? 'Mejor oferta actual'
                      : 'Oferta actualizada'}
                  </Typography>
                </View>
                <Typography
                  style={[
                    styles.historialMonto,
                    item.ganadora ? styles.historialMontoGanadora : null,
                  ]}
                >
                  {formatPrecio(item.monto, puja.moneda)}
                </Typography>
              </View>
            </View>
          ))
        )}
      </Card>
    </View>
  );
}

function BidModal({
  visible,
  puja,
  submitting,
  onClose,
  onConfirm,
  onManage,
}: {
  visible: boolean;
  puja: PujaActual;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (monto: number, medioPagoId: number) => void;
  onManage: () => void;
}) {
  const limites = useMemo(
    () => calcularLimites(puja.mejorOferta, puja.precioBase, puja.categoria),
    [puja.categoria, puja.mejorOferta, puja.precioBase],
  );
  const [amountText, setAmountText] = useState(String(limites.minimo));
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const parsedAmount = parseAmount(amountText);
  const eligibleMedios = useMemo(
    () =>
      parsedAmount == null
        ? []
        : puja.mediosParaPujar.filter(medio =>
            canMedioPagoCoverAmount(medio, parsedAmount),
          ),
    [parsedAmount, puja.mediosParaPujar],
  );

  useEffect(() => {
    if (visible) {
      setAmountText(String(limites.minimo));
      setPaymentId(
        puja.mediosParaPujar.find(medio => medio.principal)?.id ??
          puja.mediosParaPujar[0]?.id ??
          null,
      );
      setError(null);
    }
  }, [limites.minimo, puja.mediosParaPujar, visible]);

  useEffect(() => {
    setPaymentId(current =>
      eligibleMedios.some(medio => medio.id === current)
        ? current
        : eligibleMedios.find(medio => medio.principal)?.id ??
          eligibleMedios[0]?.id ??
          null,
    );
  }, [eligibleMedios]);

  const selectedPayment =
    eligibleMedios.find(medio => medio.id === paymentId) ?? null;

  const confirm = () => {
    const amount = parsedAmount;
    if (amount == null) {
      setError('Ingresá un monto válido.');
      return;
    }
    if (amount <= 0) {
      setError('El monto debe ser mayor a cero.');
      return;
    }
    if (amount < limites.minimo) {
      setError(
          `El mínimo para esta oferta es ${formatPrecio(
          limites.minimo,
          puja.moneda,
        )}.`,
      );
      return;
    }
    if (limites.maximo != null && amount > limites.maximo) {
      setError(
          `El máximo para esta oferta es ${formatPrecio(
          limites.maximo,
          puja.moneda,
        )}.`,
      );
      return;
    }
    if (!selectedPayment) {
      setError('Necesitás un medio de pago verificado compatible.');
      return;
    }
    onConfirm(amount, selectedPayment.id);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.sheetBackdrop}>
        <TouchableOpacity
          style={styles.sheetBackdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Heading style={styles.sheetTitle}>Tu oferta</Heading>
            <TouchableOpacity onPress={onClose} hitSlop={hitSlop}>
              <Icon name="x" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.amountBox}>
            <Typography style={styles.amountCurrency}>{puja.moneda}</Typography>
            <TextInput
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="decimal-pad"
              editable={!submitting}
              style={styles.amountInput}
              placeholder={String(limites.minimo)}
              placeholderTextColor={colors.textSubtle}
            />
          </View>

          <View style={styles.limitsRow}>
            <LimitCol
              label="Monto mínimo"
              value={formatPrecio(limites.minimo, puja.moneda)}
            />
            <View style={styles.limitDivider} />
            <LimitCol
          label="Monto máximo"
              value={
                limites.maximo != null
                  ? formatPrecio(limites.maximo, puja.moneda)
                  : 'Sin tope'
              }
            />
          </View>

          <PaymentSelector
            medios={eligibleMedios}
            selectedId={paymentId}
            onSelect={setPaymentId}
            onManage={onManage}
          />

          {error ? (
            <Typography style={styles.formError}>{error}</Typography>
          ) : null}

          <Button
            onPress={confirm}
            loading={submitting}
            disabled={!selectedPayment}
            rightIcon={
              <Icon name="arrow-right" color={colors.textInverse} size={18} />
            }
          >
            CONFIRMAR PUJA
          </Button>
        </View>
      </View>
    </Modal>
  );
}

function LimitCol({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.limitCol}>
      <Typography style={styles.limitLabel}>{label}</Typography>
      <Typography style={styles.limitValue}>{value}</Typography>
    </View>
  );
}

function PaymentSelector({
  medios,
  selectedId,
  onSelect,
  onManage,
}: {
  medios: MedioPagoDto[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onManage: () => void;
}) {
  return (
    <View style={styles.paymentWrap}>
      <Typography style={styles.paymentTitle}>Método de pago</Typography>
      {medios.length === 0 ? (
        <View style={styles.emptyPayment}>
          <Body muted>
            No hay medios verificados con límite suficiente para este monto.
          </Body>
          <Button variant="secondary" size="sm" onPress={onManage}>
            Gestionar medios de pago
          </Button>
        </View>
      ) : (
        <DropdownSelector
          testID="bid-payment-dropdown"
          options={medios.map(medio => ({
            id: medio.id,
            label: formatPaymentMethodLabel(medio),
            description: `${paymentMethodTypeLabel(medio.tipo)} - ${
              medio.moneda
            } - Disponible ${formatPrecio(
              getMedioPagoLimitUsage(medio)?.available ?? 0,
              medio.moneda,
            )}`,
          }))}
          selectedId={selectedId}
          onSelect={value => onSelect(Number(value))}
        />
      )}
    </View>
  );
}

function SubmittingOverlay({
  visible,
  puja,
}: {
  visible: boolean;
  puja: PujaActual | null;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlayBackdrop}>
        <View style={styles.overlayCard}>
          <View style={styles.spinnerWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Heading style={styles.overlayTitle}>Enviando tu puja...</Heading>
          <Body muted style={styles.overlayText}>
            Estamos procesando tu oferta.
          </Body>
          {puja ? (
            <View style={styles.overlaySummary}>
              <Typography style={styles.overlaySummaryLabel}>
                ARTÍCULO
              </Typography>
              <Typography style={styles.overlaySummaryValue} numberOfLines={1}>
                {puja.item.titulo}
              </Typography>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function FeedbackModal({
  feedback,
  onClose,
}: {
  feedback: Feedback | null;
  onClose: () => void;
}) {
  if (!feedback) return null;
  const color =
    feedback.tone === 'success'
      ? colors.success
      : feedback.tone === 'danger'
      ? colors.danger
      : colors.primary;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlayBackdrop}>
        <View style={styles.feedbackCard}>
          <View
            style={[styles.feedbackIcon, { backgroundColor: `${color}22` }]}
          >
            <Icon
              name={
                feedback.tone === 'success'
                  ? 'check-circle'
                  : feedback.tone === 'danger'
                  ? 'alert'
                  : 'info'
              }
              size={34}
              color={color}
            />
          </View>
          <Heading style={styles.feedbackTitle}>{feedback.title}</Heading>
          <Body muted style={styles.feedbackText}>
            {feedback.message}
          </Body>
          <Button onPress={onClose}>
            {feedback.tone === 'danger' ? 'REALIZAR NUEVA PUJA' : 'ENTENDIDO'}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

function parseAmount(value: string): number | null {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function readableError(error: unknown, fallback: string) {
  return userFacingError(error, fallback);
}

function bloqueoPujaMessage(puja: PujaActual) {
  if (puja.subastaFinalizada) return 'La subasta ya finalizo.';
  if (puja.loteCerrado) {
    return puja.proximoLoteAt
      ? 'El lote ya está cerrado. El próximo lote comienza en instantes.'
      : 'El lote ya está cerrado.';
  }
  if (puja.mediosParaPujar.length === 0)
    return 'Necesitás un medio de pago verificado vigente compatible para pujar.';
  return 'No cumplís las condiciones para pujar en este momento.';
}

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

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
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.base,
    gap: spacing.base,
  },
  salaHeader: {
    gap: spacing.xs,
  },
  salaHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salaTitulo: {
    marginTop: spacing.xs,
  },
  salaSubtitulo: {
    marginTop: -spacing.xs,
  },
  realtimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  realtimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  realtimeDotOk: {
    backgroundColor: colors.success,
  },
  realtimeDotWarn: {
    backgroundColor: colors.warning,
  },
  realtimeText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.base,
  },
  statusInfo: {
    backgroundColor: colors.infoSoft,
    borderColor: colors.info,
  },
  statusDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  statusText: {
    flex: 1,
    fontSize: fontSize.sm,
  },
  statusAction: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  itemCard: {
    overflow: 'hidden',
  },
  itemHero: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loteBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.overlay,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  loteText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
    letterSpacing: letterSpacing.wider,
  },
  itemInfo: {
    padding: spacing.base,
    gap: spacing.xs,
  },
  itemTitulo: {
    fontSize: fontSize['2xl'],
  },
  precioBaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.xs,
  },
  precioBaseLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  precioBaseValue: {
    fontSize: fontSize.lg,
    color: colors.textLabel,
    fontWeight: fontWeight.semibold,
  },
  mejorOfertaWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.base,
    gap: spacing.xs,
  },
  mejorOfertaLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  postorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  postorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  postorText: {
    fontSize: fontSize.base,
    color: colors.textLabel,
    fontWeight: fontWeight.medium,
  },
  mejorOfertaValue: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  versionText: {
    fontSize: fontSize.xs,
    color: colors.textSubtle,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  countdownText: {
    color: colors.warning,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  historialWrap: {
    gap: spacing.sm,
  },
  liveNavigationActions: {
    gap: spacing.sm,
  },
  historialLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  historialCard: {
    paddingHorizontal: spacing.base,
  },
  emptyHistory: {
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  historialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  historialInfo: {
    flex: 1,
  },
  historialPostor: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  historialTiempo: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  historialMonto: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  historialMontoGanadora: {
    color: colors.primary,
  },
  historialDivider: {
    height: 1,
    backgroundColor: colors.borderMuted,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetBackdropTouch: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing['2xl'],
    gap: spacing.base,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: fontSize['2xl'],
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.infoSoft,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  amountCurrency: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  amountInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    paddingVertical: 0,
  },
  limitsRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  limitCol: {
    flex: 1,
    padding: spacing.base,
    gap: 2,
  },
  limitDivider: {
    width: 1,
    backgroundColor: colors.borderMuted,
    marginVertical: spacing.sm,
  },
  limitLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  limitValue: {
    fontSize: fontSize.base,
    color: colors.text,
    fontWeight: fontWeight.bold,
  },
  paymentWrap: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.sm,
  },
  emptyPayment: { gap: spacing.sm },
  paymentTitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.wider,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoSoft,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: fontSize.base,
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  paymentMeta: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  formError: {
    color: colors.danger,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  overlayBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  overlayCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  spinnerWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.infoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTitle: {
    fontSize: fontSize.xl,
    textAlign: 'center',
  },
  overlayText: {
    textAlign: 'center',
    fontSize: fontSize.sm,
  },
  overlaySummary: {
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginTop: spacing.sm,
  },
  overlaySummaryLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.wider,
  },
  overlaySummaryValue: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginTop: 4,
  },
  feedbackCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.base,
  },
  feedbackIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTitle: {
    textAlign: 'center',
    fontSize: fontSize['2xl'],
  },
  feedbackText: {
    textAlign: 'center',
  },
});
