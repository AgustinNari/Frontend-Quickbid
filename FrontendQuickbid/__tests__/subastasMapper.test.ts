import { mapItemDetalle, mapSubastaDetalle } from '../src/mappers/subastas';
import { ItemApi, SubastaApiDetalle } from '../src/types/subastaApi';

const subastaDto: SubastaApiDetalle = {
  id: 6011,
  titulo: 'Subasta en vivo QuickBid',
  descripcion: 'Catalogo multi-lote',
  fecha: '2026-06-28',
  hora: '20:00:00',
  ubicacion: 'Sala principal QuickBid',
  categoria: 'plata',
  moneda: 'ARS',
  segmento: 'diseno',
  estadoOperativo: 'en_vivo',
  rematador: {
    nombre: 'Martillero QuickBid',
    matricula: 'MAT-QB-001',
    region: 'Buenos Aires',
  },
};

describe('subastas mapper', () => {
  test('mapea rematador completo desde el detalle de subasta', () => {
    expect(mapSubastaDetalle(subastaDto)).toMatchObject({
      rematador: 'Martillero QuickBid',
      rematadorMatricula: 'MAT-QB-001',
      rematadorRegion: 'Buenos Aires',
    });
  });

  test('mapea datos relevantes del lote consignado', () => {
    const itemDto: ItemApi = {
      id: 9011,
      productoId: 8011,
      descripcion: 'Sillon escandinavo de roble',
      fotoIds: [],
      estado: 'pendiente',
      duenioActual: 'Propietario registrado',
      fechaObjeto: '1968',
      historia: 'Pieza de procedencia particular.',
      historiaExtendida: 'Restaurada con terminacion al aceite.',
      artistaDisenador: 'Disenador escandinavo',
      segmentoConsignacion: 'mobiliario',
      categoriaAsignada: 'plata',
      consignacionId: 16111,
    };

    expect(mapItemDetalle(itemDto, mapSubastaDetalle(subastaDto))).toMatchObject({
      autor: 'Disenador escandinavo',
      duenioActual: 'Propietario registrado',
      fechaObjeto: '1968',
      historia: 'Pieza de procedencia particular.',
      historiaExtendida: 'Restaurada con terminacion al aceite.',
      artistaDisenador: 'Disenador escandinavo',
      segmentoConsignacion: 'mobiliario',
      categoriaAsignada: 'plata',
      consignacionId: 16111,
    });
  });

  test('omite campos vacios sin romper el detalle del lote', () => {
    const item = mapItemDetalle(
      {
        id: 9001,
        productoId: 8001,
        descripcion: 'Lote sin extras',
        fotoIds: [],
      },
      mapSubastaDetalle(subastaDto),
    );

    expect(item.historia).toBeUndefined();
    expect(item.historiaExtendida).toBeUndefined();
    expect(item.consignacionId).toBeUndefined();
  });
});
