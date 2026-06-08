import { ItemDetalle, SubastaCategoria } from '../types/subasta';
import {
  LimitesPuja,
  PujaActual,
  PujaHistorial,
  ResultadoPuja,
} from '../types/puja';
import { CATEGORIA_ORDER } from '../types/usuario';
import { MOCK_USUARIO_ACTUAL } from './usuarioActual';
import { getMedioPagoById } from './mediosPago';
import { getMockCatalogo, getMockDetalle, getMockItemDetalle } from './subastas';

/**
 * Mock de la puja en vivo (tarea #14).
 *
 * Replica el comportamiento de:
 *  - `GET  /api/subastas/{id}/puja-actual` -> `getPujaActual()`
 *  - `POST /api/subastas/{id}/pujar`        -> `pujar()`
 *
 * El "WebSocket" se simula en la pantalla con un contador. Acá vive solo el
 * estado de cada sala (mejor oferta, postor ganador, historial) y la logica de
 * validacion de una puja, con los codigos HTTP exactos del contrato.
 *
 * El estado es module-scope y se reinicia con cada reload — esta bien para
 * demo. Cuando exista backend, esto se reemplaza por la conexion real.
 */

/** Retencion de la puja ganadora antes de adjudicar (consigna: 60s). */
export const RETENCION_SEGUNDOS = 60;

/**
 * Estado mutable de una sala de subasta (un item en vivo). Se crea la primera
 * vez que alguien consulta o puja en esa subasta.
 */
type SalaState = {
  precioBase: number;
  mejorOferta: number;
  numeroPostorGanador: number;
  /** True si la mejor oferta vigente es del usuario actual. */
  esGanadorActual: boolean;
  historial: PujaHistorial[];
  /** Numero de postor del usuario en esta subasta. Se asigna en su 1ra puja. */
  numeroPostorUsuario: number | null;
  /** True si el item ya fue adjudicado. */
  cerrado: boolean;
};

const _salas: Record<string, SalaState> = {};

/** Busca el item `en_vivo` del catalogo de una subasta. `null` si no hay. */
function findItemEnVivo(subastaId: string): ItemDetalle | null {
  const enVivo = getMockCatalogo(subastaId).find((i) => i.estado === 'en_vivo');
  if (!enVivo) return null;
  return getMockItemDetalle(enVivo.id);
}

/**
 * Inicializa la sala con una oferta de apertura scripteada, como si ya hubiera
 * habido un par de rondas de pujas de otros postores anonimos.
 */
function initSala(item: ItemDetalle): SalaState {
  const precioBase = item.precioBase ?? 0;
  const ofertaGanadora = precioBase + Math.round(precioBase * 0.21);
  const ofertaPrevia = precioBase + Math.round(precioBase * 0.18);
  const ofertaInicial = precioBase + Math.round(precioBase * 0.1);
  return {
    precioBase,
    mejorOferta: ofertaGanadora,
    numeroPostorGanador: 482,
    esGanadorActual: false,
    numeroPostorUsuario: null,
    cerrado: false,
    historial: [
      { id: 'h_1', numeroPostor: 482, postorAlias: 'Postor #482', monto: ofertaGanadora, haceMinutos: 1, ganadora: true },
      { id: 'h_2', numeroPostor: 201, postorAlias: 'Postor #201', monto: ofertaPrevia, haceMinutos: 2 },
      { id: 'h_3', numeroPostor: 137, postorAlias: 'Postor #137', monto: ofertaInicial, haceMinutos: 4 },
    ],
  };
}

function getSala(subastaId: string, item: ItemDetalle): SalaState {
  if (!_salas[subastaId]) _salas[subastaId] = initSala(item);
  return _salas[subastaId];
}

/**
 * Calcula los limites de la proxima puja (Consignas + EXTRAS 10):
 *  - `minimo` = mejor oferta + 1% del precio base.
 *  - `maximo` = mejor oferta + 20% del precio base.
 *  - oro / platino: sin maximo, minimo = superar la mejor oferta por 1 unidad.
 *  - primera puja (sin ofertas): puede igualar el precio base.
 */
