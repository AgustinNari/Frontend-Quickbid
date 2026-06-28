import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ConsignacionFileInput,
  CrearConsignacionRequest,
} from '../types/consignacionApi';
import { SubastaSegmento } from '../types/subasta';

export const LEGACY_CONSIGNMENT_DRAFTS_STORAGE_KEY =
  '@quickbid/consignment-drafts/v1';
export const CONSIGNMENT_DRAFTS_STORAGE_KEY_PREFIX =
  '@quickbid/consignment-drafts/v2';

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
  historiaExtendida?: string;
  fechaAproximada: string;
  aceptaTyc: boolean;
  aceptaJurada: boolean;
  esObraDeArte: boolean;
  autor: string;
  fotos: ConsignacionFileInput[];
  portadaUri: string | null;
  documentacionOrigen?: ConsignacionFileInput | null;
};

export type ConsignmentDraft = {
  id: string;
  status: ConsignmentDraftStatus;
  createdAt: string;
  updatedAt: string;
  ultimoError: string | null;
  idempotencyKey: string;
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

let legacyMigrationQueue: Promise<void> = Promise.resolve();

function enqueueLegacyMigration(operation: () => Promise<void>) {
  const result = legacyMigrationQueue.then(operation, operation);
  legacyMigrationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

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
  const id = options.id ?? createDraftId();
  return {
    id,
    status: options.status ?? 'borrador',
    createdAt: now,
    updatedAt: now,
    ultimoError: null,
    idempotencyKey: `consignment-create-${id}`,
    form: sanitizeForm(form),
  };
}

export function serializeConsignmentDrafts(drafts: ConsignmentDraft[]) {
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

export function consignmentDraftsStorageKey(userId: number | string) {
  const normalized = String(userId).trim();
  if (!normalized) throw new Error('Se necesita una cuenta para guardar borradores.');
  return `${CONSIGNMENT_DRAFTS_STORAGE_KEY_PREFIX}/${encodeURIComponent(normalized)}`;
}

export function createConsignmentDraftStore(
  userId: number | string,
  storage: DraftStorage = AsyncStorage,
) {
  const storageKey = consignmentDraftsStorageKey(userId);
  let migrationPromise: Promise<void> | null = null;
  let mutationQueue: Promise<void> = Promise.resolve();

  function ensureLegacyMigrated() {
    if (migrationPromise) return migrationPromise;
    migrationPromise = enqueueLegacyMigration(async () => {
      const legacyRaw = await storage.getItem(
        LEGACY_CONSIGNMENT_DRAFTS_STORAGE_KEY,
      );
      if (!legacyRaw) return;
      const legacy = deserializeConsignmentDrafts(legacyRaw);
      const current = deserializeConsignmentDrafts(
        await storage.getItem(storageKey),
      );
      const currentIds = new Set(current.map(draft => draft.id));
      const merged = [
        ...current,
        ...legacy.filter(draft => !currentIds.has(draft.id)),
      ];
      if (merged.length > 0) {
        await storage.setItem(storageKey, serializeConsignmentDrafts(merged));
      }
      await storage.removeItem(LEGACY_CONSIGNMENT_DRAFTS_STORAGE_KEY);
    });
    return migrationPromise;
  }

  function enqueueMutation<T>(operation: () => Promise<T>) {
    const result = mutationQueue.then(operation, operation);
    mutationQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  async function list() {
    await ensureLegacyMigrated();
    return deserializeConsignmentDrafts(
      await storage.getItem(storageKey),
    );
  }

  async function write(drafts: ConsignmentDraft[]) {
    if (drafts.length === 0) {
      await storage.removeItem(storageKey);
      return;
    }
    await storage.setItem(
      storageKey,
      serializeConsignmentDrafts(drafts),
    );
  }

  async function saveNow(draft: ConsignmentDraft) {
    const drafts = await list();
    const next = drafts.filter(item => item.id !== draft.id);
    next.unshift(sanitizeDraft(draft) as ConsignmentDraft);
    await write(next);
    return next[0];
  }

  function save(draft: ConsignmentDraft) {
    return enqueueMutation(() => saveNow(draft));
  }

  async function get(id: string) {
    return (await list()).find(draft => draft.id === id) ?? null;
  }

  function update(
    id: string,
    patch: Partial<
      Pick<ConsignmentDraft, 'status' | 'ultimoError' | 'form'>
    >,
    now = new Date().toISOString(),
  ) {
    return enqueueMutation(async () => {
      const draft = await get(id);
      if (!draft) return null;
      return saveNow({
        ...draft,
        ...patch,
        form: patch.form ? sanitizeForm(patch.form) : draft.form,
        updatedAt: now,
      });
    });
  }

  function remove(id: string) {
    return enqueueMutation(async () => {
      await write((await list()).filter(draft => draft.id !== id));
    });
  }

  return { list, save, get, update, remove };
}

export type RetryDraftDependencies<T> = {
  online: boolean;
  connectionType: string;
  confirmHeavyAction: () => Promise<boolean>;
  canReadUri: (uri: string) => Promise<boolean>;
  deletePrivateFile: (uri: string) => Promise<boolean>;
  submit: (request: CrearConsignacionRequest) => Promise<T>;
  submitDocumentation?: (
    created: T,
    file: ConsignacionFileInput,
  ) => Promise<void>;
  readableError: (error: unknown) => string;
};

export async function retryConsignmentDraft<T>(
  store: ConsignmentDraftStore,
  id: string,
  dependencies: RetryDraftDependencies<T>,
): Promise<
  | { outcome: 'sent'; value: T; documentationWarning?: string }
  | { outcome: 'cancelled' }
> {
  const draft = await store.get(id);
  if (!draft) throw new Error('El borrador ya no existe en este dispositivo.');
  if (!dependencies.online) {
    throw new Error('Necesitás conexión para reintentar el envío.');
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
      'Algunas fotos ya no están disponibles. Continuá editando y volvé a seleccionarlas.';
    await store.update(id, { status: 'fallido', ultimoError: message });
    throw new Error(message);
  }

  let documentationReadable = true;
  if (draft.form.documentacionOrigen) {
    try {
      documentationReadable = await dependencies.canReadUri(
        draft.form.documentacionOrigen.uri,
      );
    } catch {
      documentationReadable = false;
    }
  }

  await store.update(id, { status: 'subiendo', ultimoError: null });
  try {
    const value = await dependencies.submit(
      toRequest(draft.form, draft.idempotencyKey),
    );
    let documentationWarning: string | undefined;
    if (draft.form.documentacionOrigen && dependencies.submitDocumentation) {
      if (!documentationReadable) {
        documentationWarning =
          'La solicitud fue enviada. La documentación de origen puede cargarse luego desde el detalle.';
      } else {
        try {
          await dependencies.submitDocumentation(
            value,
            draft.form.documentacionOrigen,
          );
        } catch {
          documentationWarning =
            'La solicitud fue enviada. La documentación de origen puede cargarse luego desde el detalle.';
        }
      }
    }
    await store.update(id, { status: 'completado', ultimoError: null });
    await removeConsignmentDraftAndFiles(
      store,
      id,
      dependencies.deletePrivateFile,
    );
    return { outcome: 'sent', value, documentationWarning };
  } catch (error) {
    const message = dependencies.readableError(error);
    await store.update(id, { status: 'fallido', ultimoError: message });
    throw new Error(message);
  }
}

export function toRequest(
  form: ConsignmentDraftForm,
  idempotencyKey?: string,
): CrearConsignacionRequest {
  if (!form.segmento) throw new Error('Selecciona un segmento antes de enviar.');
  return {
    segmento: form.segmento,
    aceptaTyC: form.aceptaTyc,
    declaracionPropiedadYOrigenLicito: form.aceptaJurada,
    titulo: form.titulo.trim(),
    descripcion: form.descripcion.trim(),
    historia: form.historia.trim() || undefined,
    historiaExtendida: form.historiaExtendida?.trim() || undefined,
    fechaAproximada: form.fechaAproximada.trim() || undefined,
    esObraDeArte: form.esObraDeArte,
    autor: form.esObraDeArte ? form.autor.trim() || undefined : undefined,
    fotos: photosForUpload(form),
    idempotencyKey,
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
    idempotencyKey:
      asString(value.idempotencyKey) || `consignment-create-${value.id}`,
    form: sanitizeForm(value.form as Partial<ConsignmentDraftForm>),
  };
}

function sanitizeForm(
  value: Partial<ConsignmentDraftForm>,
): ConsignmentDraftForm {
  const fotos = Array.isArray(value.fotos)
    ? value.fotos
        .filter(isRecord)
        .map(photo => ({
          uri: asString(photo.uri),
          name: asString(photo.name),
          type: asString(photo.type),
          persistedLocal: photo.persistedLocal === true,
          originalUri: asString(photo.originalUri) || undefined,
          sizeBytes:
            typeof photo.sizeBytes === 'number' &&
            Number.isFinite(photo.sizeBytes) &&
            photo.sizeBytes >= 0
              ? photo.sizeBytes
              : undefined,
        }))
        .filter(photo => photo.uri && photo.name && photo.type)
    : [];
  const documentacionOrigen = isRecord(value.documentacionOrigen)
    ? sanitizeFile(value.documentacionOrigen)
    : null;
  const portadaUri = asString(value.portadaUri);
  return {
    titulo: asString(value.titulo),
    segmento: isSegmento(value.segmento) ? value.segmento : null,
    descripcion: asString(value.descripcion),
    historia: asString(value.historia),
    historiaExtendida: asString(value.historiaExtendida),
    fechaAproximada: asString(value.fechaAproximada),
    aceptaTyc: value.aceptaTyc === true,
    aceptaJurada: value.aceptaJurada === true,
    esObraDeArte: value.esObraDeArte === true,
    autor: asString(value.autor),
    fotos,
    documentacionOrigen,
    portadaUri:
      portadaUri && fotos.some(photo => photo.uri === portadaUri)
        ? portadaUri
        : null,
  };
}

export function moveConsignmentPhoto(
  photos: ConsignacionFileInput[],
  from: number,
  to: number,
) {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= photos.length ||
    to >= photos.length
  )
    return photos;
  const next = [...photos];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function removeConsignmentPhoto(
  form: ConsignmentDraftForm,
  index: number,
): ConsignmentDraftForm {
  const removed = form.fotos[index];
  if (!removed) return form;
  return {
    ...form,
    fotos: form.fotos.filter((_, photoIndex) => photoIndex !== index),
    portadaUri: form.portadaUri === removed.uri ? null : form.portadaUri,
  };
}

export function photosForUpload(form: ConsignmentDraftForm) {
  if (!form.portadaUri) return form.fotos;
  const coverIndex = form.fotos.findIndex(photo => photo.uri === form.portadaUri);
  return coverIndex > 0
    ? moveConsignmentPhoto(form.fotos, coverIndex, 0)
    : form.fotos;
}

export async function removeConsignmentDraftAndFiles(
  store: ConsignmentDraftStore,
  id: string,
  deletePrivateFile: (uri: string) => Promise<boolean>,
) {
  const draft = await store.get(id);
  if (!draft) return;
  await Promise.all(
    [...draft.form.fotos, draft.form.documentacionOrigen]
      .filter((photo): photo is ConsignacionFileInput => Boolean(photo))
      .filter(photo => photo.persistedLocal === true)
      .map(async photo => {
        try {
          return await deletePrivateFile(photo.uri);
        } catch {
          return false;
        }
      }),
  );
  await store.remove(id);
}

function sanitizeFile(value: Record<string, unknown>) {
  const file = {
    uri: asString(value.uri),
    name: asString(value.name),
    type: asString(value.type),
    persistedLocal: value.persistedLocal === true,
    originalUri: asString(value.originalUri) || undefined,
    sizeBytes:
      typeof value.sizeBytes === 'number' &&
      Number.isFinite(value.sizeBytes) &&
      value.sizeBytes >= 0
        ? value.sizeBytes
        : undefined,
  };
  return file.uri && file.name && file.type ? file : null;
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
