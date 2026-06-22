import {
  CompraDetalleDto,
  CompraEstadoBackend,
  CompraEntregaDto,
  CompraMultaDto,
  CompraResumenDto,
  DocumentoCompraDto,
  PagoCompraDto,
} from '../types/compraApi';

export type TipoPagoCompra = 'multa' | 'comisiones';

export type CompraAction =
  | 'pagar_multa'
  | 'pagar_extras'
  | 'ver_documentos'
  | null;

export type BadgeTone = {
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  variant: 'solid' | 'soft';
};

export type CompraResumenUi = {
  id: string;
  numericId: number;
  subastaId: number;
  itemCatalogoId: number;
  productoId: number;
  title: string;
  subtitle: string;
  loteLabel: string;
  moneda: 'ARS' | 'USD';
  montoAdjudicacion: number;
  estado: CompraEstadoBackend;
  estadoLabel: string;
  badge: BadgeTone;
  action: CompraAction;
  actionLabel: string;
  createdAt: string;
  fechaLabel: string;
};

export type CompraDetalleUi = CompraResumenUi & {
  pujaId: number | null;
  medioPagoId: number | null;
  entrega: CompraEntregaDto | null;
  multa: CompraMultaDto | null;
  comisionComprador: number;
  comisionVendedor: number;
  totalExtras: number;
  totalConMulta: number;
  entregaLabel: string;
  entregaDescription: string;
  direccionSnapshotLabel: string | null;
};

export type DocumentoCompraUi = DocumentoCompraDto & {
  tipoLabel: string;
  estadoLabel: string;
  fechaLabel: string;
  sizeLabel: string;
};

export type PagoCompraUi = PagoCompraDto & {
  aprobado: boolean;
  rechazado: boolean;
  estadoLabel: string;
  errorLabel: string | null;
};

export function mapCompraResumen(dto: CompraResumenDto): CompraResumenUi {
  const estado = estadoMeta(dto.estado);
  return {
    id: String(dto.id),
    numericId: dto.id,
    subastaId: dto.subastaId,
    itemCatalogoId: dto.itemCatalogoId,
    productoId: dto.productoId,
    title: `Compra #${dto.id}`,
    subtitle: `Subasta #${dto.subastaId} · Producto #${dto.productoId}`,
    loteLabel: `Lote #${dto.itemCatalogoId}`,
    moneda: dto.moneda,
    montoAdjudicacion: Number(dto.montoAdjudicacion ?? 0),
    estado: dto.estado,
    estadoLabel: estado.label,
    badge: estado.badge,
    action: estado.action,
    actionLabel: estado.actionLabel,
    createdAt: dto.createdAt,
    fechaLabel: formatFecha(dto.createdAt),
  };
}

export function mapCompraDetalle(dto: CompraDetalleDto): CompraDetalleUi {
  const base = mapCompraResumen(dto);
  const costoEnvio = Number(dto.entrega?.costoEnvio ?? 0);
  const comisionComprador = Number(dto.comisionComprador ?? 0);
  const multaMonto = Number(dto.multa?.monto ?? 0);
  return {
    ...base,
    pujaId: dto.pujaId,
    medioPagoId: dto.medioPagoId,
    entrega: dto.entrega,
    multa: dto.multa,
    comisionComprador,
    comisionVendedor: Number(dto.comisionVendedor ?? 0),
    totalExtras: comisionComprador + costoEnvio,
    totalConMulta: base.montoAdjudicacion + multaMonto,
    entregaLabel: entregaLabel(dto.entrega),
    entregaDescription: entregaDescription(dto.entrega),
    direccionSnapshotLabel: dto.entrega?.direccionSnapshotJson
      ? parseDireccionSnapshot(dto.entrega.direccionSnapshotJson)
      : null,
  };
}

export function mapDocumentoCompra(dto: DocumentoCompraDto): DocumentoCompraUi {
  return {
    ...dto,
    tipoLabel: tipoDocumentoLabel(dto.tipo),
    estadoLabel: humanize(dto.estado),
    fechaLabel: formatFecha(dto.createdAt),
    sizeLabel: formatBytes(dto.sizeBytes),
  };
}

export function mapPagoCompra(dto: PagoCompraDto): PagoCompraUi {
  const estado = dto.estado?.toLowerCase() ?? '';
  return {
    ...dto,
    aprobado: estado === 'aprobado',
    rechazado: estado === 'rechazado',
    estadoLabel: humanize(dto.estado),
    errorLabel: dto.errorCodigo ? humanize(dto.errorCodigo) : null,
  };
}

