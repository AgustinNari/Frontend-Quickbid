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
