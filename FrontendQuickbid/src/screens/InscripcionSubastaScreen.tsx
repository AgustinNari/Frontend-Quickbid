import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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
import BottomNavBar, { NavTab } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { getMockDetalle } from '../mocks/subastas';
import { MOCK_MEDIOS_PAGO } from '../mocks/mediosPago';
import { inscribir } from '../mocks/inscripciones';
import { SubastaDetalle } from '../types/subasta';
import {
  MedioPago,
  MedioPagoTipo,
  MEDIO_PAGO_TIPO_LABEL,
} from '../types/medioPago';

type Props = NativeStackScreenProps<RootStackParamList, 'InscripcionSubasta'>;

/**
 * Pantalla de inscripción a una subasta (tarea #13 del Trello).
 *
 * Alineada al frame "Pago para Inscripción" del Figma (Capturas de figma.docx,
 * image7). Flujo:
 *  1. Header con back + brand QuickBid.
 *  2. Card de la subasta con badge "Moneda Requerida".
 *  3. Banner informativo azul explicando la vigencia del medio de pago.
 *  4. Sección "Seleccionar Medio de Pago" con todos los medios activos del
 *     usuario. Los que no coinciden con la moneda de la subasta se muestran
 *     deshabilitados con un warning visible (refleja el 422 del backend).
 *  5. CTA sticky "Confirmar Inscripción", deshabilitado hasta que haya un
 *     medio compatible seleccionado.
 *
 * Cuando se confirma, llama al mock `inscribir()` que replica las validaciones
 * del endpoint real `POST /api/subastas/{id}/inscribirse` (códigos 400, 403,
 * 409, 422). Si todo OK → navega a `InscripcionExito` con replace para no dejar
 * la pantalla de selección en el stack.
 */
