import {
  Compra,
  CompraDetalle,
  CompraEstado,
  CompraPagoError,
  CompraTab,
  ResultadoPagoCompra,
  TipoPago,
} from '../types/compra';
import { SubastaMoneda } from '../types/subasta';
import { getMedioPagoById } from './mediosPago';

/**
 * Mock de Mis Compras para desarrollo / demo sin backend.
 *
 * Replica el comportamiento de:
 *  - `GET  /api/compras`                      -> `getMockCompras`
 *  - `GET  /api/compras/{id}`                 -> `getMockCompra`
 *  - `POST /api/compras/{id}/pagar`           -> `pagar`           (comisiones + envio)
 *  - `POST /api/compras/{id}/pagar-con-multa` -> `pagarConMulta`   (articulo + multa)
 *
 * Las compras cubren los tres estados que necesita la demo: una ganada en la
 * puja en vivo (#14) que ya tiene el articulo cobrado y le falta comisiones +
 * envio, una con multa automatica por excepcion de cobro (numeros del frame
 * de Figma) y una ya pagada.
 *
 * El estado mutable vive en `_estadoOverride` (module-scope) y se reinicia con
 * cada reload — esta bien para demo. Cuando exista backend, esto se reemplaza
 * por las mutaciones reales.
 */

/** Comision del comprador: 10% del valor ofertado por defecto (EXTRAS 22.3). */
export const COMISION_COMPRADOR = 0.1;
/** Multa: 10% del valor ofertado (Consignas 9.6). */
export const MULTA_PORCENTAJE = 10;

const MOCK_COMPRAS: Compra[] = [
  // 1. Ganada en la puja en vivo (#14): el articulo ya quedo cobrado, falta
  //    pagar comisiones + envio para concretar la entrega.
  {
    id: 'c_001',
    item: {
      id: 'lot_902',
      lote: '#002',
      titulo: 'Cromática N°7',
      autor: 'Valentina Ríos',
      segmento: 'arte',
    },
    subastaTitulo: 'Subasta de Arte Moderno',
    moneda: 'USD',
    montoAdjudicado: 14640,
    estado: 'pago_pendiente',
    fecha: '27 may 2026',
    comision: 1464, // 10% de 14640
    envio: 180,
  },
  // 2. Excepcion de cobro -> multa automatica. Numeros tomados del frame de
  //    Figma (oferta 14.500 + multa 1.450 = 15.950).
  {
    id: 'c_002',
    item: {
      id: 'lot_pk',
      lote: '#4829',
      titulo: 'Patek Philippe Calatrava 1950',
      autor: 'Patek Philippe · Oro 18k',
      segmento: 'relojeria',
    },
    subastaTitulo: 'Subasta de Alta Relojería',
    moneda: 'USD',
    montoAdjudicado: 14500,
    estado: 'multa_pendiente',
    fecha: '17 abr 2026',
    multa: {
      numero: 'MUL-2026-00847',
      porcentaje: MULTA_PORCENTAJE,
      monto: 1450, // 10% de 14500
      vencimiento: '30 abr 2026',
      motivo: 'Pago fuera de término',
    },
  },
  // 3. Compra ya pagada y completada — habilita "Ver factura".
  {
    id: 'c_003',
    item: {
      id: 'lot_ab',
      lote: '#012',
      titulo: 'Abstracción Geométrica III',
      autor: 'Mauro Lombardi',
      segmento: 'arte',
    },
    subastaTitulo: 'Colección Privada Borges',
    moneda: 'ARS',
    montoAdjudicado: 850000,
    estado: 'completada',
    fecha: '2 abr 2026',
    comision: 85000,
    envio: 0,
    modalidadEntrega: 'retiro',
  },
];

/** Descripciones largas por compra (para el detalle). */
const DESCRIPCIONES: Record<string, string> = {
  c_001:
    'Óleo y acrílico sobre lienzo de gran formato, pieza central de la serie "Cromática". Adjudicado en la jornada de Arte Moderno.',
  c_002:
    'Reloj Patek Philippe Calatrava de 1950 en oro 18k. Autenticidad verificada con certificado de la maison.',
  c_003:
    'Obra geométrica de la colección privada Borges. Retirada en sede tras el pago.',
};

/** Numeros de factura por compra (cuando ya esta pagada). */
const FACTURAS: Record<string, string> = {
  c_001: '0001-00004560',
  c_002: '0001-00004561',
  c_003: '0001-00004562',
};

/**
 * Estado mutable de runtime. Cuando el usuario paga, la compra cambia de estado
 * aca (no se toca el array base). Se reinicia con cada reload.
 */
const _estadoOverride: Record<string, CompraEstado> = {};

function estadoActual(compra: Compra): CompraEstado {
  return _estadoOverride[compra.id] ?? compra.estado;
}

/**
 * Listado de compras, filtrable por tab (`GET /api/compras`).
 *
 * - `pendientes`: con multa o con pago pendiente.
 * - `pagadas`: ya pagadas o completadas.
 */
