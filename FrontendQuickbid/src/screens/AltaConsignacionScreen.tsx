import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  Heading,
  Body,
  Typography,
  Button,
  Icon,
  TextField,
  Loader,
  EmptyState,
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
import { ScreenHeader } from '../components/ScreenHeader';
import { SubastaSegmento, SEGMENTO_LABEL } from '../types/subasta';
import { consignacionesApi } from '../api/consignaciones';
import { userFacingError } from '../api/client';
import { ConsignacionFileInput } from '../types/consignacionApi';
import {
  ConsignacionRequisitoUi,
  mapConsignacionDetalle,
  mapRequisito,
} from '../mappers/consignaciones';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'AltaConsignacion'>;

const SEGMENTOS: SubastaSegmento[] = [
  'arte',
  'joyas',
  'vehiculos',
  'relojeria',
  'antiguedades',
  'diseno',
  'coleccion',
];
const MAX_FOTOS = 15;

export default function AltaConsignacionScreen({ navigation }: Props) {
  const [paso, setPaso] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [puedeContinuar, setPuedeContinuar] = useState(false);
  const [minimoFotos, setMinimoFotos] = useState(6);
  const [requisitos, setRequisitos] = useState<ConsignacionRequisitoUi[]>([]);
  const { isGuest, estadoCuenta } = useAuth();

  const [aceptaTyc, setAceptaTyc] = useState(false);
  const [aceptaJurada, setAceptaJurada] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [segmento, setSegmento] = useState<SubastaSegmento | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [historia, setHistoria] = useState('');
  const [fechaAproximada, setFechaAproximada] = useState('');
  const [esObraDeArte, setEsObraDeArte] = useState(false);
  const [autor, setAutor] = useState('');
  const [fotos, setFotos] = useState<ConsignacionFileInput[]>([]);

  const load = useCallback(async () => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await consignacionesApi.requisitos();
      setPuedeContinuar(response.puedeContinuar);
      setMinimoFotos(response.minimoFotos);
      setRequisitos(response.requisitos.map(mapRequisito));
    } catch (err) {
      setError(readableError(err));
    } finally {
      setLoading(false);
    }
  }, [isGuest]);

  useEffect(() => {
    load();
  }, [load]);

  const paso1Ok = puedeContinuar && aceptaTyc && aceptaJurada;
  const paso2Ok =
    titulo.trim().length > 0 &&
    descripcion.trim().length > 0 &&
    segmento != null &&
    fotos.length >= minimoFotos;

  const elegirFotos = async () => {
    const remaining = MAX_FOTOS - fotos.length;
    if (remaining <= 0) {
      Alert.alert('Limite alcanzado', `Podes cargar hasta ${MAX_FOTOS} fotos.`);
      return;
    }
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: remaining,
      quality: 1,
    });
    if (result.didCancel) return;
    if (result.errorMessage) {
      Alert.alert('No se pudieron abrir las fotos', result.errorMessage);
      return;
    }
    const selected = (result.assets ?? [])
      .map(assetToFile)
      .filter(Boolean) as ConsignacionFileInput[];
    setFotos(prev => [...prev, ...selected].slice(0, MAX_FOTOS));
  };

  const handleEnviar = async () => {
    if (!segmento) return;
    setSubmitting(true);
    try {
      const created = await consignacionesApi.crear({
        segmento,
        aceptaTyC: aceptaTyc,
        declaracionPropiedadYOrigenLicito: aceptaJurada,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        historia: historia.trim() || undefined,
        fechaAproximada: fechaAproximada.trim() || undefined,
        esObraDeArte,
        autor: esObraDeArte ? autor.trim() || undefined : undefined,
        fotos,
      });
      const ui = mapConsignacionDetalle(created);
      navigation.replace('ConsignacionExito', {
        id: ui.id,
        codigo: `#CONS-${ui.id}`,
        titulo: ui.titulo,
      });
    } catch (err) {
      Alert.alert('No se pudo enviar la solicitud', readableError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (isGuest) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="lock" size={48} color={colors.textSubtle} />}
            title="Acceso limitado"
            description="Inicia sesion para consignar bienes."
            actionLabel="Iniciar sesion"
            onAction={() => navigation.navigate('LimitedAccess')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (estadoCuenta === 'bloqueada_permanente') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="alert" size={48} color={colors.danger} />}
            title="Cuenta bloqueada"
            description="La cuenta bloqueada no puede crear consignaciones."
            actionLabel="Ver estado"
            onAction={() => navigation.navigate('LimitedAccess')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        onBack={() => (paso === 2 ? setPaso(1) : navigation.goBack())}
      />

      {loading ? (
        <Loader fullScreen label="Cargando requisitos..." />
      ) : error ? (
        <View style={styles.errorWrap}>
          <EmptyState
            icon={<Icon name="alert" size={48} color={colors.danger} />}
            title="No pudimos cargar requisitos"
            description={error}
            actionLabel="Reintentar"
            onAction={load}
          />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.body}>
              <Typography style={styles.pasoLabel}>PASO {paso} DE 2</Typography>
              <Heading style={styles.titulo}>
                {paso === 1 ? 'Consigna tu bien' : 'Datos del bien'}
              </Heading>
              <Body muted style={styles.subtitulo}>
                {paso === 1
                  ? 'Revisa requisitos reales y acepta las condiciones para empezar.'
                  : 'Carga datos y fotos reales para enviar la solicitud.'}
              </Body>

              {paso === 1 ? (
                <Paso1
                  requisitos={requisitos}
                  puedeContinuar={puedeContinuar}
                  aceptaTyc={aceptaTyc}
                  aceptaJurada={aceptaJurada}
                  onToggleTyc={() => setAceptaTyc(v => !v)}
                  onToggleJurada={() => setAceptaJurada(v => !v)}
                />
              ) : (
                <Paso2
                  titulo={titulo}
                  onTitulo={setTitulo}
                  segmento={segmento}
                  onSegmento={setSegmento}
                  descripcion={descripcion}
                  onDescripcion={setDescripcion}
                  historia={historia}
                  onHistoria={setHistoria}
                  fechaAproximada={fechaAproximada}
                  onFechaAproximada={setFechaAproximada}
                  esObraDeArte={esObraDeArte}
                  onToggleObra={() => setEsObraDeArte(v => !v)}
                  autor={autor}
                  onAutor={setAutor}
                  fotos={fotos}
                  minimoFotos={minimoFotos}
                  onAgregarFotos={elegirFotos}
                  onQuitarFoto={index =>
                    setFotos(prev => prev.filter((_, i) => i !== index))
                  }
                />
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {paso === 1 ? (
              <Button onPress={() => setPaso(2)} disabled={!paso1Ok}>
                Continuar
              </Button>
            ) : (
              <Button
                onPress={handleEnviar}
                loading={submitting}
                disabled={!paso2Ok}
                leftIcon={
                  <Icon name="upload" color={colors.textInverse} size={18} />
                }
              >
                Enviar solicitud
              </Button>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function Paso1({
  requisitos,
  puedeContinuar,
  aceptaTyc,
  aceptaJurada,
  onToggleTyc,
  onToggleJurada,
}: {
  requisitos: ConsignacionRequisitoUi[];
  puedeContinuar: boolean;
  aceptaTyc: boolean;
  aceptaJurada: boolean;
  onToggleTyc: () => void;
  onToggleJurada: () => void;
}) {
  return (
    <>
      <View style={styles.section}>
        <Typography style={styles.sectionLabel}>REQUISITOS</Typography>
        <View style={styles.card}>
          {requisitos.map((r, i) => (
            <View key={r.codigo}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.reqRow}>
                <View
                  style={[
                    styles.reqIcon,
                    r.cumplido ? styles.reqIconOk : styles.reqIconPend,
                  ]}
                >
                  <Icon
                    name={r.cumplido ? 'check' : 'info'}
                    size={16}
                    color={r.cumplido ? colors.success : colors.warning}
                  />
                </View>
                <View style={styles.reqInfo}>
                  <Typography style={styles.reqLabel}>
                    {r.label}
                    {!r.obligatorio ? (
                      <Typography style={styles.reqOpcional}>
                        {' '}
                        · advertencia
                      </Typography>
                    ) : null}
                  </Typography>
                  <Typography style={styles.reqDesc}>
                    {r.descripcion}
                  </Typography>
                </View>
              </View>
            </View>
          ))}
        </View>
        {!puedeContinuar ? (
          <Typography style={styles.errorText}>
            Faltan requisitos obligatorios. Revisa tus medios de pago y cuenta
            bancaria.
          </Typography>
        ) : null}
      </View>

      <View style={styles.section}>
        <Typography style={styles.sectionLabel}>CONDICIONES</Typography>
        <Checkbox
          checked={aceptaTyc}
          onPress={onToggleTyc}
          label="Lei y acepto los Terminos y Condiciones de consignacion."
        />
        <Checkbox
          checked={aceptaJurada}
          onPress={onToggleJurada}
          label="Declaro bajo juramento que el bien es de mi propiedad y de origen licito."
        />
      </View>
    </>
  );
}

function Paso2({
  titulo,
  onTitulo,
  segmento,
  onSegmento,
  descripcion,
  onDescripcion,
  historia,
  onHistoria,
  fechaAproximada,
  onFechaAproximada,
  esObraDeArte,
  onToggleObra,
  autor,
  onAutor,
  fotos,
  minimoFotos,
  onAgregarFotos,
  onQuitarFoto,
}: {
  titulo: string;
  onTitulo: (t: string) => void;
  segmento: SubastaSegmento | null;
  onSegmento: (c: SubastaSegmento) => void;
  descripcion: string;
  onDescripcion: (t: string) => void;
  historia: string;
  onHistoria: (t: string) => void;
  fechaAproximada: string;
  onFechaAproximada: (t: string) => void;
  esObraDeArte: boolean;
  onToggleObra: () => void;
  autor: string;
  onAutor: (t: string) => void;
  fotos: ConsignacionFileInput[];
  minimoFotos: number;
  onAgregarFotos: () => void;
  onQuitarFoto: (index: number) => void;
}) {
  const fotosOk = fotos.length >= minimoFotos;
  return (
    <>
      <View style={styles.section}>
        <Typography style={styles.sectionLabel}>
          FOTOS DEL BIEN (MIN. {minimoFotos}, MAX. {MAX_FOTOS})
        </Typography>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAgregarFotos}
          style={styles.uploadBox}
        >
          <Icon name="camera" size={28} color={colors.primary} />
          <Typography style={styles.uploadText}>
            Toca para seleccionar imagenes
          </Typography>
          <Typography
            style={[styles.uploadCount, fotosOk ? styles.uploadCountOk : null]}
          >
            Cargadas: {fotos.length}/{minimoFotos}
            {fotosOk ? ' · minimo cumplido' : ''}
          </Typography>
        </TouchableOpacity>
        {fotos.length > 0 ? (
          <View style={styles.thumbsRow}>
            {fotos.map((foto, i) => (
              <TouchableOpacity
                key={`${foto.uri}-${i}`}
                style={styles.thumb}
                onPress={() => onQuitarFoto(i)}
              >
                <Icon name="image" size={18} color={colors.textSubtle} />
                <Typography style={styles.thumbText} numberOfLines={1}>
                  {foto.name}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>

      <TextField
        label="TITULO"
        placeholder="Ej: Reloj Cartier Santos 1978"
        value={titulo}
        onChangeText={onTitulo}
      />

      <View style={styles.section}>
        <Typography style={styles.sectionLabel}>SEGMENTO / RUBRO</Typography>
        <View style={styles.chips}>
          {SEGMENTOS.map(c => (
            <Chip
              key={c}
              label={SEGMENTO_LABEL[c]}
              selected={c === segmento}
              onPress={() => onSegmento(c)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Typography style={styles.sectionLabel}>DESCRIPCION</Typography>
        <TextInput
          value={descripcion}
          onChangeText={onDescripcion}
          placeholder="Marca, modelo, estado de conservacion, procedencia..."
          placeholderTextColor={colors.textSubtle}
          multiline
          textAlignVertical="top"
          style={styles.textarea}
        />
      </View>

      <TextField
        label="HISTORIA / PROCEDENCIA"
        placeholder="Origen, procedencia o anecdota del objeto"
        value={historia}
        onChangeText={onHistoria}
      />
      <TextField
        label="FECHA APROXIMADA"
        placeholder="Ej: 1978"
        value={fechaAproximada}
        onChangeText={onFechaAproximada}
      />

      <Checkbox
        checked={esObraDeArte}
        onPress={onToggleObra}
        label="Es obra de arte o de disenador."
      />
      {esObraDeArte ? (
        <TextField
          label="AUTOR / ARTISTA / DISENADOR"
          placeholder="Nombre del autor"
          value={autor}
          onChangeText={onAutor}
        />
      ) : null}
    </>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipSel : null]}
    >
      <Typography
        style={[styles.chipText, selected ? styles.chipTextSel : null]}
      >
        {label}
      </Typography>
    </TouchableOpacity>
  );
}

function Checkbox({
  checked,
  onPress,
  label,
}: {
  checked: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.checkRow}
    >
      <View style={[styles.checkbox, checked ? styles.checkboxOn : null]}>
        {checked ? (
          <Icon name="check" size={14} color={colors.textInverse} />
        ) : null}
      </View>
      <Body style={styles.checkLabel}>{label}</Body>
    </TouchableOpacity>
  );
}

function assetToFile(asset: Asset): ConsignacionFileInput | null {
  if (!asset.uri) return null;
  return {
    uri: asset.uri,
    name: asset.fileName ?? `foto-${Date.now()}.jpg`,
    type: asset.type ?? 'image/jpeg',
  };
}

function readableError(err: unknown) {
  return userFacingError(
    err,
    'QuickBid no esta disponible. Probalo de nuevo en unos minutos.',
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing['3xl'] },
  errorWrap: { flex: 1, paddingHorizontal: layout.screenPaddingHorizontal },
  body: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.sm,
    gap: spacing.base,
  },
  pasoLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: letterSpacing.wider,
  },
  titulo: { fontSize: fontSize['3xl'], marginTop: -spacing.xs },
  subtitulo: { marginTop: -spacing.xs },
  section: { gap: spacing.sm, marginTop: spacing.sm },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    paddingHorizontal: spacing.base,
  },
  divider: { height: 1, backgroundColor: colors.borderMuted },
  reqRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  reqIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reqIconOk: { backgroundColor: colors.successSoft },
  reqIconPend: { backgroundColor: colors.warningSoft },
  reqInfo: { flex: 1, gap: 2 },
  reqLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  reqOpcional: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    color: colors.textMuted,
  },
  reqDesc: { fontSize: fontSize.sm, color: colors.textMuted },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.danger,
    lineHeight: fontSize.sm * 1.45,
  },
  checkRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.base,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkLabel: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.textLabel,
    lineHeight: fontSize.base * 1.4,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
  uploadText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  uploadCount: { fontSize: fontSize.sm, color: colors.textMuted },
  uploadCountOk: { color: colors.success, fontWeight: fontWeight.semibold },
  thumbsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumb: {
    width: 76,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  thumbText: { fontSize: 9, color: colors.textMuted, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  chipTextSel: { color: colors.textInverse },
  textarea: {
    minHeight: 96,
    backgroundColor: colors.surface,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base - 2,
    fontSize: fontSize.md,
    color: colors.text,
  },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.base,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
});