export default function InscripcionSubastaScreen({ navigation, route }: Props) {
  const { subastaId } = route.params;
  const [activeTab, setActiveTab] = useState<NavTab>('subastas');
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [subasta, setSubasta] = useState<SubastaDetalle | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSubasta(getMockDetalle(subastaId));
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [subastaId]);

  // Lista completa de medios activos. Los incompatibles por moneda quedan en
  // la lista pero deshabilitados — replica lo que muestra el wireframe.
  const medios = useMemo<MedioPago[]>(
    () => MOCK_MEDIOS_PAGO.filter((m) => m.estado === 'activo'),
    [],
  );

  const selected = medios.find((m) => m.id === selectedId) ?? null;
  const puedeConfirmar =
    !!selected && !!subasta && selected.moneda === subasta.moneda;

  const handleBack = () => navigation.goBack();

  const handleSelect = (medio: MedioPago) => {
    if (!subasta) return;
    if (medio.moneda !== subasta.moneda) return;
    setSelectedId(medio.id);
    setErrorBanner(null);
  };

  const handleConfirmar = () => {
    if (!subasta || !selectedId) return;
    setErrorBanner(null);

    const resultado = inscribir(subasta.id, selectedId);

    if (resultado.ok) {
      navigation.replace('InscripcionExito', {
        subastaId: subasta.id,
        idMedioPago: selectedId,
      });
    } else {
      setErrorBanner(resultado.error.mensaje);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={handleBack} />

      {loading ? (
        <Loader fullScreen label="Cargando inscripción..." />
      ) : !subasta ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="alert" size={48} color={colors.textSubtle} />}
            title="No encontramos la subasta"
            description="La subasta a la que querés inscribirte no existe o ya no está disponible."
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
            <View style={styles.body}>
              <Heading style={styles.titulo}>Método de Pago</Heading>

              {/* Card de la subasta con badge de moneda requerida */}
              <Card variant="flat" padding="none" style={styles.subastaCard}>
                <View style={styles.subastaInner}>
                  <Typography variant="h3" numberOfLines={2}>
                    {subasta.titulo}
                  </Typography>
                  <View style={styles.monedaRow}>
                    <Typography variant="caption" muted>
                      Moneda Requerida
                    </Typography>
                    <Badge tone="info" variant="soft">
                      {subasta.moneda}
                    </Badge>
                  </View>
                </View>
              </Card>

              {/* Banner informativo */}
              <View style={styles.infoBanner}>
                <Icon name="info" size={18} color={colors.info} />
                <Body style={styles.infoText}>
                  Para participar, seleccioná un método de pago en{' '}
                  <Typography style={styles.infoStrong}>
                    {subasta.moneda}
                  </Typography>
                  . Una vez confirmada tu inscripción, el método será validado
                  por la empresa y tendrá una vigencia de 3 días hábiles para
                  esta y otras subastas y pagos en la misma moneda.
                </Body>
              </View>

              <Typography style={styles.sectionLabel}>
                Seleccionar Medio de Pago
              </Typography>

              {medios.length === 0 ? (
                <View style={styles.emptyMedios}>
                  <EmptyState
                    icon={
                      <Icon
                        name="card"
                        size={40}
                        color={colors.textSubtle}
                      />
                    }
                    title="Sin medios de pago"
                    description="Para inscribirte necesitás al menos un medio de pago validado. Agregalo desde Métodos de pago."
                    actionLabel="Ir a Métodos de pago"
                    onAction={() => navigation.navigate('MetodosPago')}
                  />
                </View>
              ) : (
                <View style={styles.medios}>
                  {medios.map((m) => (
                    <MedioPagoCard
                      key={m.id}
                      medio={m}
                      monedaRequerida={subasta.moneda}
                      selected={selectedId === m.id}
                      onSelect={() => handleSelect(m)}
                    />
                  ))}
                </View>
              )}

              {errorBanner ? (
                <View style={styles.errorBanner}>
                  <Icon name="alert" size={18} color={colors.danger} />
                  <Body style={styles.errorBannerText}>{errorBanner}</Body>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              onPress={handleConfirmar}
              disabled={!puedeConfirmar || confirmando}
              loading={confirmando}
            >
              Confirmar Inscripción
            </Button>
          </View>
        </>
      )}

      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
}

// ── Sub-componente: card de un medio de pago ─────────────────────────────────

const TIPO_ICON: Record<MedioPagoTipo, IconName> = {
  tarjeta: 'card',
  cuenta_bancaria: 'bank',
  cheque_certificado: 'check-doc',
};

function MedioPagoCard({
  medio,
  monedaRequerida,
  selected,
  onSelect,
}: {
  medio: MedioPago;
  monedaRequerida: SubastaDetalle['moneda'];
  selected: boolean;
  onSelect: () => void;
}) {
  const monedaOk = medio.moneda === monedaRequerida;

  return (
    <TouchableOpacity
      activeOpacity={monedaOk ? 0.7 : 1}
      onPress={monedaOk ? onSelect : undefined}
      style={[
        styles.medioCard,
        selected ? styles.medioCardSelected : null,
        !monedaOk ? styles.medioCardDisabled : null,
      ]}
    >
      <View style={styles.medioIconWrap}>
        <Icon
          name={TIPO_ICON[medio.tipo]}
          size={22}
          color={monedaOk ? colors.text : colors.textSubtle}
        />
      </View>

      <View style={styles.medioBody}>
        <Typography
          style={[styles.medioTitulo, !monedaOk && styles.textMuted]}
          numberOfLines={1}
        >
          {medio.etiqueta}
        </Typography>
        <View style={styles.medioMetaRow}>
          {medio.ultimos4 ? (
            <Typography variant="caption" muted>
              **** {medio.ultimos4}
            </Typography>
          ) : (
            <Typography variant="caption" muted>
              {MEDIO_PAGO_TIPO_LABEL[medio.tipo]}
            </Typography>
          )}
          <Badge tone={monedaOk ? 'info' : 'neutral'} variant="soft">
            {medio.moneda}
          </Badge>
        </View>

        {!monedaOk ? (
          <View style={styles.warningRow}>
            <Icon name="alert" size={12} color={colors.danger} />
            <Typography style={styles.warningText}>
              Moneda no coincide ({monedaRequerida})
            </Typography>
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.radio,
          selected ? styles.radioSelected : null,
          !monedaOk ? styles.radioDisabled : null,
        ]}
      >
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
    </TouchableOpacity>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: spacing['2xl'],
  },
  errorWrap: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  body: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    gap: spacing.base,
  },
  titulo: {
    marginBottom: spacing.xs,
  },
  subastaCard: {
    borderColor: colors.borderMuted,
  },
  subastaInner: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  monedaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  infoBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.infoSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.info,
  },
  infoText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
  infoStrong: {
    fontWeight: fontWeight.bold,
    color: colors.info,
  },
  sectionLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptyMedios: {
    paddingVertical: spacing.lg,
  },
  medios: {
    gap: spacing.sm,
  },
  medioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.surface,
  },
  medioCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.infoSoft,
  },
  medioCardDisabled: {
    opacity: 0.65,
    backgroundColor: colors.background,
  },
  medioIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medioBody: {
    flex: 1,
    gap: 2,
  },
  medioTitulo: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  textMuted: {
    color: colors.textMuted,
  },
  medioMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  warningText: {
    fontSize: fontSize.xs,
    color: colors.danger,
    fontWeight: fontWeight.medium,
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
  radioDisabled: {
    borderColor: colors.borderMuted,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  errorBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorBannerText: {
    flex: 1,
    color: colors.danger,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
});
