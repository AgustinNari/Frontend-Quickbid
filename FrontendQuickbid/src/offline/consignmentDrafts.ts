import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ConsignacionFileInput,
  CrearConsignacionRequest,
} from '../types/consignacionApi';
import { SubastaSegmento } from '../types/subasta';

export const CONSIGNMENT_DRAFTS_STORAGE_KEY =
  '@quickbid/consignment-drafts/v1';

export type ConsignmentDraftStatus =
  | 'borrador'
  | 'pendiente_subida'
  | 'subiendo'
  | 'fallido'
  | 'completado';

export type ConsignmentDraftForm = {
  titulo: string;
  segmento: SubastaSegmento | null;
  descripcion: string;
  historia: string;
  fechaAproximada: string;
  aceptaTyc: boolean;
  aceptaJurada: boolean;
  esObraDeArte: boolean;
  autor: string;
  fotos: ConsignacionFileInput[];
};

export type ConsignmentDraft = {
  id: string;
  status: ConsignmentDraftStatus;
  createdAt: string;
  updatedAt: string;
  ultimoError: string | null;
  form: ConsignmentDraftForm;
};

export type DraftStorage = Pick<
  typeof AsyncStorage,
  'getItem' | 'setItem' | 'removeItem'
>;

export type ConsignmentDraftStore = ReturnType<
  typeof createConsignmentDraftStore
>;

const STATUSES: ConsignmentDraftStatus[] = [
  'borrador',
  'pendiente_subida',
  'subiendo',
  'fallido',
  'completado',
];

