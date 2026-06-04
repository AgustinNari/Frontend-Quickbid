/**
 * Tipos del dominio de puja en vivo (tarea #14 del Trello).
 *
 * Refleja el contrato de:
 *  - `GET  /api/subastas/{id}/puja-actual` -> `PujaActual`
 *  - `POST /api/subastas/{id}/pujar`        -> `ResultadoPuja`
 * definidos en `Material/Endpoints.docx`, junto con las reglas de negocio de
 * `Consignas.docx` y los EXTRAS del backend (min/max de puja, retencion de 60s,
 * postor anonimo, estados de puja).
 *
 * Cuando exista backend real, estos tipos validan la respuesta del WebSocket /
 * REST. Hoy los consume el mock `src/mocks/puja.ts`.
 */

import { ItemDetalle, SubastaCategoria, SubastaMoneda } from './subasta';

/**
 * Estado de una puja individual (EXTRAS 21.2 — tabla `pujos_eventos`).
 *
 * - `enviada`: el usuario confirmo y se esta validando en tiempo real.
 * - `aceptada`: entro al ruedo pero no es la mejor.
 * - `ganadora`: es la mejor oferta vigente (espera la retencion de 60s).
 * - `superada`: otra puja la paso.
 * - `rechazada`: invalida (fuera de rango, medio sin fondos, item ya cerrado).
 */
export type EstadoPuja =
  | 'enviada'
  | 'aceptada'
  | 'ganadora'
  | 'superada'
  | 'rechazada';

/**
 * Entrada del historial reciente que muestra la sala de subasta.
 *
 * El postor es anonimo: solo se ve su numero dentro de la subasta
 * (`asistentes.numeroPostor`, EXTRAS 22.11), nunca su identidad.
 */
export type PujaHistorial = {
  id: string;
  /** Numero de postor anonimo, unico dentro de esa subasta. */
  numeroPostor: number;
  monto: number;
  /** Minutos transcurridos desde la puja (para el "Hace 2 min" del wireframe). */
  haceMinutos: number;
  /** True si es la mejor oferta vigente (ganadora momentanea). */
  ganadora?: boolean;
};

/**
 * Estado vivo de la sala de subasta.
 *
 * Shape de `GET /api/subastas/{id}/puja-actual`: el item que se esta
 * subastando ahora, la mejor oferta, el contador de retencion, el numero de
 * postor ganador (anonimo) y el historial reciente.
 */
export type PujaActual = {
  subastaId: string;
  /** Titulo de la subasta (para el header de la sala). */
  subastaTitulo: string;
  /** Item en vivo siendo subastado en este momento. */
  item: ItemDetalle;
  moneda: SubastaMoneda;
  /**
   * Categoria de la subasta. Define si aplican limites de puja: en oro/platino
   * no hay min ni max (solo "superar la mejor oferta por >= 1 unidad").
   */
  categoria: SubastaCategoria;
  /** Precio base del item (snapshot al publicar — EXTRAS 22.1). */
  precioBase: number;
  /** Mejor oferta vigente. `null` si todavia nadie pujo. */
  mejorOferta: number | null;
  /** Numero de postor anonimo con la mejor oferta. `null` si nadie pujo. */
  numeroPostorGanador: number | null;
  /** Segundos restantes de la retencion de la puja ganadora (consigna: 60s). */
  segundosRestantes: number;
  /** Historial reciente, mas nuevo primero. */
  historialReciente: PujaHistorial[];
  /**
   * True si la mejor oferta vigente es del usuario actual. La app impide
   * pujar sobre tu propia oferta ganadora (wireframe: "No puedes superar tu
   * propia oferta").
   */
  esGanadorActual: boolean;
};

/**
 * Limites de puja calculados para el item actual.
 *
 * Regla (Consignas + EXTRAS 10):
 *  - `minimo` = mejor oferta + 1% del precio base.
 *  - `maximo` = mejor oferta + 20% del precio base.
 *  - oro / platino: sin min ni max, solo superar la mejor oferta por >= 1 unidad.
 *  - primera puja (sin ofertas previas): puede igualar el precio base.
 */
export type LimitesPuja = {
  /** Monto minimo aceptable para la proxima puja. */
  minimo: number;
  /** Monto maximo aceptable. `null` cuando no aplica (oro/platino). */
  maximo: number | null;
  /** True si la subasta es oro/platino y por ende no tiene tope superior. */
  sinLimiteSuperior: boolean;
};

/**
 * Codigos de error tipados del contrato `POST /pujar` (Endpoints.docx).
 * Se replican literal para que el mock no invente mensajes propios.
 */
export type PujaErrorTipo =
  | 'MONTO_MENOR_MINIMO'
  | 'MONTO_MAYOR_MAXIMO'
  | 'MONTO_EXCEDE_LIMITE_CATEGORIA'
  | 'MONTO_EXCEDE_LIMITE_MEDIO_PAGO'
  | 'MULTA_ACTIVA'
  | 'PUJA_ACTIVA_OTRA_SUBASTA'
  | 'CATEGORIA_INSUFICIENTE'
  | 'ITEM_SUBASTADO'
  | 'MEDIO_NO_VERIFICADO';

export type PujaError = {
  /** Codigo HTTP del contrato (400 | 403 | 409 | 422). */
  codigo: 400 | 403 | 409 | 422;
  tipo: PujaErrorTipo;
  mensaje: string;
};

/**
 * Resultado de `POST /api/subastas/{id}/pujar`.
 *
 * Union discriminado por `ok` — mismo patron que `ResultadoInscripcion`. El
 * caso exito devuelve lo que retorna el contrato: id de la puja, valor
 * ofertado, flag de puja ganadora y siguiente monto minimo.
 */
export type ResultadoPuja =
  | {
      ok: true;
      pujaId: string;
      valorOfertado: number;
      /** Flag de puja ganadora del contrato. */
      esGanadora: boolean;
      /** Siguiente monto minimo para la proxima puja. */
      siguienteMinimo: number;
      /** Numero de postor anonimo asignado al usuario en esta subasta. */
      numeroPostor: number;
    }
  | { ok: false; error: PujaError };
