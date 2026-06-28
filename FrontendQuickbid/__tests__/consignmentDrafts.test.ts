import {
  LEGACY_CONSIGNMENT_DRAFTS_STORAGE_KEY,
  ConsignmentDraftForm,
  consignmentDraftsStorageKey,
  createConsignmentDraft,
  createConsignmentDraftStore,
  deserializeConsignmentDrafts,
  moveConsignmentPhoto,
  photosForUpload,
  removeConsignmentPhoto,
  removeConsignmentDraftAndFiles,
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
    portadaUri: null,
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
    const store = createConsignmentDraftStore(3004, storage);
    const draft = createConsignmentDraft(form(), { id: 'draft-1' });

    await store.save(draft);
    await store.update('draft-1', { status: 'pendiente_subida' });

    expect((await store.get('draft-1'))?.status).toBe('pendiente_subida');
    expect(storage.values.has(consignmentDraftsStorageKey(3004))).toBe(true);
  });

  test('successful manual retry submits, marks uploading and cleans metadata', async () => {
    const storage = memoryStorage();
    const store = createConsignmentDraftStore(3004, storage);
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
      deletePrivateFile: async () => true,
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

  test('uploads optional origin documentation only after creating the consignment', async () => {
    const store = createConsignmentDraftStore(3004, memoryStorage());
    const withDocument = {
      ...form(),
      documentacionOrigen: {
        uri: 'file:///private/origin.jpg',
        name: 'origin.jpg',
        type: 'image/jpeg',
        persistedLocal: true,
      },
    };
    await store.save(createConsignmentDraft(withDocument, { id: 'draft-doc' }));
    const calls: string[] = [];

    const result = await retryConsignmentDraft(store, 'draft-doc', {
      online: true,
      connectionType: 'wifi',
      confirmHeavyAction: async () => true,
      canReadUri: async () => true,
      deletePrivateFile: async () => true,
      submit: async () => {
        calls.push('create');
        return { id: 42 };
      },
      submitDocumentation: async () => {
        calls.push('document');
      },
      readableError: () => 'Error',
    });

    expect(calls).toEqual(['create', 'document']);
    expect(result).toEqual({ outcome: 'sent', value: { id: 42 } });
  });

  test('document upload failure does not report the created consignment as failed', async () => {
    const store = createConsignmentDraftStore(3004, memoryStorage());
    await store.save(
      createConsignmentDraft(
        {
          ...form(),
          documentacionOrigen: {
            uri: 'file:///private/origin.jpg',
            name: 'origin.jpg',
            type: 'image/jpeg',
          },
        },
        { id: 'draft-doc-failure' },
      ),
    );

    const result = await retryConsignmentDraft(store, 'draft-doc-failure', {
      online: true,
      connectionType: 'wifi',
      confirmHeavyAction: async () => true,
      canReadUri: async () => true,
      deletePrivateFile: async () => true,
      submit: async () => ({ id: 42 }),
      submitDocumentation: async () => {
        throw new Error('upload failed');
      },
      readableError: () => 'Error',
    });

    expect(result).toMatchObject({
      outcome: 'sent',
      value: { id: 42 },
      documentationWarning: expect.stringContaining('puede cargarse luego'),
    });
    expect(await store.list()).toEqual([]);
  });

  test('failed retry retains the draft and readable error', async () => {
    const store = createConsignmentDraftStore(3004, memoryStorage());
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
        deletePrivateFile: async () => true,
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
    const store = createConsignmentDraftStore(3004, storage);
    await store.save(createConsignmentDraft(form(), { id: 'draft-1' }));

    await store.remove('draft-1');

    expect(await store.list()).toEqual([]);
    expect(storage.values.has(consignmentDraftsStorageKey(3004))).toBe(false);
  });

  test('cellular retry with photos asks before submitting', async () => {
    const store = createConsignmentDraftStore(3004, memoryStorage());
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
      deletePrivateFile: async () => true,
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
    const store = createConsignmentDraftStore(3004, memoryStorage());
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
        deletePrivateFile: async () => true,
        submit: async () => ({ id: 42 }),
        readableError: () => 'Error',
      }),
    ).rejects.toThrow('volvé a seleccionarlas');
    expect((await store.get('draft-1'))?.status).toBe('fallido');
  });

  test('concurrent interrupted-upload recovery preserves every status update', async () => {
    const store = createConsignmentDraftStore(3004, memoryStorage());
    await store.save(
      createConsignmentDraft(form(), {
        id: 'draft-1',
        status: 'subiendo',
      }),
    );
    await store.save(
      createConsignmentDraft(form(), {
        id: 'draft-2',
        status: 'subiendo',
      }),
    );

    await Promise.all([
      store.update('draft-1', { status: 'fallido' }),
      store.update('draft-2', { status: 'fallido' }),
    ]);

    expect((await store.list()).map(draft => draft.status)).toEqual([
      'fallido',
      'fallido',
    ]);
  });

  test('isolates drafts by account and does not expose them after account change', async () => {
    const storage = memoryStorage();
    const accountA = createConsignmentDraftStore(3004, storage);
    const accountB = createConsignmentDraftStore(3002, storage);
    await accountA.save(createConsignmentDraft(form(), { id: 'draft-a' }));

    expect((await accountA.list()).map(draft => draft.id)).toEqual(['draft-a']);
    expect(await accountB.list()).toEqual([]);
    expect(storage.values.has(consignmentDraftsStorageKey(3004))).toBe(true);
    expect(storage.values.has(consignmentDraftsStorageKey(3002))).toBe(false);
  });

  test('migrates legacy v1 drafts once to the authenticated account', async () => {
    const storage = memoryStorage();
    const legacy = createConsignmentDraft(form(), { id: 'legacy-draft' });
    storage.values.set(
      LEGACY_CONSIGNMENT_DRAFTS_STORAGE_KEY,
      serializeConsignmentDrafts([legacy]),
    );

    const accountA = createConsignmentDraftStore(3004, storage);
    expect((await accountA.list()).map(draft => draft.id)).toEqual([
      'legacy-draft',
    ]);
    expect(storage.values.has(LEGACY_CONSIGNMENT_DRAFTS_STORAGE_KEY)).toBe(
      false,
    );
    expect(await createConsignmentDraftStore(3002, storage).list()).toEqual([]);
  });

  test('manual retries preserve the same idempotency key', async () => {
    const store = createConsignmentDraftStore(3004, memoryStorage());
    const draft = createConsignmentDraft(form(), { id: 'stable-draft' });
    await store.save(draft);
    const submit = jest.fn(async () => ({ id: 42 }));

    await retryConsignmentDraft(store, draft.id, {
      online: true,
      connectionType: 'wifi',
      confirmHeavyAction: async () => true,
      canReadUri: async () => true,
      deletePrivateFile: async () => true,
      submit,
      readableError: () => 'Error',
    });

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: draft.idempotencyKey }),
    );
  });

  test('reorders, persists cover and uploads the cover first', () => {
    const second = {
      uri: 'file:///cache/second.jpg',
      name: 'second.jpg',
      type: 'image/jpeg',
    };
    const base = form();
    const reordered = moveConsignmentPhoto([...base.fotos, second], 1, 0);
    const withCover = { ...base, fotos: reordered, portadaUri: base.fotos[0].uri };
    const restored = deserializeConsignmentDrafts(
      serializeConsignmentDrafts([
        createConsignmentDraft(withCover, { id: 'photo-order' }),
      ]),
    )[0];

    expect(restored.form.fotos.map(photo => photo.uri)).toEqual([
      second.uri,
      base.fotos[0].uri,
    ]);
    expect(restored.form.portadaUri).toBe(base.fotos[0].uri);
    expect(photosForUpload(restored.form)[0].uri).toBe(base.fotos[0].uri);
    expect(removeConsignmentPhoto(restored.form, 1).portadaUri).toBeNull();
  });

  test('persists private photo metadata and keeps old v2 photos compatible', () => {
    const privateForm = form();
    privateForm.fotos[0] = {
      ...privateForm.fotos[0],
      uri: 'file:///data/user/0/quickbid/files/consignment_drafts/photo.jpg',
      originalUri: 'content://picker/photo',
      persistedLocal: true,
      sizeBytes: 2048,
    };
    const restored = deserializeConsignmentDrafts(
      serializeConsignmentDrafts([
        createConsignmentDraft(privateForm, { id: 'private-photo' }),
      ]),
    )[0];
    const old = deserializeConsignmentDrafts(
      JSON.stringify([createConsignmentDraft(form(), { id: 'old-v2' })]),
    )[0];

    expect(restored.form.fotos[0]).toMatchObject({
      persistedLocal: true,
      originalUri: 'content://picker/photo',
      sizeBytes: 2048,
    });
    expect(old.form.fotos[0].persistedLocal).toBe(false);
  });

  test('deletes only marked private files when a draft is removed', async () => {
    const store = createConsignmentDraftStore(3004, memoryStorage());
    const privateForm = form();
    privateForm.fotos = [
      { ...privateForm.fotos[0], persistedLocal: false },
      {
        uri: 'file:///private/photo.jpg',
        name: 'photo.jpg',
        type: 'image/jpeg',
        persistedLocal: true,
      },
    ];
    await store.save(
      createConsignmentDraft(privateForm, { id: 'draft-private-files' }),
    );
    const deletePrivateFile = jest.fn(async () => true);

    await removeConsignmentDraftAndFiles(
      store,
      'draft-private-files',
      deletePrivateFile,
    );

    expect(deletePrivateFile).toHaveBeenCalledWith('file:///private/photo.jpg');
    expect(deletePrivateFile).toHaveBeenCalledTimes(1);
    expect(await store.list()).toEqual([]);
  });
});
