import {
  ConsignacionArchivoDto,
  ConsignacionDevolucionDto,
  ConsignacionDetalleDto,
  ConsignacionEstadoBackend,
  ConsignacionLiquidacionDto,
  ConsignacionRequisitoDto,
  ConsignacionResumenDto,
} from '../types/consignacionApi';

export type ConsignacionTab = 'activas' | 'rechazadas' | 'vendidas';

export type ConsignacionBadgeTone =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

export type ConsignacionResumenUi = {
  id: string;
  numericId: number;
  titulo: string;
  estado: ConsignacionEstadoBackend;
  estadoLabel: string;
  badgeTone: ConsignacionBadgeTone;
  valorLabel: string;
  detalle: string;
  accionPendiente: string | null;
  fotoPrincipalArchivoId: number | null;
  updatedAtLabel: string;
};

export type ConsignacionRequisitoUi = ConsignacionRequisitoDto & {
  label: string;
  obligatorio: boolean;
};

export type ConsignacionEtapaUi = {
  id: string;
  label: string;
  estado: 'completada' | 'actual' | 'pendiente' | 'rechazada';
  detalle?: string;
};

export type ConsignacionArchivoUi = ConsignacionArchivoDto & {
  sizeLabel: string;
  estadoLabel: string;
};

export type ConsignacionDevolucionUi = ConsignacionDevolucionDto & {
  modalidadLabel: string;
  costoLabel: string;
  estadoLabel: string;
  comprobanteLabel: string | null;
};

export type ConsignacionLiquidacionUi = ConsignacionLiquidacionDto & {
  montoBrutoLabel: string;
  comisionLabel: string;
  montoNetoLabel: string;
  estadoLabel: string;
  paidAtLabel: string;
  comprobanteLabel: string;
};

export type ConsignacionDetalleUi = ConsignacionResumenUi & {
  descripcion: string;
  segmento: string;
  categoriaSubasta: string;
  categoriaSugerida: string;
  historia: string | null;
  artistaDisenador: string | null;
  fechaObjeto: string | null;
  requiereDocumentacionOrigen: boolean;
  motivoRechazo: string | null;
  productoId: number | null;
  itemCatalogoId: number | null;
  subastaId: number | null;
  valorBase: number | null;
  moneda: 'ARS' | 'USD';
  comisionCompradorPct: number | null;
  comisionVendedorPct: number | null;
  netoEstimado: number | null;
  acuerdoTexto: string | null;
  acuerdoEnviadoAtLabel: string | null;
  acuerdoAceptadoAtLabel: string | null;
  subastaFechaHoraLabel: string | null;
  ubicacionFisica: string | null;
  poliza: ConsignacionDetalleDto['poliza'];
  fotos: ConsignacionArchivoUi[];
  documentosOrigen: ConsignacionArchivoUi[];
  documentosGenerados: ConsignacionArchivoUi[];
  devolucion: ConsignacionDevolucionUi | null;
  liquidacion: ConsignacionLiquidacionUi | null;
  createdAtLabel: string;
  etapas: ConsignacionEtapaUi[];
  proximoPaso: string;
};

export function mapRequisito(
  dto: ConsignacionRequisitoDto,
): ConsignacionRequisitoUi {
  return {
    ...dto,
    label: requisitoLabel(dto.codigo),
    obligatorio: dto.codigo !== 'MEDIO_PAGO_APTO_PARA_ENVIO_DEVOLUCION',
  };
}

export function mapConsignacionResumen(
  dto: ConsignacionResumenDto,
): ConsignacionResumenUi {
  return {
    id: String(dto.id),
    numericId: dto.id,
    titulo: dto.titulo,
    estado: dto.estado,
    estadoLabel: estadoLabel(dto.estado),
    badgeTone: estadoTone(dto.estado),
    valorLabel:
      dto.valorBase && dto.moneda
        ? formatMoney(dto.valorBase, dto.moneda)
        : 'Sin valor base',
    detalle: dto.accionPendiente
      ? accionLabel(dto.accionPendiente)
      : `Actualizada ${formatDate(dto.updatedAt)}`,
    accionPendiente: dto.accionPendiente,
    fotoPrincipalArchivoId: dto.fotoPrincipalArchivoId,
    updatedAtLabel: formatDate(dto.updatedAt),
  };
}

