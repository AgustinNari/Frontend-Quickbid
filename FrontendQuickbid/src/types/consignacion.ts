
import { SubastaMoneda, SubastaSegmento } from './subasta';

export type EstadoConsignacion =
  | 'en_validacion'
  | 'recepcion_pendiente'
  | 'revision_fisica'
  | 'acuerdo_pendiente'
  | 'acuerdo_aceptado'
  | 'en_subasta'
  | 'vendida'
  | 'liquidada'
  | 'rechazada'
  | 'devolucion_pendiente';

export type EtapaEstado = 'completada' | 'actual' | 'pendiente' | 'rechazada';

export type EtapaConsignacion = {
  id: string;
  label: string;
  estado: EtapaEstado;
  detalle?: string;
};

export type AcuerdoConsignacion = {
  precioBase: number;
  comisionVendedor: number;
  comisionComprador: number;
  estimadoVendedor: number;
  vigencia?: string;
};

export type RequisitoConsignacion = {
  id: string;
  label: string;
  descripcion: string;
  cumplido: boolean;
  obligatorio: boolean;
};

export type DatosBien = {
  titulo: string;
  categoria: SubastaSegmento;
  descripcion: string;
  anio?: string;
  cantidadFotos: number;
};

export type ConsignacionDetalle = {
  id: string;
  codigo: string;
  nombre: string;
  segmento: SubastaSegmento;
  moneda: SubastaMoneda;
  precioBase: number;
  montoEstimado?: number;
  estado: EstadoConsignacion;
  etapas: EtapaConsignacion[];
  acuerdo?: AcuerdoConsignacion;
  motivoRechazo?: string;
  fecha: string;
};

export type ConsignacionError = {
  codigo: 400 | 403 | 404 | 409 | 422;
  tipo: string;
  mensaje: string;
};

export type ResultadoConsignacion =
  | {
      ok: true;
      id: string;
      codigo?: string;
      nuevoEstado?: EstadoConsignacion;
    }
  | { ok: false; error: ConsignacionError };

export const ESTADO_CONSIGNACION_LABEL: Record<EstadoConsignacion, string> = {
  en_validacion: 'En validación',
  recepcion_pendiente: 'Recepción pendiente',
  revision_fisica: 'En revisión física',
  acuerdo_pendiente: 'Acuerdo pendiente',
  acuerdo_aceptado: 'Acuerdo aceptado',
  en_subasta: 'En subasta',
  vendida: 'Vendida',
  liquidada: 'Liquidada',
  rechazada: 'Rechazada',
  devolucion_pendiente: 'Devolución pendiente',
};

export const MIN_FOTOS_CONSIGNACION = 6;
export const MAX_FOTOS_CONSIGNACION = 20;