export function getMockCompras(tab: CompraTab = 'todas'): Compra[] {
  const lista = MOCK_COMPRAS.map((c) => ({ ...c, estado: estadoActual(c) }));
  if (tab === 'pendientes') {
    return lista.filter(
      (c) => c.estado === 'multa_pendiente' || c.estado === 'pago_pendiente',
    );
  }
  if (tab === 'pagadas') {
    return lista.filter(
      (c) => c.estado === 'pagada' || c.estado === 'completada',
    );
  }
  return lista;
}

/**
 * Detalle de una compra (`GET /api/compras/{id}`). Devuelve `null` si no existe
 * (el backend responde 404).
 */
export function getMockCompra(id: string): CompraDetalle | null {
  const base = MOCK_COMPRAS.find((c) => c.id === id);
  if (!base) return null;
  const estado = estadoActual(base);
  const yaPagada = estado === 'pagada' || estado === 'completada';
  return {
    ...base,
    estado,
    descripcion: DESCRIPCIONES[id],
    numeroFactura: yaPagada ? FACTURAS[id] : undefined,
  };
}

/**
 * Tipo de checkout que aplica segun el estado de la compra:
 *  - `multa`      -> hay que pagar articulo + multa (`pagar-con-multa`).
 *  - `comisiones` -> hay que pagar comisiones + envio (`pagar`).
 *  - `null`       -> no hay nada pendiente de pago.
 */
export function getTipoPago(estado: CompraEstado): TipoPago | null {
  if (estado === 'multa_pendiente') return 'multa';
  if (estado === 'pago_pendiente') return 'comisiones';
  return null;
}

/** Total a pagar en el checkout segun el tipo. */
export function getTotalPago(compra: Compra, tipo: TipoPago): number {
  if (tipo === 'multa') {
    return compra.montoAdjudicado + (compra.multa?.monto ?? 0);
  }
  return (compra.comision ?? 0) + (compra.envio ?? 0);
}

function validarMedio(
  idMedioPago: string,
  moneda: SubastaMoneda,
): CompraPagoError | null {
  const medio = getMedioPagoById(idMedioPago);
  if (!medio || medio.estado !== 'activo' || medio.moneda !== moneda) {
    return {
      codigo: 422,
      tipo: 'MEDIO_NO_VALIDO',
      mensaje:
        'El medio de pago no está verificado o no corresponde a la moneda de la compra.',
    };
  }
  return null;
}

/**
 * Paga comisiones + envio de una compra (`POST /api/compras/{id}/pagar`).
 * Codigos del contrato: 403, 409, 422 (+400 datos).
 */
export function pagar(
  compraId: string,
  idMedioPago: string,
): ResultadoPagoCompra {
  const compra = MOCK_COMPRAS.find((c) => c.id === compraId);
  if (!compra) {
    return {
      ok: false,
      error: {
        codigo: 403,
        tipo: 'COMPRA_NO_DISPONIBLE',
        mensaje: 'No podés pagar esta compra.',
      },
    };
  }
  if (estadoActual(compra) !== 'pago_pendiente') {
    return {
      ok: false,
      error: {
        codigo: 409,
        tipo: 'ESTADO_INVALIDO',
        mensaje: 'Esta compra no tiene un pago de comisiones pendiente.',
      },
    };
  }
  const errMedio = validarMedio(idMedioPago, compra.moneda);
  if (errMedio) return { ok: false, error: errMedio };

  _estadoOverride[compraId] = 'pagada';
  return {
    ok: true,
    compraId,
    nuevoEstado: 'pagada',
    documento: FACTURAS[compraId],
  };
}

/**
 * Paga articulo + multa en un solo checkout
 * (`POST /api/compras/{id}/pagar-con-multa`).
 * Codigos del contrato: 400, 403, 404, 422.
 */
export function pagarConMulta(
  compraId: string,
  idMedioPago: string,
): ResultadoPagoCompra {
  const compra = MOCK_COMPRAS.find((c) => c.id === compraId);
  if (!compra) {
    return {
      ok: false,
      error: {
        codigo: 404,
        tipo: 'COMPRA_NO_ENCONTRADA',
        mensaje: 'No encontramos la compra.',
      },
    };
  }
  if (estadoActual(compra) !== 'multa_pendiente') {
    return {
      ok: false,
      error: {
        codigo: 400,
        tipo: 'SIN_MULTA_PENDIENTE',
        mensaje: 'Esta compra no tiene una multa pendiente de pago.',
      },
    };
  }
  const errMedio = validarMedio(idMedioPago, compra.moneda);
  if (errMedio) return { ok: false, error: errMedio };

  if (compra.multa) compra.multa.pagada = true;
  _estadoOverride[compraId] = 'pagada';
  return {
    ok: true,
    compraId,
    nuevoEstado: 'pagada',
    documento: compra.multa?.numero,
  };
}
