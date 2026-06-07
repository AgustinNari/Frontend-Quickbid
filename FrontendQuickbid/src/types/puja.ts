import { ItemDetalle, SubastaCategoria, SubastaMoneda } from './subasta';
import { MedioPagoInscripcionApi } from './subastaApi';

export type PujaActualApi = {
  subastaId: number;
  itemActivoId: number | null;
  mejorOfertaActual: number | null;
  moneda: string;
  versionEstado: number;
  puedePujar: boolean;
  motivo: string | null;
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
};

export type PujaEventoTipo =
  | 'MEJOR_OFERTA_ACTUALIZADA'
  | 'ESTADO_ACTUALIZADO'
  | 'PUJA_ACEPTADA'
  | 'PUJA_SUPERADA'
  | 'PUJA_RECHAZADA'
  | 'LOTE_CERRADO'
  | 'LOTE_GANADO';

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
  historialReciente: PujaHistorial[];
  mediosParaPujar: MedioPagoInscripcionApi[];
  segundosRestantes?: number;
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
