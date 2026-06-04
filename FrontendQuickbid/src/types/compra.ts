/**
 * Tipos del dominio de Mis Compras (tab COMPRAS del BottomNavBar).
 *
 * Refleja el contrato de `Material/Endpoints.docx`:
 *  - `GET  /api/compras`                       -> `Compra[]`
 *  - `GET  /api/compras/{id}`                  -> `CompraDetalle`
 *  - `POST /api/compras/{id}/pagar`            -> `ResultadoPagoCompra` (comisiones + envio)
 *  - `POST /api/compras/{id}/pagar-con-multa`  -> `ResultadoPagoCompra` (articulo + multa)
 *  - `GET  /api/compras/{id}/documentos`       -> factura / recibo de multa
 *
 * Reglas de negocio (Consignas + EXTRAS 11): la multa es 10% del valor
 * ofertado y se paga junto con el articulo en un solo checkout; las comisiones
 * y el envio se pagan despues, por separado; no hay devolucion de la compra.
 *
 * Cuando exista backend, estos tipos validan la respuesta real. Hoy los
 * consume el mock `src/mocks/compras.ts`.
 */

import { SubastaMoneda, SubastaSegmento } from './subasta';

/**
 * Estado de una compra en su ciclo de vida (EXTRAS 11, simplificado para el
 * frontend).
 *
 * - `multa_pendiente`: el cobro inmediato del valor ofertado fallo, se genero
 *   una multa automatica. El usuario debe pagar articulo + multa en un unico
 *   checkout (`pagar-con-multa`) dentro de las 72 hs o se bloquea la cuenta.
 * - `pago_pendiente`: el articulo ya quedo cobrado; falta pagar comisiones +
 *   envio (`pagar`) para concretar la entrega.
 * - `pagada`: todos los pagos hechos; el bien esta en camino o a retirar.
 * - `completada`: el comprador ya tiene el bien en su poder.
 */
export type CompraEstado =
  | 'multa_pendiente'
  | 'pago_pendiente'
  | 'pagada'
  | 'completada';

/** Modalidad de entrega del bien adjudicado (Consignas 9.17). */
export type ModalidadEntrega = 'retiro' | 'envio';

/** Item adjudicado dentro de una compra. */
export type CompraItem = {
  id: string;
  /** Numero de lote tal como se muestra (ej. "#4829"). */
  lote: string;
  titulo: string;
  autor?: string;
  /** Segmento heredado del item — usado para el placeholder visual. */
  segmento: SubastaSegmento;
};

/**
 * Datos de la multa generada cuando fallo el cobro inmediato.
 * El monto es el 10% del valor ofertado (Consignas 9.6).
 */
export type MultaInfo = {
  /** Numero de multa (ej. "MUL-2026-00847"). */
  numero: string;
  /** Porcentaje aplicado sobre el valor ofertado (10 por defecto). */
  porcentaje: number;
  /** Monto de la multa en la moneda de la compra. */
  monto: number;
  /** Fecha limite de pago (legible). 72 hs desde la adjudicacion. */
  vencimiento: string;
  /** Motivo de la infraccion (ej. "Pago fuera de termino"). */
  motivo: string;
  /** True si la multa ya fue abonada (para el recibo). */
  pagada?: boolean;
};

/**
 * Vista de compra para el listado (`GET /api/compras`).
 *
 * Incluye lo necesario para la card del listado y el desglose economico del
 * checkout. Segun el estado, aplican distintos montos pendientes:
 *  - `multa_pendiente` -> `montoAdjudicado` + `multa.monto`.
 *  - `pago_pendiente`  -> `comision` + `envio`.
 */
export type Compra = {
  id: string;
  item: CompraItem;
  subastaTitulo: string;
  moneda: SubastaMoneda;
  /** Valor ofertado ganador (snapshot al adjudicar). */
  montoAdjudicado: number;
  estado: CompraEstado;
  /** Fecha de adjudicacion (legible, ej. "17 abr 2026"). */
  fecha: string;
  /** Presente cuando hubo excepcion de cobro (estado multa_pendiente / pagada con multa). */
  multa?: MultaInfo;
  /** Comision del comprador (10% del valor ofertado por defecto, EXTRAS 22.3). */
  comision?: number;
  /** Costo de envio cuando la modalidad es envio (Consignas 9.18). */
  envio?: number;
  /** Modalidad de entrega elegida (si ya se eligio). */
  modalidadEntrega?: ModalidadEntrega;
};

/**
 * Detalle completo de una compra (`GET /api/compras/{id}`).
 *
 * Por ahora comparte shape con `Compra`; se separa como tipo propio para poder
 * crecer (direccion de envio, referencias a documentos) sin tocar el listado.
 */
export type CompraDetalle = Compra & {
  /** Sinopsis corta del item / subasta para el detalle. */
  descripcion?: string;
  /** Numero de factura cuando ya esta pagada (`GET /documentos`). */
  numeroFactura?: string;
};

/** Tipo de checkout, para que `ResumenPagoScreen` muestre el desglose correcto. */
export type TipoPago = 'multa' | 'comisiones';

/**
 * Error tipado de los endpoints de pago.
 * `pagar`: 400, 403, 409, 422. `pagar-con-multa`: 400, 403, 404, 422.
 */
export type CompraPagoError = {
  codigo: 400 | 403 | 404 | 409 | 422;
  /** Identificador del error (ej. "FONDOS_INSUFICIENTES", "PLAZO_VENCIDO"). */
  tipo: string;
  mensaje: string;
};

/**
 * Resultado de `POST /pagar` o `POST /pagar-con-multa`.
 * Union discriminado por `ok` — mismo patron que `ResultadoInscripcion`.
 */
export type ResultadoPagoCompra =
  | {
      ok: true;
      compraId: string;
      /** Estado al que paso la compra tras el pago. */
      nuevoEstado: CompraEstado;
      /** Numero del documento generado (factura o recibo). */
      documento?: string;
    }
  | { ok: false; error: CompraPagoError };

// ── Mapeos de presentacion ───────────────────────────────────────────────────

/** Tab del listado de compras. `todas` no filtra. */
export type CompraTab = 'todas' | 'pendientes' | 'pagadas';

export const COMPRA_ESTADO_LABEL: Record<CompraEstado, string> = {
  multa_pendiente: 'Con multa',
  pago_pendiente: 'Pago pendiente',
  pagada: 'Pagada',
  completada: 'Completada',
};