export function createDraftId(now = Date.now()) {
  return `consignacion-${now}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createConsignmentDraft(
  form: ConsignmentDraftForm,
  options: {
    id?: string;
    status?: ConsignmentDraftStatus;
    now?: string;
  } = {},
): ConsignmentDraft {
  const now = options.now ?? new Date().toISOString();
  return {
    id: options.id ?? createDraftId(),
    status: options.status ?? 'borrador',
    createdAt: now,
    updatedAt: now,
    ultimoError: null,
    form: sanitizeForm(form),
  };
}

export function serializeConsignmentDrafts(drafts: ConsignmentDraft[]) {
  // Sanitizing before JSON.stringify is intentional: callers cannot accidentally
  // persist auth tokens or other fields added to an object at runtime.
  return JSON.stringify(drafts.map(sanitizeDraft).filter(Boolean));
}

export function deserializeConsignmentDrafts(raw: string | null) {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(sanitizeDraft)
      .filter((draft): draft is ConsignmentDraft => draft !== null);
  } catch {
    return [];
  }
}

export function createConsignmentDraftStore(storage: DraftStorage = AsyncStorage) {
  async function list() {
    return deserializeConsignmentDrafts(
      await storage.getItem(CONSIGNMENT_DRAFTS_STORAGE_KEY),
    );
  }

  async function write(drafts: ConsignmentDraft[]) {
    if (drafts.length === 0) {
      await storage.removeItem(CONSIGNMENT_DRAFTS_STORAGE_KEY);
      return;
    }
    await storage.setItem(
      CONSIGNMENT_DRAFTS_STORAGE_KEY,
      serializeConsignmentDrafts(drafts),
    );
  }

  async function save(draft: ConsignmentDraft) {
    const drafts = await list();
    const next = drafts.filter(item => item.id !== draft.id);
    next.unshift(sanitizeDraft(draft) as ConsignmentDraft);
    await write(next);
    return next[0];
  }

  async function get(id: string) {
    return (await list()).find(draft => draft.id === id) ?? null;
  }

  async function update(
    id: string,
    patch: Partial<
      Pick<ConsignmentDraft, 'status' | 'ultimoError' | 'form'>
    >,
    now = new Date().toISOString(),
  ) {
    const draft = await get(id);
    if (!draft) return null;
    return save({
      ...draft,
      ...patch,
      form: patch.form ? sanitizeForm(patch.form) : draft.form,
      updatedAt: now,
    });
  }

  async function remove(id: string) {
    await write((await list()).filter(draft => draft.id !== id));
  }

  return { list, save, get, update, remove };
}

export const consignmentDraftStore = createConsignmentDraftStore();

export type RetryDraftDependencies<T> = {
  online: boolean;
  connectionType: string;
  confirmHeavyAction: () => Promise<boolean>;
  canReadUri: (uri: string) => Promise<boolean>;
  submit: (request: CrearConsignacionRequest) => Promise<T>;
  readableError: (error: unknown) => string;
};

export async function retryConsignmentDraft<T>(
  store: ConsignmentDraftStore,
  id: string,
  dependencies: RetryDraftDependencies<T>,
): Promise<{ outcome: 'sent'; value: T } | { outcome: 'cancelled' }> {
  const draft = await store.get(id);
  if (!draft) throw new Error('El borrador ya no existe en este dispositivo.');
  if (!dependencies.online) {
    throw new Error('Necesitas conexion para reintentar el envio.');
  }
  if (
    draft.form.fotos.length > 0 &&
    dependencies.connectionType === 'cellular' &&
    !(await dependencies.confirmHeavyAction())
  ) {
    return { outcome: 'cancelled' };
  }

  const readablePhotos = await Promise.all(
    draft.form.fotos.map(photo => dependencies.canReadUri(photo.uri)),
  );
  if (readablePhotos.some(readable => !readable)) {
    const message =
      'Algunas fotos ya no estan disponibles. Continua editando y volve a seleccionarlas.';
    await store.update(id, { status: 'fallido', ultimoError: message });
    throw new Error(message);
  }

  await store.update(id, { status: 'subiendo', ultimoError: null });
  try {
    const value = await dependencies.submit(toRequest(draft.form));
    await store.update(id, { status: 'completado', ultimoError: null });
    await store.remove(id);
    return { outcome: 'sent', value };
  } catch (error) {
    const message = dependencies.readableError(error);
    await store.update(id, { status: 'fallido', ultimoError: message });
    throw new Error(message);
  }
}

export function toRequest(form: ConsignmentDraftForm): CrearConsignacionRequest {
  if (!form.segmento) throw new Error('Selecciona un segmento antes de enviar.');
  return {
    segmento: form.segmento,
    aceptaTyC: form.aceptaTyc,
    declaracionPropiedadYOrigenLicito: form.aceptaJurada,
    titulo: form.titulo.trim(),
    descripcion: form.descripcion.trim(),
    historia: form.historia.trim() || undefined,
    fechaAproximada: form.fechaAproximada.trim() || undefined,
    esObraDeArte: form.esObraDeArte,
    autor: form.esObraDeArte ? form.autor.trim() || undefined : undefined,
    fotos: form.fotos,
  };
}

function sanitizeDraft(value: unknown): ConsignmentDraft | null {
  if (!isRecord(value) || !isRecord(value.form)) return null;
  if (typeof value.id !== 'string' || value.id.length === 0) return null;
  const status = STATUSES.includes(value.status as ConsignmentDraftStatus)
    ? (value.status as ConsignmentDraftStatus)
    : 'borrador';
  return {
    id: value.id,
    status,
    createdAt: asString(value.createdAt) || new Date(0).toISOString(),
    updatedAt: asString(value.updatedAt) || new Date(0).toISOString(),
    ultimoError:
      typeof value.ultimoError === 'string' ? value.ultimoError : null,
    form: sanitizeForm(value.form as Partial<ConsignmentDraftForm>),
  };
}

function sanitizeForm(
  value: Partial<ConsignmentDraftForm>,
): ConsignmentDraftForm {
  return {
    titulo: asString(value.titulo),
    segmento: isSegmento(value.segmento) ? value.segmento : null,
    descripcion: asString(value.descripcion),
    historia: asString(value.historia),
    fechaAproximada: asString(value.fechaAproximada),
    aceptaTyc: value.aceptaTyc === true,
    aceptaJurada: value.aceptaJurada === true,
    esObraDeArte: value.esObraDeArte === true,
    autor: asString(value.autor),
    fotos: Array.isArray(value.fotos)
      ? value.fotos
          .filter(isRecord)
          .map(photo => ({
            uri: asString(photo.uri),
            name: asString(photo.name),
            type: asString(photo.type),
          }))
          .filter(photo => photo.uri && photo.name && photo.type)
      : [],
  };
}

function isSegmento(value: unknown): value is SubastaSegmento {
  return [
    'arte',
    'joyas',
    'vehiculos',
    'relojeria',
    'antiguedades',
    'diseno',
    'coleccion',
  ].includes(value as string);
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
