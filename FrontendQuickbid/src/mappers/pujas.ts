import { ItemDetalle, SubastaCategoria } from '../types/subasta';
import {
  PujaActual,
  PujaActualApi,
  PujaEventoApi,
  PujaHistorial,
} from '../types/puja';
import { MedioPagoDto } from '../types/mediosPago';
import { SubastaDetalle } from '../types/subasta';

export function mapPujaActual(
  snapshot: PujaActualApi,
  subasta: SubastaDetalle,
  item: ItemDetalle,
  mediosParaPujar: MedioPagoDto[],
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
    subastaFinalizada: snapshot.estadoLote === 'finalizada',
    esperandoPrimeraPuja: snapshot.esperandoPrimeraPuja ?? false,
    timerActivo: snapshot.timerActivo ?? false,
    mensajeEstado: snapshot.mensajeEstado ?? undefined,
    deadlineActual: snapshot.deadlineActual ?? snapshot.retencionHasta ?? undefined,
    tipoTimer: snapshot.tipoTimer ?? undefined,
    proximoLoteAt: snapshot.proximoLoteAt ?? undefined,
    subastaFinalizaAt: snapshot.subastaFinalizaAt ?? undefined,
    siguienteItemId: snapshot.siguienteItemId ?? undefined,
    siguienteLoteOrden: snapshot.siguienteLoteOrden ?? undefined,
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
    const existingKey = eventHistoryKey(event, nextVersion, monto);
    const duplicateIndex = current.historialReciente.findIndex(
      item => item.id === existingKey || sameBidHistory(item, event, monto),
    );
    const alreadyListed = duplicateIndex >= 0;
    const postorAlias =
      event.postorAlias ??
      (event.numeroPostor != null ? `Postor #${event.numeroPostor}` : 'Postor');
    const nextHistory =
      monto == null
        ? current.historialReciente.map((item, index) => ({
            ...item,
            ganadora: index === 0,
          }))
        : alreadyListed
        ? current.historialReciente.map((item, index) =>
            index === duplicateIndex
              ? {
                  ...item,
                  id: existingKey,
                  postorAlias,
                  numeroPostor: event.numeroPostor ?? item.numeroPostor,
                  monto,
                  versionEstado: nextVersion,
                  ganadora: index === 0,
                }
              : {
                  ...item,
                  ganadora: index === 0,
                },
          )
        : [
            {
              id: existingKey,
              postorAlias,
              numeroPostor: event.numeroPostor ?? undefined,
              monto,
              versionEstado: nextVersion,
              ganadora: true,
            },
            ...current.historialReciente.map(item => ({
              ...item,
              ganadora: false,
            })),
          ].slice(0, 6);
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
      deadlineActual: event.retencionHasta ?? current.deadlineActual,
      tipoTimer: event.retencionHasta ? 'retencion_ganadora' : current.tipoTimer,
      esperandoPrimeraPuja: false,
      timerActivo: true,
      mensajeEstado: undefined,
      historialReciente: nextHistory,
    };
  }

  if (event.tipo === 'ESTADO_ACTUALIZADO') {
    return {
      ...current,
      mejorOferta: event.mejorOfertaActual ?? current.mejorOferta,
      versionEstado: nextVersion,
      retencionHasta: event.retencionHasta ?? current.retencionHasta,
      deadlineActual:
        event.retencionHasta ?? event.loteFinalizaEstimadoAt ?? current.deadlineActual,
      tipoTimer: event.retencionHasta
        ? 'retencion_ganadora'
        : event.loteFinalizaEstimadoAt
        ? 'sin_pujas_empresa'
        : current.tipoTimer,
      timerActivo:
        event.retencionHasta != null ||
        event.loteFinalizaEstimadoAt != null ||
        current.timerActivo,
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
      esperandoPrimeraPuja: false,
      timerActivo: false,
      versionEstado: nextVersion,
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
      esperandoPrimeraPuja: false,
      timerActivo: false,
      mensajeEstado: 'La subasta finalizó.',
      proximoLoteAt: null,
      subastaFinalizaAt: event.subastaFinalizaProgramadoAt ?? current.subastaFinalizaAt,
      versionEstado: nextVersion,
    };
  }

  return current;
}

function eventHistoryKey(
  event: PujaEventoApi,
  version: number,
  monto: number | null,
) {
  if (event.pujaId != null) return `puja-${event.pujaId}`;
  const amount = monto == null ? 'sin-monto' : String(monto);
  return [
    'puja',
    event.itemCatalogoId ?? event.itemCatalogoActivoId ?? 'item',
    version,
    event.secuencia ?? 'seq',
    amount,
    event.numeroPostor ?? 'postor',
  ].join('-');
}

function sameBidHistory(
  item: PujaHistorial,
  event: PujaEventoApi,
  monto: number | null,
) {
  if (monto == null) return false;
  if (item.monto !== monto) return false;
  if (
    event.versionEstado != null &&
    item.versionEstado != null &&
    item.versionEstado === event.versionEstado
  ) {
    return true;
  }
  return event.numeroPostor != null && item.numeroPostor === event.numeroPostor;
}
