import {
  AcuerdoConsignacion,
  ConsignacionDetalle,
  DatosBien,
  EstadoConsignacion,
  EtapaConsignacion,
  EtapaEstado,
  MIN_FOTOS_CONSIGNACION,
  RequisitoConsignacion,
  ResultadoConsignacion,
} from '../types/consignacion';

const ETAPAS_LABELS = [
  'Validación',
  'Verificación física',
  'Acuerdo',
  'En subasta',
  'Liquidación',
];

const PROGRESO: Record<EstadoConsignacion, number> = {
  en_validacion: 0,
  recepcion_pendiente: 1,
  revision_fisica: 1,
  acuerdo_pendiente: 2,
  acuerdo_aceptado: 3,
  en_subasta: 3,
  vendida: 4,
  liquidada: 5,
  rechazada: -1,
  devolucion_pendiente: -1,
};

function construirEtapas(
  estado: EstadoConsignacion,
  rechazoEnEtapa = 1,
  detalleRechazo?: string,
): EtapaConsignacion[] {
  return ETAPAS_LABELS.map((label, i) => {
    let st: EtapaEstado;
    if (estado === 'rechazada' || estado === 'devolucion_pendiente') {
      st =
        i < rechazoEnEtapa
          ? 'completada'
          : i === rechazoEnEtapa
          ? 'rechazada'
          : 'pendiente';
    } else {
      const p = PROGRESO[estado];
      st = i < p ? 'completada' : i === p ? 'actual' : 'pendiente';
    }
    return {
      id: `e${i}`,
      label,
      estado: st,
      detalle: st === 'rechazada' ? detalleRechazo : undefined,
    };
  });
}

type DetalleBase = Omit<ConsignacionDetalle, 'etapas'> & {
  rechazoEnEtapa?: number;
};

const acuerdoEstandar = (precioBase: number): AcuerdoConsignacion => ({
  precioBase,
  comisionVendedor: 10,
  comisionComprador: 10,
  estimadoVendedor: Math.round(precioBase * 0.9),
  vigencia: '72 horas',
});

const DETALLES: Record<string, DetalleBase> = {
  '1': {
    id: '1',
    codigo: '#CONS-2026-00847',
    nombre: 'Reloj Cartier Santos 1978',
    segmento: 'relojeria',
    moneda: 'ARS',
    precioBase: 2800000,
    montoEstimado: 2520000,
    estado: 'acuerdo_pendiente',
    acuerdo: acuerdoEstandar(2800000),
    fecha: '12 may 2026',
  },
  '2': {
    id: '2',
    codigo: '#CONS-2026-00848',
    nombre: 'Pintura óleo "Puerto"',
    segmento: 'arte',
    moneda: 'USD',
    precioBase: 3500,
    montoEstimado: 3150,
    estado: 'en_subasta',
    acuerdo: acuerdoEstandar(3500),
    fecha: '8 may 2026',
  },
  '3': {
    id: '3',
    codigo: '#CONS-2026-00851',
    nombre: 'Moneda oro 1899 — 50 pesos',
    segmento: 'antiguedades',
    moneda: 'ARS',
    precioBase: 0,
    estado: 'en_validacion',
    fecha: '21 may 2026',
  },
  '4': {
    id: '4',
    codigo: '#CONS-2026-00852',
    nombre: 'Moneda oro 1920 — 50 pesos',
    segmento: 'antiguedades',
    moneda: 'ARS',
    precioBase: 0,
    estado: 'revision_fisica',
    fecha: '19 may 2026',
  },
  '5': {
    id: '5',
    codigo: '#CONS-2026-00839',
    nombre: 'Guitarra Gibson Les Paul 1960',
    segmento: 'coleccion',
    moneda: 'ARS',
    precioBase: 0,
    estado: 'rechazada',
    motivoRechazo: 'Documentación de origen incompleta.',
    rechazoEnEtapa: 0,
    fecha: '2 may 2026',
  },
  '8': {
    id: '8',
    codigo: '#CONS-2025-00710',
    nombre: 'Automóvil Ford T 1924',
    segmento: 'vehiculos',
    moneda: 'ARS',
    precioBase: 48000000,
    montoEstimado: 43200000,
    estado: 'liquidada',
    acuerdo: acuerdoEstandar(48000000),
    fecha: '12 mar 2025',
  },
};

