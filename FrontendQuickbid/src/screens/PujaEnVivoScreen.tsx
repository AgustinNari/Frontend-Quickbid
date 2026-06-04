import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
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
import { SEGMENTO_THEME } from '../components/SubastaCard';
import { formatPrecio } from '../utils/format';
import { PujaActual } from '../types/puja';
import { MedioPago, MEDIO_PAGO_TIPO_LABEL } from '../types/medioPago';
import {
  getPujaActual,
  pujar,
  calcularLimites,
  getIncrementoPuja,
} from '../mocks/puja';
import { getMediosPagoUtilizables } from '../mocks/mediosPago';

type Props = NativeStackScreenProps<RootStackParamList, 'PujaEnVivo'>;

/**
 * Sala de subasta / Puja en vivo (tarea #14 del Trello).
 *
 * Replica el frame "Sala de Subasta - Principal" + el bottom sheet "Tu Oferta"
 * + el overlay "Enviando tu puja" del Figma (image7). Consume:
 *  - `GET  /api/subastas/{id}/puja-actual` (mock `getPujaActual`).
 *  - `POST /api/subastas/{id}/pujar`        (mock `pujar`).
 *
 * El streaming en vivo esta fuera de scope por consigna; la "tiempo real" se
 * simula con un contador de retencion (60s) y la confirmacion diferida de la
 * puja. En este commit (slice happy-path) la puja confirmada gana — la
 * simulacion de postores rivales que te superan queda para una iteracion
 * siguiente.
 *
 * Cuando exista backend, el contador y el historial se hidratan por WebSocket.
 */
