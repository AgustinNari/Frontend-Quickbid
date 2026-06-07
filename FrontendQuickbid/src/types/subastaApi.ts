export type SubastaApiResumen = {
  id: number;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  hora: string;
  ubicacion: string;
  categoria: string;
  moneda: string;
  segmento: string;
  estadoOperativo: string;
};

export type SubastaApiDetalle = SubastaApiResumen & {
  permiteInscripcionOnline?: boolean;
  autenticado?: boolean;
};

export type ItemApi = {
  id: number;
  productoId: number;
  descripcion: string | null;
  fotoIds: number[];
  precioBase?: number;
  comision?: number;
};

export type CatalogoApi = {
  subastaId: number;
  catalogoId: number;
  descripcion: string | null;
  items: ItemApi[];
};

export type PageApi<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type SubastaListParams = {
  estado?: string;
  categoria?: string;
  moneda?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  q?: string;
  page?: number;
  size?: number;
};
