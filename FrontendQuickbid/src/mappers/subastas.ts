import {
  ItemCatalogo,
  ItemDetalle,
  SubastaCategoria,
  SubastaDetalle,
  SubastaMoneda,
  SubastaResumen,
  SubastaSegmento,
} from '../types/subasta';
import { ItemApi, SubastaApiDetalle, SubastaApiResumen } from '../types/subastaApi';

const CATEGORIAS: SubastaCategoria[] = ['comun', 'especial', 'plata', 'oro', 'platino'];
const SEGMENTOS: SubastaSegmento[] = [
  'arte',
  'joyas',
  'vehiculos',
  'relojeria',
  'antiguedades',
  'diseno',
  'coleccion',
  'otro',
];

function categoria(value: string): SubastaCategoria {
  const normalized = value.toLowerCase() as SubastaCategoria;
  return CATEGORIAS.includes(normalized) ? normalized : 'comun';
}

function segmento(value: string): SubastaSegmento {
  const normalized = value.toLowerCase() as SubastaSegmento;
  return SEGMENTOS.includes(normalized) ? normalized : 'otro';
}

function moneda(value: string): SubastaMoneda {
  return value.toUpperCase() === 'USD' ? 'USD' : 'ARS';
}

function fechaInicio(dto: SubastaApiResumen) {
  return `${dto.fecha}T${dto.hora}`;
}

function estado(value: string): SubastaResumen['estado'] {
  if (value === 'programada') return 'proxima';
  if (value === 'abierta') return 'abierta';
  if (value === 'en_vivo') return 'activa';
  if (value === 'cerrada' || value === 'finalizada') return 'finalizada';
  return 'proxima';
}

export function mapSubastaResumen(dto: SubastaApiResumen): SubastaResumen {
  return {
    id: String(dto.id),
    titulo: dto.titulo,
    estado: estado(dto.estadoOperativo),
    categoria: categoria(dto.categoria),
    segmento: segmento(dto.segmento),
    moneda: moneda(dto.moneda),
    fechaInicio: fechaInicio(dto),
    ubicacion: dto.ubicacion,
  };
}

export function mapSubastaDetalle(dto: SubastaApiDetalle): SubastaDetalle {
  return {
    ...mapSubastaResumen(dto),
    descripcion: dto.descripcion ?? undefined,
    permiteInscripcionOnline: dto.permiteInscripcionOnline,
  };
}

export function mapItemCatalogo(dto: ItemApi, subasta: SubastaDetalle): ItemCatalogo {
  const descripcion = dto.descripcion?.trim();
  return {
    id: String(dto.id),
    subastaId: subasta.id,
    lote: `#${dto.id}`,
    titulo: descripcion || `Lote #${dto.id}`,
    estado: 'sin_estado',
    precioBase: dto.precioBase,
    moneda: subasta.moneda,
    segmento: subasta.segmento,
    fotoIds: dto.fotoIds,
  };
}

export function mapItemDetalle(dto: ItemApi, subasta: SubastaDetalle): ItemDetalle {
  return {
    ...mapItemCatalogo(dto, subasta),
    descripcion: dto.descripcion ?? undefined,
  };
}
