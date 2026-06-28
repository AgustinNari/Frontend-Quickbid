export type SubastaEstado = 'activa' | 'proxima' | 'finalizada';

export type SubastaCategoria =
  | 'comun'
  | 'especial'
  | 'plata'
  | 'oro'
  | 'platino';

export type SubastaSegmento =
  | 'arte'
  | 'joyas'
  | 'vehiculos'
  | 'relojeria'
  | 'antiguedades'
  | 'diseno'
  | 'coleccion'
  | 'otro';

export type SubastaMoneda = 'ARS' | 'USD';

export type SubastaModalidad = 'virtual' | 'presencial' | 'mixta';

export type ItemEstado =
  | 'pendiente'
  | 'en_vivo'
  | 'vendido'
  | 'no_vendido'
  | 'sin_estado';

export type SubastaResumen = {
  id: string;
  titulo: string;
  imagen?: string;
  estado: SubastaEstado;
  categoria: SubastaCategoria;
  segmento: SubastaSegmento;
  moneda: SubastaMoneda;
  fechaInicio: string;
  ubicacion: string;
  rematador?: string;
  cantidadItems?: number;
};

export type SubastaDetalle = SubastaResumen & {
  subtitulo?: string;
  descripcion?: string;
  modalidad?: SubastaModalidad;
  zonaHoraria?: string;
  inscripto?: boolean;
  permiteInscripcionOnline?: boolean;
};

export type ItemCatalogo = {
  id: string;
  subastaId: string;
  lote: string;
  titulo: string;
  autor?: string;
  estado: ItemEstado;
  precioBase?: number;
  moneda: SubastaMoneda;
  imagen?: string;
  segmento: SubastaSegmento;
  fotoIds?: number[];
  fotoUrls?: string[];
};

export type ItemDetalle = ItemCatalogo & {
  descripcion?: string;
  procedencia?: string;
  dimensiones?: string;
  condicion?: string;
  cantidadPujas?: number;
  fechaAproximada?: string;
};

export type SubastaFiltros = {
  estado?: SubastaEstado;
  segmento?: SubastaSegmento;
  categoria?: SubastaCategoria;
  moneda?: SubastaMoneda;
  query?: string;
};

export const SEGMENTO_LABEL: Record<SubastaSegmento, string> = {
  arte: 'Arte',
  joyas: 'Joyas',
  vehiculos: 'Vehículos',
  relojeria: 'Relojería',
  antiguedades: 'Antigüedades',
  diseno: 'Diseño',
  coleccion: 'Colección',
  otro: 'Otro',
};

export const CATEGORIA_LABEL: Record<SubastaCategoria, string> = {
  comun: 'Común',
  especial: 'Especial',
  plata: 'Plata',
  oro: 'Oro',
  platino: 'Platino',
};

export const ESTADO_LABEL: Record<SubastaEstado, string> = {
  activa: 'EN VIVO',
  proxima: 'PRÓXIMA',
  finalizada: 'FINALIZADA',
};

export const MODALIDAD_LABEL: Record<SubastaModalidad, string> = {
  virtual: 'Virtual',
  presencial: 'Presencial',
  mixta: 'Virtual y presencial',
};

export const ITEM_ESTADO_LABEL: Record<ItemEstado, string> = {
  pendiente: 'PRÓXIMO',
  en_vivo: 'EN VIVO',
  vendido: 'VENDIDO',
  no_vendido: 'NO VENDIDO',
  sin_estado: 'LOTE',
};
