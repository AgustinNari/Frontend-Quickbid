
export type InscripcionErrorCodigo = 400 | 403 | 409 | 422;

export type InscripcionError = {
  codigo: InscripcionErrorCodigo;
  mensaje: string;
};

export type ResultadoInscripcion =
  | {
      ok: true;
      subastaId: string;
      idMedioPago: string;
      mensajeValidacion?: string;
    }
  | { ok: false; error: InscripcionError };
