export type SubastaApiResumen = {
  id: number;
  titulo: string;
  descripcion: string | null;
  imagenPrincipalUrl?: string | null;
  fecha: string;
  hora: string;
  ubicacion: string;
  categoria: string;
  moneda: string;
  segmento: string;
  estadoOperativo: string;
};

export type SubastaRematadorApi = {
  nombre?: string | null;
  matricula?: string | null;
  region?: string | null;
};

export type SubastaApiDetalle = SubastaApiResumen & {
  permiteInscripcionOnline?: boolean;
  autenticado?: boolean;
  rematador?: SubastaRematadorApi | string | null;
  rematadorNombre?: string | null;
  rematadorMatricula?: string | null;
  rematadorRegion?: string | null;
};

export type MedioPagoInscripcionApi = {
  id: number;
  tipo: string;
  moneda: 'ARS' | 'USD';
  estado: string;
  principal: boolean;
  aliasVisible: string;
  ultimos4: string | null;
  verificacionVigente: boolean;
  requiereRevalidacion: boolean;
};

export type VerificacionSubastaApi = {
  puedeVerDetalleCompleto: boolean;
  puedeInscribirse: boolean;
  puedePujar: boolean;
  requiereLogin: boolean;
  requiereMedioPagoParaInscripcion: boolean;
  requiereMedioPagoVerificadoParaPujar: boolean;
  requiereRevalidacionMedioPagoParaPujar: boolean;
  categoriaInsuficienteParaInscripcion: boolean;
  categoriaInsuficienteParaPujar: boolean;
  monedaIncompatibleParaInscripcion: boolean;
  monedaIncompatibleParaPujar: boolean;
  cuentaRestringida: boolean;
  cuentaBloqueada: boolean;
  yaInscripto: boolean;
  inscripcionCerradaPorTiempo: boolean;
  subastaYaIniciada: boolean;
  subastaNoIniciadaParaPuja: boolean;
  sinLoteActivo: boolean;
  conectadoOParticipandoEnOtraSubasta: boolean;
  mediosPagoCompatiblesParaInscripcion: MedioPagoInscripcionApi[];
  mediosPagoVerificadosVigentesCompatiblesParaPuja: MedioPagoInscripcionApi[];
  mediosPagoRevalidablesParaInscripcion: MedioPagoInscripcionApi[];
};

export type InscripcionSubastaApi = {
  id: number;
  subastaId: number;
  medioPagoId: number;
  estado: 'pendiente_validacion' | 'aprobada' | 'rechazada' | string;
  existente: boolean;
  requiereRevisionMedioPago: boolean;
  createdAt: string;
};

export type ItemApi = {
  id: number;
  productoId: number;
  descripcion: string | null;
  fotoIds: number[];
  fotoUrls?: string[];
  imagenPrincipalUrl?: string | null;
  precioBase?: number;
  comision?: number;
  ordenLote?: number | null;
  estadoLote?: string | null;
  estado?: string | null;
  activo?: boolean | null;
  subastado?: boolean | null;
  resultadoLote?: string | null;
  compraId?: number | null;
  compradorEmpresa?: boolean | null;
  duenioActual?: string | null;
  fechaObjeto?: string | null;
  historia?: string | null;
  historiaExtendida?: string | null;
  artistaDisenador?: string | null;
  segmentoConsignacion?: string | null;
  categoriaAsignada?: string | null;
  consignacionId?: number | null;
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
