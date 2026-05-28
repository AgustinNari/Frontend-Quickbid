/**
 * Tipos del flujo de inscripcion a una subasta.
 *
 * Refleja las respuestas posibles del endpoint
 * `POST /api/subastas/{id}/inscribirse` documentado en
 * `Material/Endpoints.docx`. Los codigos HTTP estan modelados como un union
 * type discriminado para que el consumidor pueda hacer pattern matching.
 */

/**
 * Codigos de error posibles al intentar inscribirse.
 *
 * - 400: la subasta ya comenzo (cierre <30 min antes del inicio).
 * - 403: categoria del usuario insuficiente o multa activa.
 * - 409: el usuario ya esta inscripto a esta subasta.
 * - 422: la moneda del medio de pago no coincide con la subasta.
 */
export type InscripcionErrorCodigo = 400 | 403 | 409 | 422;

export type InscripcionError = {
  codigo: InscripcionErrorCodigo;
  mensaje: string;
};

/**
 * Resultado de una inscripcion. Es un union discriminado por la prop `ok`.
 *  - `ok: true` → exito, contiene los datos del registro creado.
 *  - `ok: false` → error tipado con codigo y mensaje listos para UI.
 */
export type ResultadoInscripcion =
  | {
      ok: true;
      subastaId: string;
      idMedioPago: string;
      /** Mensaje informativo de tiempos: "La validación puede demorar hasta 24 hs". */
      mensajeValidacion?: string;
    }
  | { ok: false; error: InscripcionError };
