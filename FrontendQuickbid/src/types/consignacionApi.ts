export type ConsignacionFiltro =
  | 'activas'
  | 'rechazadas'
  | 'vendidas'
  | 'todas';

export type ConsignacionEstadoBackend =
  | 'pendiente_revision'
  | 'rechazo_inicial'
  | 'documentacion_adicional'
  | 'documentacion_recibida'
  | 'recepcion_pendiente'
  | 'revision_fisica'
  | 'revision_fisica_aprobada'
  | 'rechazo_revision_fisica'
  | 'acuerdo_pendiente'
  | 'acuerdo_aceptado'
  | 'acuerdo_rechazado'
  | 'devolucion_pendiente'
  | 'publicada'
  | 'en_subasta'
  | 'vendida'
  | 'comprada_por_empresa'
  | 'liquidada'
  | 'devolucion_incompleta'
  | string;

export type ConsignacionRequisitoDto = {
  codigo: string;
  descripcion: string;
  cumplido: boolean;
};

export type ConsignacionRequisitosDto = {
  puedeContinuar: boolean;
  requisitos: ConsignacionRequisitoDto[];
  minimoFotos: number;
};

export type ConsignacionResumenDto = {
  id: number;
  titulo: string;
  estado: ConsignacionEstadoBackend;
  valorBase: number | null;
  moneda: 'ARS' | 'USD' | null;
  accionPendiente: string | null;
  fotoPrincipalArchivoId: number | null;
  updatedAt: string;
};

export type ConsignacionArchivoDto = {
  archivoId: number;
  filename: string;
  contentType: string;
  sizeBytes: number;
  estado: string;
  downloadAvailable: boolean;
  downloadUrl: string | null;
};

export type ConsignacionPolizaDto = {
  numero: string;
  compania: string;
  combinada: boolean;
  importe: number;
  ubicacionFisica: string | null;
};

export type ConsignacionDevolucionDto = {
  id: number;
  modalidad: string | null;
  costo: number;
  moneda: 'ARS' | 'USD';
  estado: string;
  pagoId: number | null;
  direccionEnvioId: number | null;
  direccionResumen: string | null;
};

export type ConsignacionDevolucionPreviewDto = {
  modalidad: 'retiro' | 'envio';
  direccionEnvioId: number | null;
  costo: number;
  moneda: 'ARS' | 'USD';
  totalEstimado: number;
  direccionResumen: string | null;
};

export type ConsignacionPagoDevolucionDto = {
  id: number;
  devolucionId: number;
  medioPagoId: number;
  monto: number;
  moneda: 'ARS' | 'USD';
  estado: string;
  idempotentReplay: boolean;
};

export type ConsignacionLiquidacionDto = {
  id: number;
  compraId: number;
  montoBruto: number;
  comision: number;
  montoNeto: number;
  cuentaDestino: string;
  estado: string;
  paidAt: string | null;
};

export type ConsignacionDetalleDto = {
  id: number;
  titulo: string;
  descripcion: string;
  segmento: string;
  categoriaSubasta: string;
  categoriaSugerida: string;
  historia: string | null;
  artistaDisenador: string | null;
  fechaObjeto: string | null;
  estado: ConsignacionEstadoBackend;
  requiereDocumentacionOrigen: boolean;
  motivoRechazo: string | null;
  productoId: number | null;
  itemCatalogoId: number | null;
  subastaId: number | null;
  valorBase: number | null;
  moneda: 'ARS' | 'USD' | null;
  comisionCompradorPct: number | null;
  comisionVendedorPct: number | null;
  netoEstimado: number | null;
  acuerdoTexto: string | null;
  ubicacionFisica: string | null;
  poliza: ConsignacionPolizaDto | null;
  fotos: ConsignacionArchivoDto[];
  documentosOrigen: ConsignacionArchivoDto[];
  documentosGenerados: ConsignacionArchivoDto[];
  devolucion: ConsignacionDevolucionDto | null;
  liquidacion: ConsignacionLiquidacionDto | null;
  createdAt: string;
  updatedAt: string;
};

export type ConsignacionPageDto<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type ConsignacionFileInput = {
  uri: string;
  name: string;
  type: string;
  sizeBytes?: number;
  persistedLocal?: boolean;
  originalUri?: string;
};

export type CrearConsignacionRequest = {
  segmento: string;
  aceptaTyC: boolean;
  declaracionPropiedadYOrigenLicito: boolean;
  titulo: string;
  descripcion: string;
  historia?: string;
  fechaAproximada?: string;
  esObraDeArte?: boolean;
  autor?: string;
  historiaExtendida?: string;
  idempotencyKey?: string;
  fotos: ConsignacionFileInput[];
};

export type SubirDocumentacionOrigenRequest = {
  facturaCompra?: ConsignacionFileInput;
  certificadoAutenticidad?: ConsignacionFileInput;
  observaciones?: string;
};

export type AceptarAcuerdoRequest = {
  leyoContrato: boolean;
  aceptaClausulasPlazos: boolean;
};

export type SeleccionarDevolucionRequest = {
  modalidad: 'retiro' | 'envio';
  direccionEnvioId?: number;
  direccion?: string;
  piso?: string;
  codigoPostal?: string;
  localidad?: string;
  provincia?: string;
  telefonoContacto?: string;
};

export type PagarEnvioDevolucionRequest = {
  medioPagoId: number;
  idempotencyKey: string;
};