export default function PujaEnVivoScreen({ navigation, route }: Props) {
  const { subastaId } = route.params;
  const [activeTab, setActiveTab] = useState<NavTab>('subastas');
  const [loading, setLoading] = useState(true);
  const [puja, setPuja] = useState<PujaActual | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [ofertaEnviada, setOfertaEnviada] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const data = getPujaActual(subastaId);
      setPuja(data);
      if (data) setSegundos(data.segundosRestantes);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [subastaId]);

  // Contador de retencion — simula el "tiempo real" del WebSocket. Se pausa
  // mientras se esta enviando una puja.
  useEffect(() => {
    if (!puja || enviando) return;
    const iv = setInterval(() => {
      setSegundos((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(iv);
  }, [puja, enviando]);

  const handleConfirmar = (valor: number, medio: MedioPago) => {
    if (!puja) return;
    setSheetVisible(false);
    setOfertaEnviada(valor);
    setEnviando(true);

    // Simula la confirmacion del sistema en tiempo real.
    setTimeout(() => {
      const resultado = pujar(subastaId, puja.item.id, valor, medio.id);
      setEnviando(false);
      setOfertaEnviada(null);

      if (resultado.ok) {
        navigation.replace('PujaExito', {
          subastaId,
          itemId: puja.item.id,
          montoFinal: resultado.valorOfertado,
          numeroPostor: resultado.numeroPostor,
        });
      } else {
        Alert.alert('No se pudo registrar la puja', resultado.error.mensaje);
        setPuja(getPujaActual(subastaId));
      }
    }, 1900);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      {loading ? (
        <Loader fullScreen label="Entrando a la sala..." />
      ) : !puja ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="clock" size={48} color={colors.textSubtle} />}
            title="No hay ítem en subasta ahora"
            description="Esta subasta no tiene un lote activo en este momento. Volvé cuando arranque el próximo lote."
            actionLabel="Volver"
            onAction={() => navigation.goBack()}
          />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.body}>
              <SalaHeader titulo={puja.subastaTitulo} segundos={segundos} />

              <ItemEnVivoCard puja={puja} />

              <MejorOfertaBlock puja={puja} />

              <PujarButton
                puja={puja}
                segundos={segundos}
                onPress={() => setSheetVisible(true)}
              />

              <HistorialReciente puja={puja} />
            </View>
          </ScrollView>

          <TuOfertaSheet
            visible={sheetVisible}
            puja={puja}
            onClose={() => setSheetVisible(false)}
            onConfirmar={handleConfirmar}
          />

          <EnviandoOverlay
            visible={enviando}
            titulo={puja.item.titulo}
            oferta={ofertaEnviada}
            moneda={puja.moneda}
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

// ── Header de la sala: titulo + EN VIVO + contador ──────────────────────────

function SalaHeader({ titulo, segundos }: { titulo: string; segundos: number }) {
  return (
    <View style={styles.salaHeader}>
      <View style={styles.salaHeaderTop}>
        <Badge tone="danger">● EN VIVO</Badge>
        <View style={styles.timerWrap}>
          <Icon name="clock" size={15} color={colors.danger} />
          <Typography style={styles.timerText}>{formatTimer(segundos)}</Typography>
        </View>
      </View>
      <Heading style={styles.salaTitulo}>{titulo}</Heading>
      <Body muted style={styles.salaSubtitulo}>
        Lote en subasta ahora
      </Body>
    </View>
  );
}

// ── Card del item en vivo ───────────────────────────────────────────────────

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
        {puja.item.autor ? (
          <Body muted style={styles.itemAutor}>
            {puja.item.autor}
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

// ── Bloque de mejor oferta actual ───────────────────────────────────────────

function MejorOfertaBlock({ puja }: { puja: PujaActual }) {
  const hayOferta = puja.mejorOferta != null;
  return (
    <View style={styles.mejorOfertaWrap}>
      <Typography style={styles.mejorOfertaLabel}>MEJOR OFERTA ACTUAL</Typography>
      {hayOferta ? (
        <>
          <View style={styles.postorRow}>
            <View style={styles.postorDot} />
            <Typography style={styles.postorText}>
              {puja.esGanadorActual
                ? 'Tu oferta va ganando'
                : `Postor #${puja.numeroPostorGanador}`}
            </Typography>
          </View>
          <Typography style={styles.mejorOfertaValue}>
            {formatPrecio(puja.mejorOferta as number, puja.moneda)}
          </Typography>
        </>
      ) : (
        <>
          <Typography style={styles.postorText}>
            Todavía nadie pujó. La primera oferta puede ser el precio base.
          </Typography>
          <Typography style={styles.mejorOfertaValue}>
            {formatPrecio(puja.precioBase, puja.moneda)}
          </Typography>
        </>
      )}
    </View>
  );
}

// ── Boton PUJAR AHORA con estados ───────────────────────────────────────────

function PujarButton({
  puja,
  segundos,
  onPress,
}: {
  puja: PujaActual;
  segundos: number;
  onPress: () => void;
}) {
  if (puja.esGanadorActual) {
    return (
      <View style={styles.pujarWrap}>
        <Button variant="secondary" disabled>
          Tenés la oferta ganadora
        </Button>
        <Body muted style={styles.pujarHint}>
          No podés superar tu propia oferta. Esperá la confirmación del cierre.
        </Body>
      </View>
    );
  }

  if (segundos === 0) {
    return (
      <View style={styles.pujarWrap}>
        <Button variant="secondary" disabled>
          Lote cerrado
        </Button>
        <Body muted style={styles.pujarHint}>
          El tiempo de este lote terminó.
        </Body>
      </View>
    );
  }

  return (
    <View style={styles.pujarWrap}>
      <Button
        onPress={onPress}
        leftIcon={<Icon name="plus-circle" color={colors.textInverse} size={18} />}
      >
        PUJAR AHORA
      </Button>
    </View>
  );
}

// ── Historial reciente ──────────────────────────────────────────────────────

function HistorialReciente({ puja }: { puja: PujaActual }) {
  return (
    <View style={styles.historialWrap}>
      <Typography style={styles.historialLabel}>HISTORIAL RECIENTE</Typography>
      <Card variant="flat" padding="none" style={styles.historialCard}>
        {puja.historialReciente.map((h, i) => (
          <View key={h.id}>
            {i > 0 ? <View style={styles.historialDivider} /> : null}
            <View style={styles.historialRow}>
              <Icon name="user" size={18} color={colors.textMuted} />
              <View style={styles.historialInfo}>
                <Typography style={styles.historialPostor}>
                  Postor #{h.numeroPostor}
                </Typography>
                <Typography style={styles.historialTiempo}>
                  {h.haceMinutos === 0 ? 'Recién' : `Hace ${h.haceMinutos} min`}
                </Typography>
              </View>
              <Typography
                style={[
                  styles.historialMonto,
                  h.ganadora ? styles.historialMontoGanadora : null,
                ]}
              >
                {formatPrecio(h.monto, puja.moneda)}
              </Typography>
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

// ── Bottom sheet "Tu Oferta" ────────────────────────────────────────────────

function TuOfertaSheet({
  visible,
  puja,
  onClose,
  onConfirmar,
}: {
  visible: boolean;
  puja: PujaActual;
  onClose: () => void;
  onConfirmar: (valor: number, medio: MedioPago) => void;
}) {
  const limites = useMemo(
    () => calcularLimites(puja.mejorOferta, puja.precioBase, puja.categoria),
    [puja.mejorOferta, puja.precioBase, puja.categoria],
  );
  const incremento = useMemo(
    () => getIncrementoPuja(puja.precioBase),
    [puja.precioBase],
  );
  const mediosCompatibles = useMemo(
    () => getMediosPagoUtilizables(puja.moneda),
    [puja.moneda],
  );

  const [monto, setMonto] = useState(limites.minimo);
  const [medioId, setMedioId] = useState<string | null>(null);
  const [cambiandoMedio, setCambiandoMedio] = useState(false);

  // Reset al abrir el sheet.
  useEffect(() => {
    if (visible) {
      setMonto(limites.minimo);
      const principal =
        mediosCompatibles.find((m) => m.principal) ?? mediosCompatibles[0];
      setMedioId(principal ? principal.id : null);
      setCambiandoMedio(false);
    }
  }, [visible, limites.minimo, mediosCompatibles]);

  const medioSeleccionado =
    mediosCompatibles.find((m) => m.id === medioId) ?? null;

  const bajar = () => setMonto((m) => Math.max(limites.minimo, m - incremento));
  const subir = () =>
    setMonto((m) =>
      limites.maximo != null
        ? Math.min(limites.maximo, m + incremento)
        : m + incremento,
    );

  const enMinimo = monto <= limites.minimo;
  const enMaximo = limites.maximo != null && monto >= limites.maximo;
  const puedeConfirmar = medioSeleccionado != null && monto >= limites.minimo;

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
            <Heading style={styles.sheetTitulo}>Tu Oferta</Heading>
            <TouchableOpacity onPress={onClose} hitSlop={hitSlop}>
              <Icon name="x" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Stepper del monto */}
          <View style={styles.stepperRow}>
            <StepperButton
              icon="minus"
              disabled={enMinimo}
              onPress={bajar}
            />
            <View style={styles.montoWrap}>
              <Typography style={styles.montoValue}>
                {formatPrecio(monto, puja.moneda)}
              </Typography>
            </View>
            <StepperButton icon="plus" disabled={enMaximo} onPress={subir} />
          </View>

          {/* Limites */}
          <View style={styles.limitesRow}>
            <LimiteCol
              label="Monto mínimo"
              value={formatPrecio(limites.minimo, puja.moneda)}
              caption={
                puja.mejorOferta == null
                  ? 'Igual al precio base'
                  : 'Mejor oferta + 1% del base'
              }
            />
            <View style={styles.limiteDivider} />
            <LimiteCol
              label="Monto máximo"
              value={
                limites.maximo != null
                  ? formatPrecio(limites.maximo, puja.moneda)
                  : 'Sin tope'
              }
              caption={
                limites.sinLimiteSuperior
                  ? 'Oro / platino: sin límite'
                  : 'Mejor oferta + 20% del base'
              }
            />
          </View>

          {/* Medio de pago */}
          <MedioPagoSelector
            medio={medioSeleccionado}
            medios={mediosCompatibles}
            expandido={cambiandoMedio}
            onToggle={() => setCambiandoMedio((v) => !v)}
            onSelect={(id) => {
              setMedioId(id);
              setCambiandoMedio(false);
            }}
          />

          <Button
            onPress={() =>
              medioSeleccionado && onConfirmar(monto, medioSeleccionado)
            }
            disabled={!puedeConfirmar}
            rightIcon={
              <Icon name="arrow-right" color={colors.textInverse} size={18} />
            }
            style={styles.confirmarButton}
          >
            CONFIRMAR PUJA
          </Button>
        </View>
      </View>
    </Modal>
  );
}

function StepperButton({
  icon,
  disabled,
  onPress,
}: {
  icon: 'plus' | 'minus';
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.stepperButton, disabled ? styles.stepperButtonDisabled : null]}
    >
      <Icon
        name={icon}
        size={22}
        color={disabled ? colors.textSubtle : colors.primary}
      />
    </TouchableOpacity>
  );
}

function LimiteCol({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <View style={styles.limiteCol}>
      <Typography style={styles.limiteLabel}>{label}</Typography>
      <Typography style={styles.limiteValue}>{value}</Typography>
      <Typography style={styles.limiteCaption}>{caption}</Typography>
    </View>
  );
}

function MedioPagoSelector({
  medio,
  medios,
  expandido,
  onToggle,
  onSelect,
}: {
  medio: MedioPago | null;
  medios: MedioPago[];
  expandido: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.medioWrap}>
      <View style={styles.medioRow}>
        <Icon
          name={medio?.tipo === 'cuenta_bancaria' ? 'bank' : 'card'}
          size={20}
          color={colors.textMuted}
        />
        <View style={styles.medioInfo}>
          <Typography style={styles.medioLabel}>Método de pago</Typography>
          <Typography style={styles.medioValue} numberOfLines={1}>
            {medio
              ? `${medio.etiqueta}${medio.ultimos4 ? ` ··· ${medio.ultimos4}` : ''}`
              : 'Sin medio compatible'}
          </Typography>
        </View>
        {medios.length > 1 ? (
          <TouchableOpacity onPress={onToggle} hitSlop={hitSlop}>
            <Typography style={styles.medioCambiar}>
              {expandido ? 'Cerrar' : 'Cambiar'}
            </Typography>
          </TouchableOpacity>
        ) : null}
      </View>

      {expandido
        ? medios.map((m) => {
            const selected = m.id === medio?.id;
            return (
              <TouchableOpacity
                key={m.id}
                activeOpacity={0.7}
                onPress={() => onSelect(m.id)}
                style={[
                  styles.medioOption,
                  selected ? styles.medioOptionSelected : null,
                ]}
              >
                <View style={styles.medioOptionInfo}>
                  <Typography style={styles.medioOptionEtiqueta}>
                    {m.etiqueta}
                  </Typography>
                  <Typography style={styles.medioOptionTipo}>
                    {MEDIO_PAGO_TIPO_LABEL[m.tipo]}
                    {m.ultimos4 ? ` ··· ${m.ultimos4}` : ''} · {m.moneda}
                  </Typography>
                </View>
                <View
                  style={[styles.radio, selected ? styles.radioSelected : null]}
                >
                  {selected ? <View style={styles.radioInner} /> : null}
                </View>
              </TouchableOpacity>
            );
          })
        : null}
    </View>
  );
}

// ── Overlay "Enviando tu puja" ──────────────────────────────────────────────

function EnviandoOverlay({
  visible,
  titulo,
  oferta,
  moneda,
}: {
  visible: boolean;
  titulo: string;
  oferta: number | null;
  moneda: PujaActual['moneda'];
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.enviandoBackdrop}>
        <View style={styles.enviandoCard}>
          <View style={styles.enviandoSpinner}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Heading style={styles.enviandoTitulo}>Enviando tu puja...</Heading>
          <Body muted style={styles.enviandoTexto}>
            Por favor, esperá la confirmación del sistema para validar tu oferta
            en tiempo real.
          </Body>

          <View style={styles.enviandoResumen}>
            <View style={styles.enviandoResumenRow}>
              <Typography style={styles.enviandoResumenLabel}>ARTÍCULO</Typography>
              <Typography style={styles.enviandoResumenValue} numberOfLines={1}>
                {titulo}
              </Typography>
            </View>
            <View style={styles.enviandoResumenDivider} />
            <View style={styles.enviandoResumenRow}>
              <Typography style={styles.enviandoResumenLabel}>TU OFERTA</Typography>
              <Typography style={styles.enviandoResumenMonto}>
                {oferta != null ? formatPrecio(oferta, moneda) : '—'}
              </Typography>
            </View>
          </View>

          <View style={styles.enviandoSeguro}>
            <Icon name="lock" size={13} color={colors.textSubtle} />
            <Typography style={styles.enviandoSeguroText}>
              Conexión segura cifrada
            </Typography>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

function formatTimer(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Estilos ─────────────────────────────────────────────────────────────────

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
  body: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.base,
    gap: spacing.base,
  },

  // Header de la sala
  salaHeader: {
    gap: spacing.xs,
  },
  salaHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  timerText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.danger,
    letterSpacing: letterSpacing.wide,
  },
  salaTitulo: {
    marginTop: spacing.xs,
  },
  salaSubtitulo: {
    marginTop: -spacing.xs,
  },

  // Card del item
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
  itemAutor: {
    marginTop: -spacing.xs,
  },
  precioBaseRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  precioBaseLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  precioBaseValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textLabel,
  },

  // Mejor oferta
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
    gap: spacing.xs + 2,
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
    letterSpacing: letterSpacing.tight,
  },

  // Pujar
  pujarWrap: {
    gap: spacing.xs,
  },
  pujarHint: {
    textAlign: 'center',
    fontSize: fontSize.sm,
  },

  // Historial
  historialWrap: {
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

  // Sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetBackdropTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    marginBottom: spacing.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitulo: {
    fontSize: fontSize['2xl'],
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.base,
  },
  stepperButton: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  stepperButtonDisabled: {
    opacity: 0.5,
  },
  montoWrap: {
    flex: 1,
    alignItems: 'center',
  },
  montoValue: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: letterSpacing.tight,
  },
  limitesRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  limiteCol: {
    flex: 1,
    padding: spacing.base,
    gap: 2,
  },
  limiteDivider: {
    width: 1,
    backgroundColor: colors.borderMuted,
    marginVertical: spacing.sm,
  },
  limiteLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  limiteValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  limiteCaption: {
    fontSize: fontSize.xs,
    color: colors.textSubtle,
  },

  // Medio de pago
  medioWrap: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  medioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  medioInfo: {
    flex: 1,
  },
  medioLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.wide,
  },
  medioValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  medioCambiar: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  medioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  medioOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoSoft,
  },
  medioOptionInfo: {
    flex: 1,
  },
  medioOptionEtiqueta: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  medioOptionTipo: {
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
  confirmarButton: {
    marginTop: spacing.xs,
  },

  // Enviando overlay
  enviandoBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  enviandoCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  enviandoSpinner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.infoSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  enviandoTitulo: {
    fontSize: fontSize.xl,
    textAlign: 'center',
  },
  enviandoTexto: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
  enviandoResumen: {
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    marginTop: spacing.sm,
  },
  enviandoResumenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    gap: spacing.base,
  },
  enviandoResumenLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  enviandoResumenValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  enviandoResumenMonto: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  enviandoResumenDivider: {
    height: 1,
    backgroundColor: colors.borderMuted,
  },
  enviandoSeguro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  enviandoSeguroText: {
    fontSize: fontSize.xs,
    color: colors.textSubtle,
  },
});