export function mapConsignacionDetalle(
  dto: ConsignacionDetalleDto,
): ConsignacionDetalleUi {
  const base = mapConsignacionResumen({
    id: dto.id,
    titulo: dto.titulo,
    estado: dto.estado,
    valorBase: dto.valorBase,
    moneda: dto.moneda,
    accionPendiente: actionForState(dto.estado),
    fotoPrincipalArchivoId: dto.fotos[0]?.archivoId ?? null,
    updatedAt: dto.updatedAt,
  });
  return {
    ...base,
    descripcion: dto.descripcion,
    segmento: dto.segmento,
    categoriaSubasta: dto.categoriaSubasta,
    categoriaSugerida: dto.categoriaSugerida,
    historia: dto.historia,
    artistaDisenador: dto.artistaDisenador,
    fechaObjeto: dto.fechaObjeto,
    requiereDocumentacionOrigen: dto.requiereDocumentacionOrigen,
    motivoRechazo: dto.motivoRechazo,
    productoId: dto.productoId,
    itemCatalogoId: dto.itemCatalogoId,
    subastaId: dto.subastaId,
    valorBase: dto.valorBase,
    moneda: dto.moneda ?? 'ARS',
    comisionCompradorPct: dto.comisionCompradorPct,
    comisionVendedorPct: dto.comisionVendedorPct,
    netoEstimado: dto.netoEstimado,
    acuerdoTexto: dto.acuerdoTexto,
    acuerdoEnviadoAtLabel: dto.acuerdoEnviadoAt
      ? formatDateTime(dto.acuerdoEnviadoAt)
      : null,
    acuerdoAceptadoAtLabel: dto.acuerdoAceptadoAt
      ? formatDateTime(dto.acuerdoAceptadoAt)
      : null,
    subastaFechaHoraLabel: dto.subastaFechaHora
      ? formatDateTime(dto.subastaFechaHora)
      : null,
    ubicacionFisica: dto.ubicacionFisica,
    poliza: dto.poliza,
    fotos: dto.fotos.map(mapArchivo),
    documentosOrigen: dto.documentosOrigen.map(mapArchivo),
    documentosGenerados: dto.documentosGenerados.map(mapArchivo),
    devolucion: dto.devolucion ? mapDevolucion(dto.devolucion) : null,
    liquidacion: dto.liquidacion
      ? mapLiquidacion(dto.liquidacion, dto.moneda ?? 'ARS')
      : null,
    createdAtLabel: formatDate(dto.createdAt),
    etapas: buildEtapas(dto.estado, dto.motivoRechazo),
    proximoPaso: nextStep(dto.estado, dto.requiereDocumentacionOrigen),
  };
}

function mapArchivo(dto: ConsignacionArchivoDto): ConsignacionArchivoUi {
  return {
    ...dto,
    sizeLabel: formatBytes(dto.sizeBytes),
    estadoLabel: humanize(dto.estado),
  };
}

function mapDevolucion(
  dto: ConsignacionDevolucionDto,
): ConsignacionDevolucionUi {
  return {
    ...dto,
    modalidadLabel: dto.modalidad
      ? modalidadLabel(dto.modalidad)
      : 'Pendiente de seleccion',
    costoLabel: formatMoney(dto.costo, dto.moneda),
    estadoLabel: humanize(dto.estado),
    comprobanteLabel: dto.pagoId ? `Comprobante de envio #${dto.pagoId}` : null,
  };
}

