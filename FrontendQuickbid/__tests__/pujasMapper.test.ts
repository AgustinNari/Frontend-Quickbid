import { applyPujaEvent, mapPujaActual } from '../src/mappers/pujas';
import {
  ItemDetalle,
  SubastaDetalle,
} from '../src/types/subasta';
import { PujaActual, PujaActualApi } from '../src/types/puja';

const subasta: SubastaDetalle = {
  id: '6011',
  titulo: 'Demo presentación multilote',
  estado: 'activa',
  categoria: 'plata',
  segmento: 'diseno',
  moneda: 'ARS',
  fechaInicio: '2026-06-28T20:00:00',
  ubicacion: 'Salón demo',
};

const item: ItemDetalle = {
  id: '9011',
  subastaId: '6011',
  lote: '#1',
  titulo: 'Lote demo',
  estado: 'en_vivo',
  precioBase: 50000,
  moneda: 'ARS',
  segmento: 'diseno',
};

function liveSnapshot(overrides: Partial<PujaActualApi> = {}): PujaActual {
  return mapPujaActual(
    {
      subastaId: 6011,
      itemActivoId: 9011,
      mejorOfertaActual: null,
      moneda: 'ARS',
      versionEstado: 1,
      puedePujar: true,
      motivo: null,
      precioBase: 50000,
      ...overrides,
    },
    subasta,
    item,
    [],
  );
}

describe('pujas mapper history', () => {
  test('restores persisted bid history after reopening the room', () => {
    const current = liveSnapshot({
      mejorOfertaActual: 50500,
      versionEstado: 4,
      puedePujar: false,
      historialReciente: [
        { pujaId: 12505, monto: 50500, versionEstado: 4, numeroPostor: 2, postorAlias: 'Postor #2', estado: 'aceptada' },
        { pujaId: 12504, monto: 50000, versionEstado: 3, numeroPostor: 1, postorAlias: 'Postor #1', estado: 'superada' },
      ],
    });
    expect(current.historialReciente.map(bid => bid.id)).toEqual(['puja-12505', 'puja-12504']);
    expect(current.historialReciente.map(bid => bid.ganadora)).toEqual([true, false]);
    expect(current.numeroPostorGanador).toBe(2);
    expect(current.postorGanadorAlias).toBe('Postor #2');
    const updated = applyPujaEvent(current, {
      tipo: 'MEJOR_OFERTA_ACTUALIZADA', pujaId: 12505, monto: 50500,
      versionEstado: 4, numeroPostor: 2,
    });
    expect(updated.historialReciente).toHaveLength(2);
    expect(updated.puedePujar).toBe(false);
  });

  test('deduplicates snapshot plus websocket event for the same bid', () => {
    const current = liveSnapshot({
      mejorOfertaActual: 50500,
      versionEstado: 2,
    });

    const updated = applyPujaEvent(current, {
      tipo: 'MEJOR_OFERTA_ACTUALIZADA',
      subastaId: 6011,
      itemCatalogoId: 9011,
      pujaId: 77,
      monto: 50500,
      moneda: 'ARS',
      secuencia: 2,
      versionEstado: 2,
      numeroPostor: 5,
      postorAlias: 'Postor #5',
    });

    expect(updated.historialReciente).toHaveLength(1);
    expect(updated.historialReciente[0]).toMatchObject({
      id: 'puja-77',
      postorAlias: 'Postor #5',
      monto: 50500,
      versionEstado: 2,
      ganadora: true,
    });
  });

  test('keeps one row when repeated websocket events describe the same offer', () => {
    const first = applyPujaEvent(liveSnapshot(), {
      tipo: 'MEJOR_OFERTA_ACTUALIZADA',
      subastaId: 6011,
      itemCatalogoId: 9011,
      pujaId: 88,
      monto: 51000,
      moneda: 'ARS',
      secuencia: 3,
      versionEstado: 3,
      numeroPostor: 7,
      postorAlias: 'Postor #7',
    });
    const accepted = applyPujaEvent(first, {
      tipo: 'PUJA_ACEPTADA',
      subastaId: 6011,
      itemCatalogoId: 9011,
      pujaId: 88,
      monto: 51000,
      moneda: 'ARS',
      secuencia: 3,
      versionEstado: 3,
      numeroPostor: 7,
      postorAlias: 'Postor #7',
    });
    const duplicated = applyPujaEvent(accepted, {
      tipo: 'PUJA_SUPERADA',
      subastaId: 6011,
      itemCatalogoId: 9011,
      pujaId: 88,
      monto: 51000,
      moneda: 'ARS',
      secuencia: 3,
      versionEstado: 3,
      numeroPostor: 7,
      postorAlias: 'Postor #7',
    });

    expect(duplicated.historialReciente).toHaveLength(1);
    expect(new Set(duplicated.historialReciente.map(row => row.id)).size).toBe(
      duplicated.historialReciente.length,
    );
    expect(duplicated.historialReciente[0].monto).toBe(51000);
  });
});