export function calcularLimites(
  mejorOferta: number | null,
  precioBase: number,
  categoria: SubastaCategoria,
): LimitesPuja {
  const sinLimiteSuperior = categoria === 'oro' || categoria === 'platino';

  if (mejorOferta == null) {
    return {
      minimo: precioBase,
      maximo: sinLimiteSuperior ? null : Math.round(precioBase * 1.2),
      sinLimiteSuperior,
    };
  }

  if (sinLimiteSuperior) {
    return { minimo: mejorOferta + 1, maximo: null, sinLimiteSuperior };
  }

  return {
    minimo: mejorOferta + Math.max(1, Math.round(precioBase * 0.01)),
    maximo: mejorOferta + Math.round(precioBase * 0.2),
    sinLimiteSuperior,
  };
}

/** Incremento sugerido para el stepper del monto (1% del precio base). */
export function getIncrementoPuja(precioBase: number): number {
  return Math.max(1, Math.round(precioBase * 0.01));
}

/**
 * Estado vivo de la sala — equivalente a `GET /api/subastas/{id}/puja-actual`.
 *
 * Devuelve `null` cuando la subasta no existe o no tiene un item activo (el
 * backend responde 404 "Subasta finalizada o sin ítem activo"). La pantalla lo
 * traduce a un empty state.
 */
export function getPujaActual(subastaId: string): PujaActual | null {
  const subasta = getMockDetalle(subastaId);
  if (!subasta) return null;

  const item = findItemEnVivo(subastaId);
  if (!item) return null;

  const sala = getSala(subastaId, item);
  if (sala.cerrado) return null;

  return {
    subastaId,
    subastaTitulo: subasta.titulo,
    item,
    moneda: subasta.moneda,
    categoria: subasta.categoria,
    precioBase: sala.precioBase,
    mejorOferta: sala.mejorOferta,
    versionEstado: 1,
    puedePujar: true,
    numeroPostorGanador: sala.numeroPostorGanador,
    segundosRestantes: RETENCION_SEGUNDOS,
    historialReciente: sala.historial,
    esGanadorActual: sala.esGanadorActual,
    loteCerrado: false,
    loteGanado: false,
    mediosParaPujar: [],
    serverTimeOffsetMs: 0,
  };
}

/**
 * Registra una puja — equivalente a `POST /api/subastas/{id}/pujar`.
 *
 * Valida en este orden (codigos del contrato Endpoints.docx):
 *  1. 409 ITEM_SUBASTADO        — el item ya fue adjudicado.
 *  2. 403 CATEGORIA_INSUFICIENTE — categoria del usuario < categoria subasta.
 *  3. 403 MULTA_ACTIVA           — el usuario tiene una multa pendiente.
 *  4. 403 PUJA_ACTIVA_OTRA_SUBASTA — ya es ganador en otra sala.
 *  5. 422 MEDIO_NO_VERIFICADO    — medio inexistente / no validado / otra moneda.
 *  6. 400 MONTO_MENOR_MINIMO | MONTO_MAYOR_MAXIMO — monto fuera de rango.
 *
 * (MONTO_EXCEDE_LIMITE_CATEGORIA y MONTO_EXCEDE_LIMITE_MEDIO_PAGO son topes de
 * gasto que valida el backend con datos que el mock todavia no modela — quedan
 * documentados en el contrato y se agregan cuando exista esa info.)
 *
 * En exito actualiza la sala: el usuario pasa a ser el ganador vigente y se le
 * asigna su numero de postor (EXTRAS 22.11: la 1ra puja confirma asistencia).
 */
