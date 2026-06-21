import {
  CONSIGNMENT_DRAFTS_STORAGE_KEY,
  ConsignmentDraftForm,
  createConsignmentDraft,
  createConsignmentDraftStore,
  deserializeConsignmentDrafts,
  retryConsignmentDraft,
  serializeConsignmentDrafts,
} from '../src/offline/consignmentDrafts';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

function form(): ConsignmentDraftForm {
  return {
    titulo: 'Reloj antiguo',
    segmento: 'relojeria',
    descripcion: 'Reloj en buen estado',
    historia: 'Herencia familiar',
    fechaAproximada: '1978',
    aceptaTyc: true,
    aceptaJurada: true,
    esObraDeArte: false,
    autor: '',
    fotos: [
      { uri: 'file:///cache/reloj.jpg', name: 'reloj.jpg', type: 'image/jpeg' },
    ],
  };
}

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      values.delete(key);
    }),
  };
}

describe('consignment drafts', () => {
  test('serializes and deserializes only the allowed metadata', () => {
    const draft = createConsignmentDraft(form(), {
      id: 'draft-1',
      now: '2026-06-21T12:00:00.000Z',
    });
    const unsafe = {
      ...draft,
      accessToken: 'secret-access',
      refreshToken: 'secret-refresh',
      form: { ...draft.form, token: 'secret-form' },
    };
    const raw = serializeConsignmentDrafts([unsafe]);
    const restored = deserializeConsignmentDrafts(raw);

    expect(raw).not.toContain('secret');
    expect(restored).toEqual([draft]);
  });

  test('saves a draft and marks it pending upload', async () => {
    const storage = memoryStorage();
    const store = createConsignmentDraftStore(storage);
    const draft = createConsignmentDraft(form(), { id: 'draft-1' });

    await store.save(draft);
    await store.update('draft-1', { status: 'pendiente_subida' });

    expect((await store.get('draft-1'))?.status).toBe('pendiente_subida');
    expect(storage.values.has(CONSIGNMENT_DRAFTS_STORAGE_KEY)).toBe(true);
  });

  test('successful manual retry submits, marks uploading and cleans metadata', async () => {
    const storage = memoryStorage();
    const store = createConsignmentDraftStore(storage);
    await store.save(
      createConsignmentDraft(form(), {
        id: 'draft-1',
        status: 'pendiente_subida',
      }),
    );
    const submit = jest.fn(async () => {
      expect((await store.get('draft-1'))?.status).toBe('subiendo');
      return { id: 42 };
    });

    const result = await retryConsignmentDraft(store, 'draft-1', {
      online: true,
      connectionType: 'wifi',
      confirmHeavyAction: async () => true,
      canReadUri: async () => true,
      submit,
      readableError: () => 'Error legible',
    });

    expect(result).toEqual({ outcome: 'sent', value: { id: 42 } });
    expect(submit).toHaveBeenCalledTimes(1);
    expect(
      storage.setItem.mock.calls.some(([, value]) =>
        value.includes('completado'),
      ),
    ).toBe(true);
    expect(await store.list()).toEqual([]);
  });

  test('failed retry retains the draft and readable error', async () => {
    const store = createConsignmentDraftStore(memoryStorage());
    await store.save(
      createConsignmentDraft(form(), {
        id: 'draft-1',
        status: 'pendiente_subida',
      }),
    );

    await expect(
      retryConsignmentDraft(store, 'draft-1', {
        online: true,
        connectionType: 'wifi',
        confirmHeavyAction: async () => true,
        canReadUri: async () => true,
        submit: async () => {
          throw new Error('network');
        },
        readableError: () => 'No pudimos contactar a QuickBid.',
      }),
    ).rejects.toThrow('No pudimos contactar a QuickBid.');

    expect(await store.get('draft-1')).toMatchObject({
      status: 'fallido',
      ultimoError: 'No pudimos contactar a QuickBid.',
    });
  });

  test('delete removes all stored metadata', async () => {
    const storage = memoryStorage();
    const store = createConsignmentDraftStore(storage);
    await store.save(createConsignmentDraft(form(), { id: 'draft-1' }));

    await store.remove('draft-1');

    expect(await store.list()).toEqual([]);
    expect(storage.values.has(CONSIGNMENT_DRAFTS_STORAGE_KEY)).toBe(false);
  });

  test('cellular retry with photos asks before submitting', async () => {
    const store = createConsignmentDraftStore(memoryStorage());
    await store.save(
      createConsignmentDraft(form(), {
        id: 'draft-1',
        status: 'pendiente_subida',
      }),
    );
    const confirmHeavyAction = jest.fn(async () => false);
    const canReadUri = jest.fn(async () => true);
    const submit = jest.fn(async () => ({ id: 42 }));

    const result = await retryConsignmentDraft(store, 'draft-1', {
      online: true,
      connectionType: 'cellular',
      confirmHeavyAction,
      canReadUri,
      submit,
      readableError: () => 'Error',
    });

    expect(result).toEqual({ outcome: 'cancelled' });
    expect(confirmHeavyAction).toHaveBeenCalledTimes(1);
    expect(canReadUri).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
    expect((await store.get('draft-1'))?.status).toBe('pendiente_subida');
  });

  test('missing temporary photo retains the draft for reselection', async () => {
    const store = createConsignmentDraftStore(memoryStorage());
    await store.save(
      createConsignmentDraft(form(), {
        id: 'draft-1',
        status: 'pendiente_subida',
      }),
    );

    await expect(
      retryConsignmentDraft(store, 'draft-1', {
        online: true,
        connectionType: 'wifi',
        confirmHeavyAction: async () => true,
        canReadUri: async () => false,
        submit: async () => ({ id: 42 }),
        readableError: () => 'Error',
      }),
    ).rejects.toThrow('volve a seleccionarlas');
    expect((await store.get('draft-1'))?.status).toBe('fallido');
  });
});
