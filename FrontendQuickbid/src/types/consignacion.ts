/**
 * Tipos del dominio rico de Consignaciones (flujo del vendedor).
 *
 * El listado simple lo dejo Nico en `src/mocks/consignaciones.ts`. Este modulo
 * agrega el dominio completo para el alta, el detalle con timeline y el
 * acuerdo, fiel al frame image5 y a los EXTRAS (§2, §12, §13, §21.4).
 *
 * Contrato (Endpoints.docx):
 *  - `GET  /api/consignaciones/requisitos`              -> RequisitoConsignacion[]
 *  - `POST /api/consignaciones`                          -> ResultadoConsignacion (alta)
 *  - `GET  /api/consignaciones/{id}`                     -> ConsignacionDetalle
 *  - `POST /api/consignaciones/{id}/acuerdo/aceptar`     -> ResultadoConsignacion
 *  - `POST /api/consignaciones/{id}/acuerdo/rechazar`    -> ResultadoConsignacion (-> devolucion)
 */

import { SubastaMoneda, SubastaSegmento } from './subasta';

/**
 * Estado general de la consignacion (EXTRAS 12, simplificado para el frontend).
 *
 * Recorrido feliz: en_validacion -> revision_fisica -> acuerdo_pendiente ->
 * acuerdo_aceptado -> en_subasta -> vendida -> liquidada. Si la empresa o el
 * usuario rechazan en algun punto: rechazada / devolucion_pendiente.
 */
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

/** Estado de cada etapa del timeline visible en el detalle. */
export type EtapaEstado = 'completada' | 'actual' | 'pendiente' | 'rechazada';

/** Una etapa del workflow (Validacion, Verificacion fisica, Acuerdo, En subasta, Liquidacion). */
export type EtapaConsignacion = {
  id: string;
  label: string;
  estado: EtapaEstado;
  /** Texto auxiliar opcional (fecha, motivo, etc.). */
  detalle?: string;
};

/**
 * Acuerdo de consignacion que propone la empresa (EXTRAS 22.3: dos comisiones).
 * La comision del vendedor es el % del valor final que retiene la empresa.
 */
export type AcuerdoConsignacion = {
  precioBase: number;
  /** % que retiene la empresa al vendedor (default 10). */
  comisionVendedor: number;
  /** % que paga el comprador (default 10). Informativo para el vendedor. */
  comisionComprador: number;
  /** Estimado que recibiria el vendedor (precioBase - comision vendedor). */
  estimadoVendedor: number;
  /** Vigencia de la propuesta (legible). */
  vigencia?: string;
};

/** Requisito para poder consignar (`GET /api/consignaciones/requisitos`). */
export type RequisitoConsignacion = {
  id: string;
  label: string;
  descripcion: string;
  cumplido: boolean;
  /** Si es obligatorio, bloquea el alta cuando no se cumple. */
  obligatorio: boolean;
};

/**
 * Datos del bien que carga el usuario en el alta (`POST /api/consignaciones`).
 * El precio base NO lo pone el usuario: lo propone la empresa en el acuerdo.
 */
export type DatosBien = {
  titulo: string;
  categoria: SubastaSegmento;
  descripcion: string;
  /** Año o referencia (ej. "1978"). */
  anio?: string;
  /** Cantidad de fotos cargadas (mock). Minimo 6 (Consignas FAQ 11.6). */
  cantidadFotos: number;
};

/**
 * Detalle completo de una consignacion (`GET /api/consignaciones/{id}`).
 */
export type ConsignacionDetalle = {
  id: string;
  /** Codigo legible (ej. "#CONS-2026-00847"). */
  codigo: string;
  nombre: string;
  segmento: SubastaSegmento;
  moneda: SubastaMoneda;
  /** Precio base fijado en el acuerdo. 0 si todavia no hay acuerdo. */
  precioBase: number;
  /** Monto estimado a recibir el vendedor. */
  montoEstimado?: number;
  estado: EstadoConsignacion;
  /** Las 5 etapas del workflow con su estado individual. */
  etapas: EtapaConsignacion[];
  /** Presente cuando hay un acuerdo propuesto / aceptado. */
  acuerdo?: AcuerdoConsignacion;
  /** Motivo cuando la consignacion fue rechazada. */
  motivoRechazo?: string;
  /** Fecha de alta (legible). */
  fecha: string;
};

/** Codigos de error de los endpoints de consignacion (del contrato). */
export type ConsignacionError = {
  codigo: 400 | 403 | 404 | 409 | 422;
  tipo: string;
  mensaje: string;
};

/**
 * Resultado de un POST de consignacion (alta / aceptar / rechazar acuerdo).
 * Union discriminado por `ok` — mismo patron que `ResultadoInscripcion`.
 */
export type ResultadoConsignacion =
  | {
      ok: true;
      id: string;
      /** Codigo asignado en el alta. */
      codigo?: string;
      /** Estado al que paso la consignacion. */
      nuevoEstado?: EstadoConsignacion;
    }
  | { ok: false; error: ConsignacionError };

// ── Mapeos de presentacion ───────────────────────────────────────────────────

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

/** Minimo de fotos para consignar (Consignas FAQ 11.6). */
export const MIN_FOTOS_CONSIGNACION = 6;
/** Maximo de fotos (Consignas FAQ 11.6). */
export const MAX_FOTOS_CONSIGNACION = 20;
