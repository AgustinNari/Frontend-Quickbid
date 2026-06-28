import { ConsignacionArchivoDto } from '../types/consignacionApi';

export type ConsignmentDocumentType =
  | 'acuerdo_consignacion'
  | 'poliza_consignacion'
  | 'poliza_seguro'
  | 'liquidacion_venta'
  | 'comprobante_envio_devolucion';

type DocumentLike = Pick<
  ConsignacionArchivoDto,
  'filename' | 'tipo' | 'documentType'
>;

type DetailLike<TDocument extends DocumentLike> = {
  documentosGenerados?: TDocument[] | null;
};

const TYPE_ALIASES: Record<ConsignmentDocumentType, string[]> = {
  acuerdo_consignacion: ['acuerdo_consignacion'],
  poliza_consignacion: ['poliza_consignacion', 'poliza_seguro'],
  poliza_seguro: ['poliza_seguro', 'poliza_consignacion'],
  liquidacion_venta: ['liquidacion_venta'],
  comprobante_envio_devolucion: ['comprobante_envio_devolucion'],
};

export function findGeneratedDocument<TDocument extends DocumentLike>(
  detalle: DetailLike<TDocument> | null | undefined,
  type: ConsignmentDocumentType,
): TDocument | null {
  const documents = detalle?.documentosGenerados ?? [];
  const aliases = TYPE_ALIASES[type];
  const byType = documents.find(document => {
    const logicalType = normalize(document.tipo ?? document.documentType);
    return logicalType ? aliases.includes(logicalType) : false;
  });
  if (byType) return byType;

  return (
    documents.find(document =>
      matchesFilenameFallback(normalize(document.filename), aliases),
    ) ?? null
  );
}

function matchesFilenameFallback(filename: string | null, aliases: string[]) {
  if (!filename) return false;
  return aliases.some(alias => {
    if (filename.startsWith(alias)) return true;
    if (alias.startsWith('poliza_')) return filename.startsWith('poliza');
    if (alias === 'liquidacion_venta') return filename.includes('liquidacion');
    return false;
  });
}

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}