const _estadoOverride: Record<string, EstadoConsignacion> = {};
const _nuevas: Record<string, Omit<ConsignacionDetalle, 'etapas'>> = {};
let _seq = 100;

export function getRequisitos(): {
  puedeContinuar: boolean;
  requisitos: RequisitoConsignacion[];
} {
  const requisitos: RequisitoConsignacion[] = [
    {
      id: 'medio',
      label: 'Método de pago válido',
      descripcion: 'Necesario para cubrir comisiones y eventuales costos.',
      cumplido: true,
      obligatorio: true,
    },
    {
      id: 'cuenta',
      label: 'Cuenta bancaria para cobrar',
      descripcion: 'Donde recibís la liquidación cuando se venda el bien.',
      cumplido: true,
      obligatorio: true,
    },
    {
      id: 'documentacion',
      label: 'Comprobante de origen',
      descripcion: 'Opcional al inicio. La empresa puede pedirlo más adelante.',
      cumplido: false,
      obligatorio: false,
    },
  ];
  const puedeContinuar = requisitos
    .filter(r => r.obligatorio)
    .every(r => r.cumplido);
  return { puedeContinuar, requisitos };
}

export function crearConsignacion(datos: DatosBien): ResultadoConsignacion {
  if (!datos.titulo.trim()) {
    return {
      ok: false,
      error: {
        codigo: 400,
        tipo: 'DATOS_INCOMPLETOS',
        mensaje: 'Ingresá un título para el bien.',
      },
    };
  }
  if (datos.cantidadFotos < MIN_FOTOS_CONSIGNACION) {
    return {
      ok: false,
      error: {
        codigo: 422,
        tipo: 'FOTOS_INSUFICIENTES',
        mensaje: `Cargá al menos ${MIN_FOTOS_CONSIGNACION} fotos del bien.`,
      },
    };
  }

  _seq += 1;
  const id = `c_${_seq}`;
  const codigo = `#CONS-2026-00${860 + (_seq - 100)}`;
  _nuevas[id] = {
    id,
    codigo,
    nombre: datos.titulo,
    segmento: datos.categoria,
    moneda: 'ARS',
    precioBase: 0,
    estado: 'en_validacion',
    fecha: 'recién',
  };
  return { ok: true, id, codigo, nuevoEstado: 'en_validacion' };
}

export function getConsignacionDetalle(id: string): ConsignacionDetalle | null {
  const nueva = _nuevas[id];
  if (nueva) {
    const estado = _estadoOverride[id] ?? nueva.estado;
    return { ...nueva, estado, etapas: construirEtapas(estado) };
  }
  const base = DETALLES[id];
  if (!base) return null;
  const estado = _estadoOverride[id] ?? base.estado;
  return {
    ...base,
    estado,
    etapas: construirEtapas(estado, base.rechazoEnEtapa, base.motivoRechazo),
  };
}

export function aceptarAcuerdo(id: string): ResultadoConsignacion {
  const det = getConsignacionDetalle(id);
  if (!det) {
    return {
      ok: false,
      error: {
        codigo: 404,
        tipo: 'NO_ENCONTRADA',
        mensaje: 'No encontramos la consignación.',
      },
    };
  }
  if (det.estado !== 'acuerdo_pendiente') {
    return {
      ok: false,
      error: {
        codigo: 409,
        tipo: 'SIN_ACUERDO_PENDIENTE',
        mensaje: 'Esta consignación no tiene un acuerdo pendiente.',
      },
    };
  }
  _estadoOverride[id] = 'acuerdo_aceptado';
  return { ok: true, id, nuevoEstado: 'acuerdo_aceptado' };
}

export function rechazarAcuerdo(id: string): ResultadoConsignacion {
  const det = getConsignacionDetalle(id);
  if (!det) {
    return {
      ok: false,
      error: {
        codigo: 404,
        tipo: 'NO_ENCONTRADA',
        mensaje: 'No encontramos la consignación.',
      },
    };
  }
  if (det.estado !== 'acuerdo_pendiente') {
    return {
      ok: false,
      error: {
        codigo: 409,
        tipo: 'SIN_ACUERDO_PENDIENTE',
        mensaje: 'Esta consignación no tiene un acuerdo pendiente.',
      },
    };
  }
  _estadoOverride[id] = 'devolucion_pendiente';
  return { ok: true, id, nuevoEstado: 'devolucion_pendiente' };
}