function mapLiquidacion(
  dto: ConsignacionLiquidacionDto,
  moneda: 'ARS' | 'USD',
): ConsignacionLiquidacionUi {
  return {
    ...dto,
    montoBrutoLabel: formatMoney(dto.montoBruto, moneda),
    comisionLabel: formatMoney(dto.comision, moneda),
    montoNetoLabel: formatMoney(dto.montoNeto, moneda),
    estadoLabel: humanize(dto.estado),
    paidAtLabel: formatDate(dto.paidAt),
    comprobanteLabel: `Liquidacion #${dto.id}`,
  };
}

export function estadoLabel(estado: ConsignacionEstadoBackend) {
  const labels: Record<string, string> = {
    pendiente_revision: 'Pendiente de revision',
    rechazo_inicial: 'Rechazada',
    documentacion_adicional: 'Documentacion adicional',
    documentacion_recibida: 'Documentacion recibida',
    recepcion_pendiente: 'Recepcion pendiente',
    revision_fisica: 'Revision fisica',
    revision_fisica_aprobada: 'Revision fisica aprobada',
    rechazo_revision_fisica: 'Revision fisica rechazada',
    acuerdo_pendiente: 'Acuerdo pendiente',
    acuerdo_aceptado: 'Acuerdo aceptado',
    acuerdo_rechazado: 'Acuerdo rechazado',
    devolucion_pendiente: 'Devolucion pendiente',
    publicada: 'Publicada',
    en_subasta: 'En subasta',
    vendida: 'Vendida',
    comprada_por_empresa: 'Comprada por empresa',
    liquidada: 'Liquidada',
    devolucion_incompleta: 'Devolucion incompleta',
  };
  return labels[estado] ?? humanize(estado);
}

export function estadoTone(
  estado: ConsignacionEstadoBackend,
): ConsignacionBadgeTone {
  if (['vendida', 'liquidada', 'comprada_por_empresa'].includes(estado))
    return 'success';
  if (
    [
      'rechazo_inicial',
      'rechazo_revision_fisica',
      'acuerdo_rechazado',
      'devolucion_pendiente',
      'devolucion_incompleta',
    ].includes(estado)
  )
    return 'danger';
  if (['documentacion_adicional', 'acuerdo_pendiente'].includes(estado))
    return 'warning';
  if (['publicada', 'en_subasta', 'acuerdo_aceptado'].includes(estado))
    return 'primary';
  return 'info';
}

function buildEtapas(
  estado: ConsignacionEstadoBackend,
  motivo: string | null,
): ConsignacionEtapaUi[] {
  const order = [
    'validacion',
    'recepcion',
    'revision_fisica',
    'acuerdo',
    'subasta',
    'liquidacion',
  ];
  const labels = [
    'Validacion',
    'Recepcion',
    'Revision fisica',
    'Acuerdo',
    'En subasta',
    'Liquidacion',
  ];
  const currentIndex = progressIndex(estado);
  const rejectedIndex = rejectedStage(estado);

  return order.map((id, index) => {
    let etapaEstado: ConsignacionEtapaUi['estado'] = 'pendiente';
    if (rejectedIndex >= 0) {
      etapaEstado =
        index < rejectedIndex
          ? 'completada'
          : index === rejectedIndex
          ? 'rechazada'
          : 'pendiente';
    } else {
      etapaEstado =
        index < currentIndex
          ? 'completada'
          : index === currentIndex
          ? 'actual'
          : 'pendiente';
    }
    return {
      id,
      label: labels[index],
      estado: etapaEstado,
      detalle:
        etapaEstado === 'rechazada' ? motivo ?? estadoLabel(estado) : undefined,
    };
  });
}

function progressIndex(estado: ConsignacionEstadoBackend) {
  if (
    [
      'pendiente_revision',
      'documentacion_adicional',
      'documentacion_recibida',
    ].includes(estado)
  )
    return 0;
  if (estado === 'recepcion_pendiente') return 1;
  if (['revision_fisica', 'revision_fisica_aprobada'].includes(estado))
    return 2;
  if (['acuerdo_pendiente', 'acuerdo_aceptado'].includes(estado)) return 3;
  if (
    ['publicada', 'en_subasta', 'vendida', 'comprada_por_empresa'].includes(
      estado,
    )
  )
    return 4;
  if (estado === 'liquidada') return 6;
  return 0;
}

