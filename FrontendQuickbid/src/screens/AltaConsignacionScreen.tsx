import React, { useMemo, useState } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  Heading,
  Body,
  Typography,
  Button,
  Icon,
  TextField,
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
import {
  MIN_FOTOS_CONSIGNACION,
  MAX_FOTOS_CONSIGNACION,
  RequisitoConsignacion,
} from '../types/consignacion';
import { getRequisitos, crearConsignacion } from '../mocks/consignacion';

type Props = NativeStackScreenProps<RootStackParamList, 'AltaConsignacion'>;

const CATEGORIAS: SubastaSegmento[] = [
  'arte',
  'joyas',
  'vehiculos',
  'relojeria',
  'antiguedades',
  'diseno',
  'coleccion',
];

/**
 * Alta de consignacion (`POST /api/consignaciones`), frame image5.
 *
 * Flujo consolidado en 2 pasos (decision de alcance acordada):
 *  - Paso 1: requisitos (medio + cuenta), Terminos y Condiciones y la
 *    declaracion jurada de origen licito (Consignas 11.4).
 *  - Paso 2: datos del bien (titulo, categoria, descripcion, año) y fotos
 *    (minimo 6, Consignas 11.6).
 *
 * Al enviar, llama al mock y navega a la pantalla de exito con replace.
 */
