import {
  ItemCatalogo,
  ItemEstado,
  ItemDetalle,
  SubastaCategoria,
  SubastaDetalle,
  SubastaMoneda,
  SubastaResumen,
  SubastaSegmento,
} from '../types/subasta';
import {
  ItemApi,
  SubastaApiDetalle,
  SubastaApiResumen,
} from '../types/subastaApi';
import { resolveApiMediaUrl } from '../utils/apiMedia';

const CATEGORIAS: SubastaCategoria[] = [
  'comun',
  'especial',
  'plata',
  'oro',
  'platino',
];
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
const ITEM_ESTADOS: ItemEstado[] = [
  'pendiente',
  'en_vivo',
  'vendido',
  'no_vendido',
  'comprado_por_empresa',
  'sin_estado',
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
  if (value === 'abierta') return 'proxima';
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

export function mapItemCatalogo(
  dto: ItemApi,
  subasta: SubastaDetalle,
): ItemCatalogo {
  const descripcion = dto.descripcion?.trim();
  const fotoUrls = dto.fotoUrls ?? [];
  const imagen = resolveApiMediaUrl(dto.imagenPrincipalUrl ?? fotoUrls[0]);
  const order = dto.ordenLote ?? undefined;
  return {
    id: String(dto.id),
    subastaId: subasta.id,
    lote: order != null ? `#${order}` : `#${dto.id}`,
    titulo: descripcion || `Lote #${dto.id}`,
    estado: itemEstado(dto.estadoLote ?? dto.estado),
    precioBase: dto.precioBase,
    moneda: subasta.moneda,
    segmento: subasta.segmento,
    fotoIds: dto.fotoIds,
    fotoUrls,
    imagen,
    ordenLote: order,
    activo: dto.activo ?? undefined,
    subastado: dto.subastado ?? undefined,
    resultadoLote: dto.resultadoLote ?? undefined,
    compraId: dto.compraId ?? null,
    compradorEmpresa: dto.compradorEmpresa ?? null,
  };
}

export function mapItemDetalle(
  dto: ItemApi,
  subasta: SubastaDetalle,
): ItemDetalle {
  return {
    ...mapItemCatalogo(dto, subasta),
    descripcion: dto.descripcion ?? undefined,
  };
}

function itemEstado(value: string | null | undefined): ItemEstado {
  const normalized = (value ?? '').toLowerCase() as ItemEstado;
  return ITEM_ESTADOS.includes(normalized) ? normalized : 'sin_estado';
}
