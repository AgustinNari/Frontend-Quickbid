import { ResultadoInscripcion } from '../types/inscripcion';
import { puedeInscribirsePorCategoria } from '../types/usuario';
import { SubastaCategoria, SubastaEstado } from '../types/subasta';
import { MOCK_USUARIO_ACTUAL } from './usuarioActual';
import { MOCK_MEDIOS_PAGO } from './mediosPago';
import { MOCK_SUBASTAS, MOCK_SUBASTA_DETALLE } from './subastas';

/**
 * Mock mutable del estado "que subastas tiene inscriptas el usuario actual".
 *
 * Se inicializa con los ids de las subastas que tienen `inscripto: true` en
 * `MOCK_SUBASTA_DETALLE` para mantener coherencia con el mock original.
 *
 * El estado vive en memoria — se resetea con cada reload de la app, lo que
 * esta bien para demo / desarrollo. Cuando exista backend, esto se reemplaza
 * por una mutacion via `POST /api/subastas/{id}/inscribirse` y el estado se
 * deriva de `GET /api/subastas/{id}` (campo `inscripto`).
 */
const _inscriptos = new Set<string>(
  Object.values(MOCK_SUBASTA_DETALLE)
    .filter((d) => d.inscripto === true)
    .map((d) => d.id),
);

/** True si el usuario actual ya esta inscripto en esa subasta. */
export function estaInscripto(subastaId: string): boolean {
  return _inscriptos.has(subastaId);
}

/**
 * Intenta inscribir al usuario actual en una subasta con un medio de pago dado.
 *
 * Replica las validaciones del endpoint real `POST /api/subastas/{id}/inscribirse`
 * documentado en `Endpoints.docx`. Devuelve un `ResultadoInscripcion` tipado
 * para que el consumidor pueda renderizar exito o error sin parsear strings.
 *
 * Orden de validaciones (igual al backend):
 *  1. Subasta existe.
 *  2. 409 — ya esta inscripto.
 *  3. 403 — categoria del usuario insuficiente.
 *  4. 403 — usuario con multa activa.
 *  5. 400 — la subasta ya comenzo o cierra en menos de 30 min.
 *  6. 422 — medio de pago no encontrado o moneda incompatible.
 *
 * Si todo pasa, el set mutable se actualiza y devuelve `ok: true`.
 */
export function inscribir(
  subastaId: string,
  idMedioPago: string,
): ResultadoInscripcion {
  const subasta =
    MOCK_SUBASTA_DETALLE[subastaId] ??
    MOCK_SUBASTAS.find((s) => s.id === subastaId) ??
    null;

  if (!subasta) {
    return {
      ok: false,
      error: { codigo: 403, mensaje: 'Subasta no encontrada.' },
    };
  }

  if (estaInscripto(subastaId)) {
    return {
      ok: false,
      error: { codigo: 409, mensaje: 'Ya estás inscripto en esta subasta.' },
    };
  }

  if (
    !puedeInscribirsePorCategoria(
      MOCK_USUARIO_ACTUAL.categoria,
      subasta.categoria,
    )
  ) {
    return {
      ok: false,
      error: {
        codigo: 403,
        mensaje: `Tu categoría actual no permite inscribirse en subastas categoría ${subasta.categoria}.`,
      },
    };
  }

  if (MOCK_USUARIO_ACTUAL.multaActiva) {
    return {
      ok: false,
      error: {
        codigo: 403,
        mensaje:
          'Tenés una multa activa. Regularizala para volver a inscribirte.',
      },
    };
  }

  const inicioMs = new Date(subasta.fechaInicio).getTime();
  const minutosRestantes = (inicioMs - Date.now()) / 1000 / 60;
  if (minutosRestantes < 30) {
    return {
      ok: false,
      error: {
        codigo: 400,
        mensaje:
          'La inscripción cierra 30 minutos antes del inicio de la subasta.',
      },
    };
  }

  const medio = MOCK_MEDIOS_PAGO.find((m) => m.id === idMedioPago);
  if (!medio) {
    return {
      ok: false,
      error: { codigo: 422, mensaje: 'Medio de pago no encontrado.' },
    };
  }
  if (medio.moneda !== subasta.moneda) {
    return {
      ok: false,
      error: {
        codigo: 422,
        mensaje: `La moneda del medio de pago (${medio.moneda}) no coincide con la subasta (${subasta.moneda}).`,
      },
    };
  }

  _inscriptos.add(subastaId);

  return {
    ok: true,
    subastaId,
    idMedioPago,
    mensajeValidacion: 'La validación puede demorar hasta 24 hs.',
  };
}

/**
 * Helper de presentacion: devuelve el motivo por el cual el usuario NO puede
 * inscribirse en una subasta (sin chequear medio de pago todavia, eso se
 * elige despues). Devuelve `null` si si puede.
 *
 * Lo usa `SubastaDetailScreen` para decidir el label/estado del boton
 * "Inscribirme" antes de entrar al flujo completo. Orden de prioridad de los
 * bloqueos (igual al backend):
 *  1. Estado de la subasta: solo "proxima" admite inscripcion.
 *  2. Categoria del usuario insuficiente para la subasta.
 *  3. Multa activa en la cuenta del usuario.
 */
export function getMotivoBloqueoInscripcion(subasta: {
  estado: SubastaEstado;
  categoria: SubastaCategoria;
}): { codigo: 400 | 403; mensaje: string } | null {
  if (subasta.estado === 'activa') {
    return {
      codigo: 400,
      mensaje: 'Inscripción cerrada',
    };
  }
  if (subasta.estado === 'finalizada') {
    return {
      codigo: 400,
      mensaje: 'Subasta finalizada',
    };
  }
  if (
    !puedeInscribirsePorCategoria(MOCK_USUARIO_ACTUAL.categoria, subasta.categoria)
  ) {
    return {
      codigo: 403,
      mensaje: 'Categoría insuficiente',
    };
  }
  if (MOCK_USUARIO_ACTUAL.multaActiva) {
    return {
      codigo: 403,
      mensaje: 'Multa activa',
    };
  }
  return null;
}
