import { ItemDetalle, SubastaCategoria, SubastaMoneda } from './subasta';
import { MedioPagoDto } from './mediosPago';

export type PujaActualApi = {
  subastaId: number;
  itemActivoId: number | null;
  mejorOfertaActual: number | null;
  moneda: string;
  versionEstado: number;
  puedePujar: boolean;
  motivo: string | null;
  precioBase?: number | null;
  incrementoMinimo?: number | null;
  serverNow?: string | null;
  retencionHasta?: string | null;
  segundosRestantes?: number | null;
  miPujaGanadora?: boolean;
  estadoLote?: string;
  adjudicado?: boolean;
  siguienteAccion?: string | null;
  esperandoPrimeraPuja?: boolean;
  timerActivo?: boolean;
  mensajeEstado?: string | null;
};

export type PujarRequestApi = {
  itemCatalogoId: number;
  monto: number;
  medioPagoId: number;
  clientStateVersion: number;
  idempotencyKey: string;
};

export type PujarResponseApi = {
  id: number;
  subastaId: number;
  itemCatalogoId: number;
  estado: string;
  monto: number;
  moneda: string;
  secuencia: number;
  versionEstado: number;
  mejorOfertaActual: number | null;
  numeroPostor: number | null;
  idempotentReplay?: boolean;
  retencionHasta?: string | null;
};

export type PujaEventoTipo =
  | 'MEJOR_OFERTA_ACTUALIZADA'
  | 'ESTADO_ACTUALIZADO'
  | 'PUJA_ACEPTADA'
  | 'PUJA_SUPERADA'
  | 'PUJA_RECHAZADA'
  | 'LOTE_CERRADO'
  | 'LOTE_GANADO'
  | 'SUBASTA_INICIADA'
  | 'LOTE_ACTIVADO'
  | 'SUBASTA_FINALIZADA';

export type PujaEventoApi = {
  tipo: PujaEventoTipo | string;
  subastaId?: number;
  itemCatalogoId?: number;
  itemCatalogoActivoId?: number;
  pujaId?: number;
  monto?: number;
  mejorOfertaActual?: number | null;
  moneda?: string;
  secuencia?: number;
  versionEstado?: number;
  numeroPostor?: number | null;
  postorAlias?: string;
  code?: string;
  message?: string;
  compraId?: number;
  pujaGanadoraId?: number;
  montoAdjudicacion?: number;
  compradorEmpresa?: boolean;
  retencionHasta?: string | null;
  loteFinalizaEstimadoAt?: string | null;
  proximoLoteProgramadoAt?: string | null;
  subastaFinalizaProgramadoAt?: string | null;
};

export type LiveQueueName =
  | `/topic/subastas/${number}/estado`
  | `/topic/subastas/${number}/items/${number}/pujas`
  | '/user/queue/pujas'
  | '/user/queue/notificaciones';

export type PujaHistorial = {
  id: string;
  postorAlias?: string;
  numeroPostor?: number;
  monto: number;
  versionEstado?: number;
  ganadora?: boolean;
  haceMinutos?: number;
};

export type LimitesPuja = {
  minimo: number;
  maximo: number | null;
  sinLimiteSuperior: boolean;
};

export type PujaActual = {
  subastaId: string;
  subastaTitulo: string;
  item: ItemDetalle;
  moneda: SubastaMoneda;
  categoria: SubastaCategoria;
  precioBase: number;
  mejorOferta: number | null;
  versionEstado: number;
  puedePujar: boolean;
  motivoNoPuedePujar?: string;
  postorGanadorAlias?: string;
  numeroPostorGanador?: number | null;
  esGanadorActual: boolean;
  loteCerrado: boolean;
  loteGanado: boolean;
  subastaFinalizada?: boolean;
  esperandoPrimeraPuja?: boolean;
  timerActivo?: boolean;
  mensajeEstado?: string;
  proximoLoteAt?: string | null;
  historialReciente: PujaHistorial[];
  mediosParaPujar: MedioPagoDto[];
  segundosRestantes?: number;
  retencionHasta?: string;
  serverTimeOffsetMs: number;
};

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
  codigo: 400 | 403 | 409 | 422;
  tipo: PujaErrorTipo;
  mensaje: string;
};

export type ResultadoPuja =
  | {
      ok: true;
      pujaId: string;
      valorOfertado: number;
      esGanadora: boolean;
      siguienteMinimo: number;
      numeroPostor: number;
    }
  | { ok: false; error: PujaError };
