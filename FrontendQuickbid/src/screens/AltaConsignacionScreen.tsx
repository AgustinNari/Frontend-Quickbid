import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
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
import { useNetwork } from '../context/NetworkContext';
import { pickImages } from '../mobile/mediaPicker';
import {
  canReadLocalUri,
  copyUriToPrivateDraftStorage,
  deletePrivateDraftFile,
} from '../mobile/nativeMobile';
import {
  ConsignmentDraft,
  ConsignmentDraftForm,
  ConsignmentDraftStatus,
  createConsignmentDraftStore,
  createConsignmentDraft,
  createDraftId,
  moveConsignmentPhoto,
  removeConsignmentPhoto,
  removeConsignmentDraftAndFiles,
  retryConsignmentDraft,
} from '../offline/consignmentDrafts';

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
  const { isGuest, estadoCuenta, user } = useAuth();
  const accountId = user?.id ?? null;
  const draftStore = useMemo(
    () =>
      accountId == null ? null : createConsignmentDraftStore(accountId),
    [accountId],
  );
  const network = useNetwork();
  const { confirmHeavyAction } = network;
  const offline = !network.isConnected || !network.isInternetReachable;

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
  const [portadaUri, setPortadaUri] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<ConsignmentDraft[]>([]);
  const [draftsLoaded, setDraftsLoaded] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<
    'idle' | 'pending' | 'saved' | 'error'
  >('idle');
  const autosaveVersion = useRef(0);
  const completedDraft = useRef(false);
  const lastSavedFingerprint = useRef('');
  const previousAccountId = useRef(accountId);

  useEffect(() => {
    if (previousAccountId.current === accountId) return;
    previousAccountId.current = accountId;
    autosaveVersion.current += 1;
    completedDraft.current = false;
    lastSavedFingerprint.current = '';
    setActiveDraftId(null);
    setDrafts([]);
    setDraftsLoaded(false);
    setSaveState('idle');
    setPaso(1);
    setAceptaTyc(false);
    setAceptaJurada(false);
    setTitulo('');
    setSegmento(null);
    setDescripcion('');
    setHistoria('');
    setFechaAproximada('');
    setEsObraDeArte(false);
    setAutor('');
    setFotos([]);
    setPortadaUri(null);
  }, [accountId]);

  const form = useMemo<ConsignmentDraftForm>(
    () => ({
      titulo,
      segmento,
      descripcion,
      historia,
      fechaAproximada,
      aceptaTyc,
      aceptaJurada,
      esObraDeArte,
      autor,
      fotos,
      portadaUri,
    }),
    [
      aceptaJurada,
      aceptaTyc,
      autor,
      descripcion,
      esObraDeArte,
      fechaAproximada,
      fotos,
      historia,
      segmento,
      titulo,
      portadaUri,
    ],
  );

  const refreshDrafts = useCallback(async () => {
    if (!draftStore) {
      setDrafts([]);
      setDraftsLoaded(true);
      return;
    }
    const stored = await draftStore.list();
    for (const completed of stored.filter(
      draft => draft.status === 'completado',
    )) {
      await removeConsignmentDraftAndFiles(
        draftStore,
        completed.id,
        deletePrivateDraftFile,
      );
    }
    const recovered = await Promise.all(
      stored
        .filter(draft => draft.status !== 'completado')
        .map(draft =>
          draft.status === 'subiendo'
            ? draftStore.update(draft.id, {
                status: 'fallido',
                ultimoError:
                  'El envio se interrumpio. Podes reintentarlo manualmente.',
              })
            : Promise.resolve(draft),
        ),
    );
    setDrafts(recovered.filter((draft): draft is ConsignmentDraft => !!draft));
    setDraftsLoaded(true);
  }, [draftStore]);

  useEffect(() => {
    refreshDrafts().catch(() => {
      setSaveState('error');
      setDraftsLoaded(true);
    });
  }, [refreshDrafts]);

  const load = useCallback(async () => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    if (offline) {
      setPuedeContinuar(true);
      setError(null);
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
      if (offline) {
        setPuedeContinuar(true);
        setError(null);
      } else {
        setError(readableError(err));
      }
    } finally {
      setLoading(false);
    }
  }, [isGuest, offline]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (
      !draftStore ||
      !draftsLoaded ||
      completedDraft.current ||
      !hasDraftContent(form)
    )
      return;
    const fingerprint = JSON.stringify(form);
    if (fingerprint === lastSavedFingerprint.current) return;
    const version = ++autosaveVersion.current;
    setSaveState('pending');
    const timer = setTimeout(async () => {
      if (version !== autosaveVersion.current) return;
      try {
        const id = activeDraftId ?? createDraftId();
        const existing = await draftStore.get(id);
        await draftStore.save(
          existing
            ? {
                ...existing,
                status: 'borrador',
                ultimoError: null,
                updatedAt: new Date().toISOString(),
                form,
              }
            : createConsignmentDraft(form, { id }),
        );
        if (!activeDraftId) setActiveDraftId(id);
        lastSavedFingerprint.current = fingerprint;
        setSaveState('saved');
        await refreshDrafts();
      } catch {
        setSaveState('error');
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [activeDraftId, draftStore, draftsLoaded, form, refreshDrafts]);

  const persistCurrent = async (status: ConsignmentDraftStatus) => {
    if (!draftStore) throw new Error('Inicia sesion para guardar el borrador.');
    autosaveVersion.current += 1;
    const id = activeDraftId ?? createDraftId();
    const existing = await draftStore.get(id);
    const draft = existing
      ? {
          ...existing,
          status,
          ultimoError: null,
          updatedAt: new Date().toISOString(),
          form,
        }
      : createConsignmentDraft(form, { id, status });
    await draftStore.save(draft);
    lastSavedFingerprint.current = JSON.stringify(form);
    if (!activeDraftId) setActiveDraftId(id);
    setSaveState('saved');
    await refreshDrafts();
    return draft;
  };

  const paso1Ok = (puedeContinuar || offline) && aceptaTyc && aceptaJurada;
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
    const selected = await pickImages({
      selectionLimit: remaining,
      quality: 1,
      fallbackBaseName: 'bien-consignado',
    });
    if (selected.length === 0) return;
    let copyFailures = 0;
    const stored = await Promise.all(
      selected.map(async photo => {
        try {
          const privateFile = await copyUriToPrivateDraftStorage(
            photo.uri,
            photo.name,
          );
          return {
            ...privateFile,
            persistedLocal: true,
            originalUri: photo.uri,
          };
        } catch {
          copyFailures += 1;
          return {
            ...photo,
            persistedLocal: false,
            originalUri: photo.uri,
          };
        }
      }),
    );
    setFotos(prev => [...prev, ...stored].slice(0, MAX_FOTOS));
    if (copyFailures > 0) {
      Alert.alert(
        'Fotos guardadas parcialmente',
        'Algunas fotos pueden requerir volver a seleccionarse si Android las limpia.',
      );
    }
  };

  const quitarFoto = (index: number) => {
    Alert.alert('Eliminar foto', '¿Querés quitar esta foto de la solicitud?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const removed = form.fotos[index];
          const next = removeConsignmentPhoto(form, index);
          setFotos(next.fotos);
          setPortadaUri(next.portadaUri);
          if (removed?.persistedLocal === true) {
            await deletePrivateDraftFile(removed.uri);
          }
        },
      },
    ]);
  };

  const moverFoto = (from: number, to: number) => {
    setFotos(current => moveConsignmentPhoto(current, from, to));
  };

  const handleEnviar = async () => {
    if (!segmento) return;
    if (offline) {
      try {
        await persistCurrent('pendiente_subida');
        Alert.alert(
          'Solicitud guardada',
          'Guardamos tu solicitud en este dispositivo para enviarla cuando vuelva la conexion.',
        );
      } catch {
        setSaveState('error');
        Alert.alert('No se pudo guardar el borrador');
      }
      return;
    }
    setSubmitting(true);
    try {
      const draft = await persistCurrent('pendiente_subida');
      await retryAndOpenSuccess(draft.id);
    } catch (err) {
      Alert.alert('No se pudo enviar la solicitud', retryError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const retryAndOpenSuccess = async (id: string) => {
    if (!draftStore) throw new Error('Inicia sesion para enviar el borrador.');
    const result = await retryConsignmentDraft(draftStore, id, {
      online: !offline,
      connectionType: network.type,
      confirmHeavyAction,
      canReadUri: canReadLocalUri,
      deletePrivateFile: deletePrivateDraftFile,
      submit: consignacionesApi.crear,
      readableError,
    });
    await refreshDrafts();
    if (result.outcome === 'cancelled') return;
    completedDraft.current = true;
    const ui = mapConsignacionDetalle(result.value);
    navigation.replace('ConsignacionExito', {
      id: ui.id,
      codigo: `#CONS-${ui.id}`,
      titulo: ui.titulo,
    });
  };

  const handleRetry = async (id: string) => {
    if (offline) {
      Alert.alert('Sin conexion', 'Conectate para reintentar el envio.');
      return;
    }
    setSubmitting(true);
    try {
      await retryAndOpenSuccess(id);
    } catch (err) {
      await refreshDrafts();
      Alert.alert('No se pudo enviar la solicitud', retryError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const continueEditing = (draft: ConsignmentDraft) => {
    autosaveVersion.current += 1;
    lastSavedFingerprint.current = JSON.stringify(draft.form);
    setActiveDraftId(draft.id);
    setAceptaTyc(draft.form.aceptaTyc);
    setAceptaJurada(draft.form.aceptaJurada);
    setTitulo(draft.form.titulo);
    setSegmento(draft.form.segmento);
    setDescripcion(draft.form.descripcion);
    setHistoria(draft.form.historia);
    setFechaAproximada(draft.form.fechaAproximada);
    setEsObraDeArte(draft.form.esObraDeArte);
    setAutor(draft.form.autor);
    setFotos(draft.form.fotos);
    setPortadaUri(draft.form.portadaUri);
    setPaso(2);
    if (draft.form.fotos.some(photo => photo.persistedLocal !== true)) {
      Alert.alert(
        'Revisa las fotos antes de enviar',
        'Una o mas fotos no estan en el almacenamiento privado. Si ya no estan disponibles, vas a tener que seleccionarlas nuevamente.',
      );
    }
  };

  const deleteDraft = (id: string) => {
    Alert.alert('Eliminar borrador', 'Esta accion no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (!draftStore) return;
          await removeConsignmentDraftAndFiles(
            draftStore,
            id,
            deletePrivateDraftFile,
          );
          if (activeDraftId === id) {
            autosaveVersion.current += 1;
            lastSavedFingerprint.current = '';
            setActiveDraftId(null);
            setSaveState('idle');
            setPaso(1);
            setAceptaTyc(false);
            setAceptaJurada(false);
            setTitulo('');
            setSegmento(null);
            setDescripcion('');
            setHistoria('');
            setFechaAproximada('');
            setEsObraDeArte(false);
            setAutor('');
            setFotos([]);
            setPortadaUri(null);
          }
          await refreshDrafts();
        },
      },
    ]);
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
              <DraftsPanel
                drafts={drafts}
                activeDraftId={activeDraftId}
                offline={offline}
                submitting={submitting}
                onRetry={handleRetry}
                onDelete={deleteDraft}
                onContinue={continueEditing}
              />
              <Typography style={styles.pasoLabel}>PASO {paso} DE 2</Typography>
              <Heading style={styles.titulo}>
                {paso === 1 ? 'Consigna tu bien' : 'Datos del bien'}
              </Heading>
              <Body muted style={styles.subtitulo}>
                {paso === 1
                  ? 'Revisa requisitos reales y acepta las condiciones para empezar.'
                  : 'Carga datos y fotos reales para enviar la solicitud.'}
              </Body>
              {offline ? (
                <Typography style={styles.offlineNote}>
                  Estas sin conexion. Podes completar el formulario y guardarlo;
                  el envio siempre se inicia manualmente.
                </Typography>
              ) : null}
              {saveState !== 'idle' ? (
                <Typography
                  style={
                    saveState === 'error'
                      ? styles.saveError
                      : styles.saveStatus
                  }
                >
                  {saveState === 'pending'
                    ? 'Cambios pendientes de guardar'
                    : saveState === 'saved'
                      ? 'Borrador guardado en este dispositivo'
                      : 'No se pudo guardar el borrador'}
                </Typography>
              ) : null}

              {paso === 1 ? (
                <Paso1
                  requisitos={requisitos}
                  puedeContinuar={puedeContinuar || offline}
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
                  portadaUri={portadaUri}
                  minimoFotos={minimoFotos}
                  onAgregarFotos={elegirFotos}
                  onQuitarFoto={quitarFoto}
                  onMoverFoto={moverFoto}
                  onMarcarPortada={index => setPortadaUri(fotos[index].uri)}
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

function DraftsPanel({
  drafts,
  activeDraftId,
  offline,
  submitting,
  onRetry,
  onDelete,
  onContinue,
}: {
  drafts: ConsignmentDraft[];
  activeDraftId: string | null;
  offline: boolean;
  submitting: boolean;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onContinue: (draft: ConsignmentDraft) => void;
}) {
  const visible = drafts.filter(
    draft =>
      draft.status !== 'completado' &&
      (draft.id !== activeDraftId || draft.status !== 'borrador'),
  );
  const pendingCount = drafts.filter(draft =>
    ['pendiente_subida', 'fallido', 'subiendo'].includes(draft.status),
  ).length;
  if (visible.length === 0 && pendingCount === 0) return null;
  return (
    <View style={styles.draftsPanel}>
      <Typography style={styles.sectionLabel}>
        SOLICITUDES PENDIENTES: {pendingCount}
      </Typography>
      {pendingCount > 0 && !offline ? (
        <Typography style={styles.pendingNotice}>
          Volvio la conexion. Revisa y reintenta el envio cuando quieras.
        </Typography>
      ) : null}
      {visible.map(draft => (
        <View key={draft.id} style={styles.draftCard}>
          <Typography style={styles.draftTitle} numberOfLines={1}>
            {draft.form.titulo || 'Consignacion sin titulo'}
          </Typography>
          <Typography style={styles.draftMeta}>
            {draftStatusLabel(draft.status)} · {draft.form.fotos.length} fotos
          </Typography>
          {draft.ultimoError ? (
            <Typography style={styles.saveError}>{draft.ultimoError}</Typography>
          ) : null}
          <View style={styles.draftActions}>
            {draft.status === 'pendiente_subida' ||
            draft.status === 'fallido' ? (
              <TouchableOpacity
                disabled={offline || submitting}
                onPress={() => onRetry(draft.id)}
              >
                <Typography
                  style={[
                    styles.draftAction,
                    offline ? styles.draftActionDisabled : null,
                  ]}
                >
                  Reintentar
                </Typography>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={() => onContinue(draft)}>
              <Typography style={styles.draftAction}>
                Continuar editando
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(draft.id)}>
              <Typography style={styles.deleteAction}>Eliminar</Typography>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
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
  portadaUri,
  minimoFotos,
  onAgregarFotos,
  onQuitarFoto,
  onMoverFoto,
  onMarcarPortada,
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
  portadaUri: string | null;
  minimoFotos: number;
  onAgregarFotos: () => void;
  onQuitarFoto: (index: number) => void;
  onMoverFoto: (from: number, to: number) => void;
  onMarcarPortada: (index: number) => void;
}) {
  const fotosOk = fotos.length >= minimoFotos;
  const [failedUris, setFailedUris] = useState<Set<string>>(() => new Set());
  const effectiveCoverUri = portadaUri ?? fotos[0]?.uri ?? null;
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
            {fotos.map((foto, i) => {
              const isCover = foto.uri === effectiveCoverUri;
              const failed = failedUris.has(foto.uri);
              return (
                <View
                  key={`${foto.uri}-${i}`}
                  style={[styles.thumb, isCover ? styles.thumbCover : null]}
                >
                  {failed ? (
                    <View style={styles.thumbFallback}>
                      <Icon name="image" size={22} color={colors.textSubtle} />
                      <Typography style={styles.thumbFallbackText}>
                        Sin vista previa
                      </Typography>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: foto.uri }}
                      style={styles.thumbImage}
                      resizeMode="cover"
                      onError={() =>
                        setFailedUris(current =>
                          new Set(current).add(foto.uri),
                        )
                      }
                    />
                  )}
                  <TouchableOpacity
                    accessibilityLabel={`Eliminar ${foto.name}`}
                    onPress={() => onQuitarFoto(i)}
                    style={styles.thumbRemove}
                  >
                    <Typography style={styles.thumbRemoveText}>×</Typography>
                  </TouchableOpacity>
                  <View style={styles.thumbFooter}>
                    <TouchableOpacity
                      disabled={i === 0}
                      onPress={() => onMoverFoto(i, i - 1)}
                    >
                      <Typography
                        style={[styles.thumbControl, i === 0 && styles.thumbControlDisabled]}
                      >
                        ←
                      </Typography>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onMarcarPortada(i)}>
                      <Typography
                        style={[styles.coverControl, isCover && styles.coverControlActive]}
                      >
                        {isCover ? 'Portada' : 'Hacer portada'}
                      </Typography>
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={i === fotos.length - 1}
                      onPress={() => onMoverFoto(i, i + 1)}
                    >
                      <Typography
                        style={[
                          styles.thumbControl,
                          i === fotos.length - 1 && styles.thumbControlDisabled,
                        ]}
                      >
                        →
                      </Typography>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
        {fotos.some(photo => photo.persistedLocal === true) ? (
          <Typography style={styles.privatePhotoNote}>
            Fotos guardadas en este dispositivo para esta solicitud.
          </Typography>
        ) : null}
        {fotos.some(
          photo => photo.persistedLocal !== true && !!photo.originalUri,
        ) ? (
          <Typography style={styles.privatePhotoWarning}>
            Algunas fotos pueden requerir volver a seleccionarse si Android las
            limpia.
          </Typography>
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

function readableError(err: unknown) {
  return userFacingError(
    err,
    'QuickBid no esta disponible. Probalo de nuevo en unos minutos.',
  );
}

function retryError(err: unknown) {
  return err instanceof Error && err.message ? err.message : readableError(err);
}

function hasDraftContent(form: ConsignmentDraftForm) {
  return Boolean(
    form.titulo ||
      form.segmento ||
      form.descripcion ||
      form.historia ||
      form.fechaAproximada ||
      form.aceptaTyc ||
      form.aceptaJurada ||
      form.esObraDeArte ||
      form.autor ||
      form.fotos.length,
  );
}

function draftStatusLabel(status: ConsignmentDraftStatus) {
  const labels: Record<ConsignmentDraftStatus, string> = {
    borrador: 'Borrador',
    pendiente_subida: 'Pendiente de envio',
    subiendo: 'Enviando',
    fallido: 'Envio fallido',
    completado: 'Completado',
  };
  return labels[status];
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
  offlineNote: {
    fontSize: fontSize.sm,
    color: colors.warning,
    backgroundColor: colors.warningSoft,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  saveStatus: { fontSize: fontSize.sm, color: colors.textMuted },
  saveError: { fontSize: fontSize.sm, color: colors.danger },
  privatePhotoNote: { fontSize: fontSize.sm, color: colors.success },
  privatePhotoWarning: { fontSize: fontSize.sm, color: colors.warning },
  draftsPanel: {
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  pendingNotice: { fontSize: fontSize.sm, color: colors.textMuted },
  draftCard: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  draftTitle: { fontWeight: fontWeight.semibold, color: colors.text },
  draftMeta: { fontSize: fontSize.sm, color: colors.textMuted },
  draftActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.base },
  draftAction: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  draftActionDisabled: { color: colors.textSubtle },
  deleteAction: {
    fontSize: fontSize.sm,
    color: colors.danger,
    fontWeight: fontWeight.semibold,
  },
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
    width: 132,
    minHeight: 132,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    overflow: 'hidden',
  },
  thumbCover: { borderWidth: 2, borderColor: colors.primary },
  thumbImage: { width: '100%', height: 94, backgroundColor: colors.surfaceMuted },
  thumbFallback: {
    height: 94,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  thumbFallbackText: { fontSize: 9, color: colors.textMuted },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
  },
  thumbRemoveText: {
    color: colors.textInverse,
    fontSize: 20,
    lineHeight: 21,
    fontWeight: fontWeight.bold,
  },
  thumbFooter: {
    minHeight: 36,
    paddingHorizontal: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
  },
  thumbControl: { color: colors.primary, fontSize: 20, fontWeight: fontWeight.bold },
  thumbControlDisabled: { color: colors.textSubtle },
  coverControl: { color: colors.textMuted, fontSize: 9 },
  coverControlActive: { color: colors.primary, fontWeight: fontWeight.bold },
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