export function pujar(
  subastaId: string,
  _idItem: string,
  valorOfertado: number,
  idMedioPago: string,
): ResultadoPuja {
  const subasta = getMockDetalle(subastaId);
  const item = findItemEnVivo(subastaId);
  if (!subasta || !item) {
    return {
      ok: false,
      error: {
        codigo: 409,
        tipo: 'ITEM_SUBASTADO',
        mensaje: 'El ítem ya no está disponible para pujar.',
      },
    };
  }

  const sala = getSala(subastaId, item);

  if (sala.cerrado) {
    return {
      ok: false,
      error: {
        codigo: 409,
        tipo: 'ITEM_SUBASTADO',
        mensaje: 'Otro postor ya ganó este ítem.',
      },
    };
  }

  if (
    CATEGORIA_ORDER[MOCK_USUARIO_ACTUAL.categoria] <
    CATEGORIA_ORDER[subasta.categoria]
  ) {
    return {
      ok: false,
      error: {
        codigo: 403,
        tipo: 'CATEGORIA_INSUFICIENTE',
        mensaje: `Tu categoría no alcanza para pujar en subastas categoría ${subasta.categoria}.`,
      },
    };
  }

  if (MOCK_USUARIO_ACTUAL.multaActiva) {
    return {
      ok: false,
      error: {
        codigo: 403,
        tipo: 'MULTA_ACTIVA',
        mensaje: 'Tenés una multa activa. Regularizala para volver a pujar.',
      },
    };
  }

  const ganandoEnOtra = Object.entries(_salas).some(
    ([sid, s]) => sid !== subastaId && s.esGanadorActual && !s.cerrado,
  );
  if (ganandoEnOtra) {
    return {
      ok: false,
      error: {
        codigo: 403,
        tipo: 'PUJA_ACTIVA_OTRA_SUBASTA',
        mensaje: 'Ya tenés una puja ganadora activa en otra subasta.',
      },
    };
  }

  const medio = getMedioPagoById(idMedioPago);
  if (!medio || medio.estado !== 'activo' || medio.moneda !== subasta.moneda) {
    return {
      ok: false,
      error: {
        codigo: 422,
        tipo: 'MEDIO_NO_VERIFICADO',
        mensaje:
          'El medio de pago no está verificado o no corresponde a la moneda de la subasta.',
      },
    };
  }

  const limites = calcularLimites(sala.mejorOferta, sala.precioBase, subasta.categoria);
  if (valorOfertado < limites.minimo) {
    return {
      ok: false,
      error: {
        codigo: 400,
        tipo: 'MONTO_MENOR_MINIMO',
        mensaje: `Tu oferta debe ser de al menos ${limites.minimo}.`,
      },
    };
  }
  if (limites.maximo != null && valorOfertado > limites.maximo) {
    return {
      ok: false,
      error: {
        codigo: 400,
        tipo: 'MONTO_MAYOR_MAXIMO',
        mensaje: `Tu oferta no puede superar ${limites.maximo}.`,
      },
    };
  }

  // Exito — asignar numero de postor en la primera puja del usuario.
  if (sala.numeroPostorUsuario == null) {
    const maxPostor = sala.historial.reduce(
      (m, h) => Math.max(m, h.numeroPostor ?? 0),
      0,
    );
    sala.numeroPostorUsuario = maxPostor + 1;
  }
  const numeroPostor = sala.numeroPostorUsuario;

  sala.mejorOferta = valorOfertado;
  sala.numeroPostorGanador = numeroPostor;
  sala.esGanadorActual = true;
  sala.historial = [
    {
      id: `h_u_${sala.historial.length}`,
      numeroPostor,
      postorAlias: `Postor #${numeroPostor}`,
      monto: valorOfertado,
      haceMinutos: 0,
      ganadora: true,
    },
    ...sala.historial.map((h) => ({ ...h, ganadora: false })),
  ];

  const siguiente = calcularLimites(valorOfertado, sala.precioBase, subasta.categoria);
  return {
    ok: true,
    pujaId: `puja_${subastaId}_${numeroPostor}_${valorOfertado}`,
    valorOfertado,
    esGanadora: true,
    siguienteMinimo: siguiente.minimo,
    numeroPostor,
  };
}
