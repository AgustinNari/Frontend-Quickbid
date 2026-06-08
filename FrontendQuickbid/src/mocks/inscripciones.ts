import { ResultadoInscripcion } from '../types/inscripcion';
import { puedeInscribirsePorCategoria } from '../types/usuario';
import { SubastaCategoria, SubastaEstado } from '../types/subasta';
import { MOCK_USUARIO_ACTUAL } from './usuarioActual';
import { MOCK_MEDIOS_PAGO } from './mediosPago';
import { MOCK_SUBASTAS, MOCK_SUBASTA_DETALLE } from './subastas';

const _inscriptos = new Set<string>(
  Object.values(MOCK_SUBASTA_DETALLE)
    .filter((d) => d.inscripto === true)
    .map((d) => d.id),
);

export function estaInscripto(subastaId: string): boolean {
  return _inscriptos.has(subastaId);
}

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