function rejectedStage(estado: ConsignacionEstadoBackend) {
  if (estado === 'rechazo_inicial') return 0;
  if (estado === 'rechazo_revision_fisica') return 2;
  if (
    [
      'acuerdo_rechazado',
      'devolucion_pendiente',
      'devolucion_incompleta',
    ].includes(estado)
  )
    return 3;
  return -1;
}

function nextStep(estado: ConsignacionEstadoBackend, requiresDocs: boolean) {
  if (estado === 'documentacion_adicional' || requiresDocs)
    return 'Adjunta documentacion de origen para continuar la revision.';
  if (estado === 'pendiente_revision')
    return 'QuickBid esta revisando la solicitud y las fotos.';
  if (estado === 'recepcion_pendiente')
    return 'Coordina la entrega fisica del bien con el equipo.';
  if (estado === 'revision_fisica')
    return 'El equipo esta verificando el estado fisico del bien.';
  if (estado === 'acuerdo_pendiente')
    return 'Hay un acuerdo disponible para aceptar o rechazar.';
  if (estado === 'acuerdo_aceptado')
    return 'El bien esta listo para asignarse a una subasta.';
  if (estado === 'publicada' || estado === 'en_subasta')
    return 'El bien ya esta publicado o en subasta.';
  if (estado === 'vendida' || estado === 'comprada_por_empresa')
    return 'La venta esta registrada. QuickBid emitira la liquidacion cuando corresponda.';
  if (estado === 'liquidada')
    return 'La liquidacion fue registrada por QuickBid.';
  if (estado === 'devolucion_pendiente')
    return 'Selecciona como queres recuperar el bien.';
  if (estado === 'devolucion_incompleta')
    return 'La devolucion quedo marcada como incompleta por vencimiento del plazo.';
  if (estado.includes('rechazo'))
    return 'La solicitud fue rechazada. Si corresponde, gestiona la devolucion.';
  return 'Seguimiento actualizado.';
}

function actionForState(estado: ConsignacionEstadoBackend) {
  if (estado === 'documentacion_adicional') return 'adjuntar_documentacion';
  if (estado === 'acuerdo_pendiente') return 'revisar_acuerdo';
  if (estado === 'devolucion_pendiente') return 'gestionar_devolucion';
  return null;
}

function accionLabel(action: string) {
  if (action === 'adjuntar_documentacion')
    return 'Documentacion adicional requerida';
  if (action === 'revisar_acuerdo') return 'Acuerdo pendiente';
  if (action === 'gestionar_devolucion') return 'Devolucion pendiente';
  return humanize(action);
}

function requisitoLabel(code: string) {
  if (code === 'MEDIO_PAGO_REGISTRADO') return 'Medio de pago registrado';
  if (code === 'CUENTA_COBRO_REGISTRADA') return 'Cuenta bancaria para cobro';
  if (code === 'MEDIO_PAGO_APTO_PARA_ENVIO_DEVOLUCION')
    return 'Medio apto para envio de devolucion';
  return humanize(code);
}

export function formatMoney(value: number, moneda: 'ARS' | 'USD') {
  const amount = Math.trunc(Math.abs(Number(value)))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${moneda} ${value < 0 ? '-' : ''}${amount}`;
}

function modalidadLabel(value: string) {
  if (value === 'retiro') return 'Retiro en sucursal';
  if (value === 'envio') return 'Envio a domicilio';
  return humanize(value);
}

function formatDate(iso: string | null | undefined) {
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

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${formatDate(iso)}, ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')} h`;
}

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return 'Sin tamano';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function humanize(value: string) {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w|\s\w/g, match => match.toUpperCase());
}