export function tipoPagoForCompra(
  compra: Pick<CompraResumenUi, 'action'>,
): TipoPagoCompra | null {
  if (compra.action === 'pagar_multa') return 'multa';
  if (compra.action === 'pagar_extras') return 'comisiones';
  return null;
}

export function totalParaPago(
  compra: CompraDetalleUi,
  tipo: TipoPagoCompra,
): number {
  return tipo === 'multa' ? compra.totalConMulta : compra.totalExtras;
}

export function isEntregaEditable(estado: CompraEstadoBackend) {
  return estado === 'pagos_extra_pendientes';
}

function estadoMeta(estado: CompraEstadoBackend): {
  label: string;
  badge: BadgeTone;
  action: CompraAction;
  actionLabel: string;
} {
  switch (estado) {
    case 'multa_activa':
      return {
        label: 'Con multa',
        badge: { tone: 'danger', variant: 'solid' },
        action: 'pagar_multa',
        actionLabel: 'Pagar multa',
      };
    case 'pagos_extra_pendientes':
      return {
        label: 'Pago pendiente',
        badge: { tone: 'warning', variant: 'solid' },
        action: 'pagar_extras',
        actionLabel: 'Completar pago',
      };
    case 'pagada':
      return {
        label: 'Pagada',
        badge: { tone: 'success', variant: 'soft' },
        action: 'ver_documentos',
        actionLabel: 'Ver documentos',
      };
    case 'entrega_pendiente':
      return {
        label: 'Entrega pendiente',
        badge: { tone: 'info', variant: 'soft' },
        action: 'ver_documentos',
        actionLabel: 'Ver documentos',
      };
    case 'retiro_pendiente':
      return {
        label: 'Retiro pendiente',
        badge: { tone: 'info', variant: 'soft' },
        action: 'ver_documentos',
        actionLabel: 'Ver documentos',
      };
    case 'completada':
      return {
        label: 'Completada',
        badge: { tone: 'success', variant: 'soft' },
        action: 'ver_documentos',
        actionLabel: 'Ver documentos',
      };
    case 'adjudicacion_pendiente':
      return {
        label: 'Adjudicación pendiente',
        badge: { tone: 'warning', variant: 'soft' },
        action: null,
        actionLabel: 'Ver detalle',
      };
    case 'abandonada_por_incumplimiento_pago':
    case 'abandonada_por_incumplimiento_retiro':
      return {
        label: 'Abandonada',
        badge: { tone: 'danger', variant: 'soft' },
        action: null,
        actionLabel: 'Ver detalle',
      };
    default:
      return {
        label: humanize(estado),
        badge: { tone: 'neutral', variant: 'soft' },
        action: null,
        actionLabel: 'Ver detalle',
      };
  }
}

function entregaLabel(entrega: CompraEntregaDto | null) {
  if (!entrega) return 'Entrega sin configurar';
  return entrega.tipo === 'envio' ? 'Envío a domicilio' : 'Retiro en sede';
}

function entregaDescription(entrega: CompraEntregaDto | null) {
  if (!entrega)
    return 'Elegí retiro o envío antes de pagar comisiones y extras.';
  if (entrega.tipo === 'envio') {
    const estado = humanize(entrega.estado);
    return `Costo de envío incluido: ${estado}. La dirección se congela al pagar extras.`;
  }
  return entrega.perdioCoberturaSeguro
    ? 'Retiro seleccionado. La cobertura de seguro termina al retirar.'
    : 'Retiro seleccionado sin costo de envío.';
}

function parseDireccionSnapshot(raw: string): string | null {
  try {
    const json = JSON.parse(raw) as {
      calle?: string;
      numero?: string;
      piso?: string | null;
      localidad?: string;
      provincia?: string;
      pais?: string;
    };
    const calle = [json.calle, json.numero, json.piso]
      .filter(Boolean)
      .join(' ');
    const zona = [json.localidad, json.provincia, json.pais]
      .filter(Boolean)
      .join(', ');
    return [calle, zona].filter(Boolean).join(' · ') || null;
  } catch {
    return null;
  }
}

function tipoDocumentoLabel(tipo: string) {
  if (tipo === 'factura_compra') return 'Factura / comprobante de compra';
  if (tipo === 'recibo_multa') return 'Recibo de artículo + multa';
  return humanize(tipo);
}

function formatFecha(iso: string | null | undefined) {
  if (!iso) return 'Sin fecha';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const meses = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return 'Sin tamaño';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function humanize(value: string | null | undefined) {
  if (!value) return 'Sin estado';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w|\s\w/g, match => match.toUpperCase());
}
