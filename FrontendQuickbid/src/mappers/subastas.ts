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
  const auctioneer = rematador(dto);
  return {
    ...mapSubastaResumen(dto),
    descripcion: dto.descripcion ?? undefined,
    permiteInscripcionOnline: dto.permiteInscripcionOnline,
    rematador: auctioneer.nombre,
    rematadorMatricula: auctioneer.matricula,
    rematadorRegion: auctioneer.region,
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
    autor: text(dto.artistaDisenador),
    estado: itemEstado(
      dto.estadoLote ?? dto.estado,
      dto.activo,
      dto.subastado,
      dto.resultadoLote,
    ),
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
    duenioActual: text(dto.duenioActual),
    fechaObjeto: text(dto.fechaObjeto),
    historia: text(dto.historia),
    historiaExtendida: text(dto.historiaExtendida),
    artistaDisenador: text(dto.artistaDisenador),
    segmentoConsignacion: text(dto.segmentoConsignacion),
    categoriaAsignada: text(dto.categoriaAsignada),
    consignacionId: dto.consignacionId ?? undefined,
  };
}

export function mapItemDetalle(
  dto: ItemApi,
  subasta: SubastaDetalle,
): ItemDetalle {
  return {
    ...mapItemCatalogo(dto, subasta),
    descripcion: dto.descripcion ?? undefined,
    procedencia: text(dto.historia),
    fechaAproximada: text(dto.fechaObjeto),
  };
}

function itemEstado(
  value: string | null | undefined,
  activo?: boolean | null,
  subastado?: boolean | null,
  resultado?: string | null,
): ItemEstado {
  const normalized = (value ?? '').toLowerCase() as ItemEstado;
  if (ITEM_ESTADOS.includes(normalized)) return normalized;
  if (activo) return 'en_vivo';
  if (!subastado) return 'pendiente';
  if (resultado === 'comprado_por_empresa') return 'comprado_por_empresa';
  if (resultado === 'adjudicado') return 'vendido';
  if (subastado) return 'no_vendido';
  return 'sin_estado';
}

function rematador(dto: SubastaApiDetalle) {
  if (typeof dto.rematador === 'string') {
    return { nombre: text(dto.rematador), matricula: undefined, region: undefined };
  }
  return {
    nombre: text(dto.rematador?.nombre ?? dto.rematadorNombre),
    matricula: text(dto.rematador?.matricula ?? dto.rematadorMatricula),
    region: text(dto.rematador?.region ?? dto.rematadorRegion),
  };
}

function text(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
