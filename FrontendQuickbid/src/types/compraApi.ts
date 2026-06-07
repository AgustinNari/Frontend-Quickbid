export type CompraEstadoBackend =
  | 'adjudicacion_pendiente'
  | 'multa_activa'
  | 'pagos_extra_pendientes'
  | 'pagada'
  | 'entrega_pendiente'
  | 'retiro_pendiente'
  | 'abandonada_por_incumplimiento_pago'
  | 'abandonada_por_incumplimiento_retiro'
  | 'completada'
  | string;

export type EntregaTipo = 'envio' | 'retiro';

export type EntregaEstadoBackend = 'pendiente' | 'pagada' | 'completada' | string;

export type MultaEstadoBackend = 'pendiente' | 'pagada' | 'vencida' | string;

export type PagoEstadoBackend = 'aprobado' | 'rechazado' | 'pendiente' | string;

export type DocumentoEstadoBackend = 'disponible' | 'generado' | 'pendiente' | string;

export type CompraResumenDto = {
  id: number;
  subastaId: number;
  itemCatalogoId: number;
  productoId: number;
  montoAdjudicacion: number;
  moneda: 'ARS' | 'USD';
  estado: CompraEstadoBackend;
  createdAt: string;
};

export type CompraEntregaDto = {
  id: number;
  tipo: EntregaTipo;
  direccionEnvioId: number | null;
  costoEnvio: number;
  estado: EntregaEstadoBackend;
  perdioCoberturaSeguro: boolean;
  direccionSnapshotJson: string | null;
  direccionSnapshotAt: string | null;
};

export type CompraMultaDto = {
  id: number;
  monto: number;
  moneda: 'ARS' | 'USD';
  estado: MultaEstadoBackend;
  venceAt: string | null;
  paidAt: string | null;
};

export type CompraDetalleDto = CompraResumenDto & {
  pujaId: number | null;
  medioPagoId: number | null;
  entrega: CompraEntregaDto | null;
  multa: CompraMultaDto | null;
  comisionComprador: number;
  comisionVendedor: number;
};

export type PagoCompraRequest = {
  medioPagoId: number;
  idempotencyKey: string;
};

export type ConfigurarEntregaRequest =
  | { tipo: 'retiro'; direccionEnvioId?: undefined }
  | { tipo: 'envio'; direccionEnvioId: number };

export type PagoCompraDto = {
  id: number;
  compraId: number;
  multaId: number | null;
  medioPagoId: number;
  monto: number;
  moneda: 'ARS' | 'USD';
  estado: PagoEstadoBackend;
  errorCodigo: string | null;
  compraEstado: CompraEstadoBackend;
  idempotentReplay: boolean;
};

export type DocumentoCompraDto = {
  id: number;
  tipo: string;
  estado: DocumentoEstadoBackend;
  archivoId: number | null;
  filename: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
};

export type PageDto<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
