import { ItemDetalle, SubastaCategoria } from '../types/subasta';
import { PujaActual, PujaActualApi, PujaEventoApi } from '../types/puja';
import { MedioPagoInscripcionApi } from '../types/subastaApi';
import { SubastaDetalle } from '../types/subasta';

export function mapPujaActual(
  snapshot: PujaActualApi,
  subasta: SubastaDetalle,
  item: ItemDetalle,
  mediosParaPujar: MedioPagoInscripcionApi[],
): PujaActual {
  const serverNowMs = snapshot.serverNow
    ? Date.parse(snapshot.serverNow)
    : Date.now();
  return {
    subastaId: String(snapshot.subastaId),
    subastaTitulo: subasta.titulo,
    item: { ...item, estado: 'en_vivo' },
    moneda: snapshot.moneda === 'USD' ? 'USD' : 'ARS',
    categoria: subasta.categoria,
    precioBase: snapshot.precioBase ?? item.precioBase ?? 0,
    mejorOferta: snapshot.mejorOfertaActual,
    versionEstado: snapshot.versionEstado,
    puedePujar: snapshot.puedePujar,
    motivoNoPuedePujar: snapshot.motivo ?? undefined,
    esGanadorActual: snapshot.miPujaGanadora ?? false,
    loteCerrado: snapshot.adjudicado ?? snapshot.estadoLote === 'cerrado',
    loteGanado: false,
    historialReciente:
      snapshot.mejorOfertaActual != null
        ? [
            {
              id: `snapshot-${snapshot.versionEstado}`,
              postorAlias: 'Mejor postor actual',
              monto: snapshot.mejorOfertaActual,
              versionEstado: snapshot.versionEstado,
              ganadora: true,
            },
          ]
        : [],
    mediosParaPujar,
    segundosRestantes: snapshot.segundosRestantes ?? undefined,
    retencionHasta: snapshot.retencionHasta ?? undefined,
    serverTimeOffsetMs: Number.isNaN(serverNowMs)
      ? 0
      : serverNowMs - Date.now(),
  };
}

export function calcularLimites(
  mejorOferta: number | null,
  precioBase: number,
  categoria: SubastaCategoria,
): { minimo: number; maximo: number | null; sinLimiteSuperior: boolean } {
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

export function applyPujaEvent(
  current: PujaActual,
  event: PujaEventoApi,
): PujaActual {
  const nextVersion = event.versionEstado ?? current.versionEstado;
  if (nextVersion < current.versionEstado) return current;

  if (
    event.tipo === 'MEJOR_OFERTA_ACTUALIZADA' ||
    event.tipo === 'PUJA_ACEPTADA' ||
    event.tipo === 'PUJA_SUPERADA'
  ) {
    const monto = event.monto ?? event.mejorOfertaActual ?? current.mejorOferta;
    const postorAlias =
      event.postorAlias ??
      (event.numeroPostor != null ? `Postor #${event.numeroPostor}` : 'Postor');
    return {
      ...current,
      mejorOferta: monto,
      versionEstado: nextVersion,
      postorGanadorAlias: postorAlias,
      numeroPostorGanador: event.numeroPostor ?? current.numeroPostorGanador,
      esGanadorActual:
        event.tipo === 'PUJA_ACEPTADA'
          ? true
          : event.tipo === 'PUJA_SUPERADA'
          ? false
          : current.esGanadorActual,
      retencionHasta: event.retencionHasta ?? current.retencionHasta,
      historialReciente:
        monto == null
          ? current.historialReciente
          : [
              {
                id: `${event.tipo}-${nextVersion}-${
                  event.pujaId ?? Date.now()
                }`,
                postorAlias,
                monto,
                versionEstado: nextVersion,
                ganadora: true,
              },
              ...current.historialReciente.map(item => ({
                ...item,
                ganadora: false,
              })),
            ].slice(0, 6),
    };
  }

  if (event.tipo === 'ESTADO_ACTUALIZADO') {
    return {
      ...current,
      mejorOferta: event.mejorOfertaActual ?? current.mejorOferta,
      versionEstado: nextVersion,
      retencionHasta: event.retencionHasta ?? current.retencionHasta,
    };
  }

  if (event.tipo === 'LOTE_CERRADO' || event.tipo === 'LOTE_GANADO') {
    return {
      ...current,
      loteCerrado: true,
      loteGanado: event.tipo === 'LOTE_GANADO' ? true : current.loteGanado,
      puedePujar: false,
      esGanadorActual: false,
      retencionHasta: undefined,
      segundosRestantes: 0,
      versionEstado: nextVersion,
      // El backend informa que sigue despues del cierre: proximo lote programado
      // o cierre de la subasta. Permite mostrar la espera sin reconsultar.
      proximoLoteAt: event.proximoLoteProgramadoAt ?? null,
    };
  }

  if (event.tipo === 'SUBASTA_FINALIZADA') {
    return {
      ...current,
      subastaFinalizada: true,
      loteCerrado: true,
      puedePujar: false,
      esGanadorActual: false,
      retencionHasta: undefined,
      segundosRestantes: 0,
      proximoLoteAt: null,
      versionEstado: nextVersion,
    };
  }

  return current;
}
