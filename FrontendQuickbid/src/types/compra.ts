
import { SubastaMoneda, SubastaSegmento } from './subasta';

export type CompraEstado =
  | 'multa_pendiente'
  | 'pago_pendiente'
  | 'pagada'
  | 'completada';

export type ModalidadEntrega = 'retiro' | 'envio';

export type CompraItem = {
  id: string;
  lote: string;
  titulo: string;
  autor?: string;
  segmento: SubastaSegmento;
};

export type MultaInfo = {
  numero: string;
  porcentaje: number;
  monto: number;
  vencimiento: string;
  motivo: string;
  pagada?: boolean;
};

export type Compra = {
  id: string;
  item: CompraItem;
  subastaTitulo: string;
  moneda: SubastaMoneda;
  montoAdjudicado: number;
  estado: CompraEstado;
  fecha: string;
  multa?: MultaInfo;
  comision?: number;
  envio?: number;
  modalidadEntrega?: ModalidadEntrega;
};

export type CompraDetalle = Compra & {
  descripcion?: string;
  numeroFactura?: string;
};

export type TipoPago = 'multa' | 'comisiones';

export type CompraPagoError = {
  codigo: 400 | 403 | 404 | 409 | 422;
  tipo: string;
  mensaje: string;
};

export type ResultadoPagoCompra =
  | {
      ok: true;
      compraId: string;
      nuevoEstado: CompraEstado;
      documento?: string;
    }
  | { ok: false; error: CompraPagoError };

export type CompraTab = 'todas' | 'pendientes' | 'pagadas';

export const COMPRA_ESTADO_LABEL: Record<CompraEstado, string> = {
  multa_pendiente: 'Con multa',
  pago_pendiente: 'Pago pendiente',
  pagada: 'Pagada',
  completada: 'Completada',
};