export default function AltaConsignacionScreen({ navigation }: Props) {
  const [paso, setPaso] = useState<1 | 2>(1);

  // Paso 1
  const { puedeContinuar, requisitos } = useMemo(() => getRequisitos(), []);
  const [aceptaTyc, setAceptaTyc] = useState(false);
  const [aceptaJurada, setAceptaJurada] = useState(false);

  // Paso 2
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<SubastaSegmento | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [anio, setAnio] = useState('');
  const [fotos, setFotos] = useState(0);
  const [errorTitulo, setErrorTitulo] = useState<string | undefined>();

  const paso1Ok = puedeContinuar && aceptaTyc && aceptaJurada;
  const paso2Ok = titulo.trim().length > 0 && categoria != null && fotos >= MIN_FOTOS_CONSIGNACION;

  const handleEnviar = () => {
    if (!categoria) return;
    const resultado = crearConsignacion({
      titulo: titulo.trim(),
      categoria,
      descripcion: descripcion.trim(),
      anio: anio.trim() || undefined,
      cantidadFotos: fotos,
    });
    if (resultado.ok) {
      navigation.replace('ConsignacionExito', {
        id: resultado.id,
        codigo: resultado.codigo ?? '',
        titulo: titulo.trim(),
      });
    } else if (resultado.error.tipo === 'DATOS_INCOMPLETOS') {
      setErrorTitulo(resultado.error.mensaje);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => (paso === 2 ? setPaso(1) : navigation.goBack())} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <Typography style={styles.pasoLabel}>PASO {paso} DE 2</Typography>
          <Heading style={styles.titulo}>
            {paso === 1 ? 'Consigná tu bien' : 'Datos del bien'}
          </Heading>
          <Body muted style={styles.subtitulo}>
            {paso === 1
              ? 'Revisá los requisitos y aceptá las condiciones para empezar.'
              : 'Cargá la información y las fotos del objeto a consignar.'}
          </Body>

          {paso === 1 ? (
            <Paso1
              requisitos={requisitos}
              aceptaTyc={aceptaTyc}
              aceptaJurada={aceptaJurada}
              onToggleTyc={() => setAceptaTyc((v) => !v)}
              onToggleJurada={() => setAceptaJurada((v) => !v)}
            />
          ) : (
            <Paso2
              titulo={titulo}
              onTitulo={(t) => {
                setTitulo(t);
                if (errorTitulo) setErrorTitulo(undefined);
              }}
              errorTitulo={errorTitulo}
              categoria={categoria}
              onCategoria={setCategoria}
              descripcion={descripcion}
              onDescripcion={setDescripcion}
              anio={anio}
              onAnio={setAnio}
              fotos={fotos}
              onAgregarFoto={() => setFotos((f) => Math.min(MAX_FOTOS_CONSIGNACION, f + 1))}
              onQuitarFoto={() => setFotos((f) => Math.max(0, f - 1))}
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
            disabled={!paso2Ok}
            leftIcon={<Icon name="upload" color={colors.textInverse} size={18} />}
          >
            Enviar solicitud
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Paso 1: requisitos + condiciones ────────────────────────────────────────

function Paso1({
  requisitos,
  aceptaTyc,
  aceptaJurada,
  onToggleTyc,
  onToggleJurada,
}: {
  requisitos: RequisitoConsignacion[];
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
            <View key={r.id}>
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
                      <Typography style={styles.reqOpcional}> · opcional</Typography>
                    ) : null}
                  </Typography>
                  <Typography style={styles.reqDesc}>{r.descripcion}</Typography>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Typography style={styles.sectionLabel}>CONDICIONES</Typography>
        <Checkbox
          checked={aceptaTyc}
          onPress={onToggleTyc}
          label="Leí y acepto los Términos y Condiciones de consignación."
        />
        <Checkbox
          checked={aceptaJurada}
          onPress={onToggleJurada}
          label="Declaro bajo juramento que el bien es de mi propiedad y de origen lícito."
        />
      </View>
    </>
  );
}

// ── Paso 2: datos del bien ──────────────────────────────────────────────────

function Paso2({
  titulo,
  onTitulo,
  errorTitulo,
  categoria,
  onCategoria,
  descripcion,
  onDescripcion,
  anio,
  onAnio,
  fotos,
  onAgregarFoto,
  onQuitarFoto,
}: {
  titulo: string;
  onTitulo: (t: string) => void;
  errorTitulo?: string;
  categoria: SubastaSegmento | null;
  onCategoria: (c: SubastaSegmento) => void;
  descripcion: string;
  onDescripcion: (t: string) => void;
  anio: string;
  onAnio: (t: string) => void;
  fotos: number;
  onAgregarFoto: () => void;
  onQuitarFoto: () => void;
}) {
  const fotosOk = fotos >= MIN_FOTOS_CONSIGNACION;
  return (
    <>
      {/* Fotos */}
      <View style={styles.section}>
        <Typography style={styles.sectionLabel}>
          FOTOS DEL BIEN (MÍN. {MIN_FOTOS_CONSIGNACION})
        </Typography>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAgregarFoto}
          style={styles.uploadBox}
        >
          <Icon name="camera" size={28} color={colors.primary} />
          <Typography style={styles.uploadText}>Tocá para subir imágenes</Typography>
          <Typography
            style={[styles.uploadCount, fotosOk ? styles.uploadCountOk : null]}
          >
            Cargadas: {fotos}/{MIN_FOTOS_CONSIGNACION}
            {fotosOk ? ' · mínimo cumplido' : ''}
          </Typography>
        </TouchableOpacity>
        {fotos > 0 ? (
          <View style={styles.thumbsRow}>
            {Array.from({ length: fotos }).map((_, i) => (
              <View key={i} style={styles.thumb}>
                <Icon name="image" size={18} color={colors.textSubtle} />
              </View>
            ))}
            <TouchableOpacity style={styles.thumbRemove} onPress={onQuitarFoto}>
              <Icon name="minus" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Datos */}
      <TextField
        label="TÍTULO"
        placeholder="Ej: Reloj Cartier Santos 1978"
        value={titulo}
        onChangeText={onTitulo}
        error={errorTitulo}
      />

      <View style={styles.section}>
        <Typography style={styles.sectionLabel}>CATEGORÍA</Typography>
        <View style={styles.chips}>
          {CATEGORIAS.map((c) => {
            const sel = c === categoria;
            return (
              <TouchableOpacity
                key={c}
                activeOpacity={0.7}
                onPress={() => onCategoria(c)}
                style={[styles.chip, sel ? styles.chipSel : null]}
              >
                <Typography style={[styles.chipText, sel ? styles.chipTextSel : null]}>
                  {SEGMENTO_LABEL[c]}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Typography style={styles.sectionLabel}>DESCRIPCIÓN</Typography>
        <TextInput
          value={descripcion}
          onChangeText={onDescripcion}
          placeholder="Marca, modelo, estado de conservación, procedencia..."
          placeholderTextColor={colors.textSubtle}
          multiline
          textAlignVertical="top"
          style={styles.textarea}
        />
      </View>

      <TextField
        label="AÑO / REFERENCIA"
        placeholder="Ej: 1978"
        value={anio}
        onChangeText={onAnio}
        keyboardType="number-pad"
      />
    </>
  );
}

// ── Checkbox ────────────────────────────────────────────────────────────────

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
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.checkRow}>
      <View style={[styles.checkbox, checked ? styles.checkboxOn : null]}>
        {checked ? <Icon name="check" size={14} color={colors.textInverse} /> : null}
      </View>
      <Body style={styles.checkLabel}>{label}</Body>
    </TouchableOpacity>
  );
}

// ── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing['3xl'] },
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
  reqRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.md, alignItems: 'center' },
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
  reqLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  reqOpcional: { fontSize: fontSize.sm, fontWeight: fontWeight.regular, color: colors.textMuted },
  reqDesc: { fontSize: fontSize.sm, color: colors.textMuted },
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
  checkLabel: { flex: 1, fontSize: fontSize.base, color: colors.textLabel, lineHeight: fontSize.base * 1.4 },
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
  uploadText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  uploadCount: { fontSize: fontSize.sm, color: colors.textMuted },
  uploadCountOk: { color: colors.success, fontWeight: fontWeight.semibold },
  thumbsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRemove: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  chipText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
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
