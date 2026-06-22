export type TipoMedioPago =
  | 'tarjeta'
  | 'cuenta_bancaria'
  | 'cheque_certificado';
export type EstadoMedioPago =
  | 'pendiente_verificacion'
  | 'verificado'
  | 'rechazado'
  | 'vencido'
  | 'eliminado'
  | string;

export type MedioPagoDto = {
  id: number;
  tipo: TipoMedioPago;
  moneda: 'ARS' | 'USD';
  estado: EstadoMedioPago;
  principal: boolean;
  aliasVisible: string;
  ultimos4: string | null;
  banco: string | null;
  saldoGarantia: number | null;
  limiteMonto: number | null;
  limiteUsado: number | null;
  limiteDisponible: number | null;
  verificadoHasta: string | null;
  createdAt: string;
};

export function isMedioPagoVigente(
  medio: MedioPagoDto,
  now = Date.now(),
): boolean {
  if (medio.estado !== 'verificado' || !medio.verificadoHasta) return false;
  const verificadoHasta = Date.parse(medio.verificadoHasta);
  return !Number.isNaN(verificadoHasta) && verificadoHasta > now;
}

export type MedioPagoLimitUsage = {
  total: number;
  used: number;
  available: number;
  progress: number;
};

export function getMedioPagoLimitUsage(
  medio: MedioPagoDto,
  now = Date.now(),
): MedioPagoLimitUsage | null {
  if (!isMedioPagoVigente(medio, now)) return null;
  const total = finiteNumber(medio.limiteMonto);
  if (total == null || total <= 0) return null;

  const backendUsed = finiteNumber(medio.limiteUsado);
  const backendAvailable = finiteNumber(medio.limiteDisponible);
  const used = Math.max(
    0,
    backendUsed ??
      (backendAvailable == null ? Number.NaN : total - backendAvailable),
  );
  if (!Number.isFinite(used)) return null;
  const available = Math.max(
    0,
    backendAvailable ?? Math.max(0, total - used),
  );
  return {
    total,
    used,
    available,
    progress: Math.min(1, used / total),
  };
}

function finiteNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export type CrearTarjetaRequest = {
  tipo: 'tarjeta';
  moneda: 'ARS' | 'USD';
  nacional: boolean;
  titular: string;
  numeroTarjeta: string;
  cvv: string;
  vencimientoMes: number;
  vencimientoAnio: number;
  marca?: string;
};

export type CrearCuentaBancariaRequest = {
  tipo: 'cuenta_bancaria';
  moneda: 'ARS' | 'USD';
  nacional: boolean;
  titular: string;
  numeroCuenta?: string;
  cbuCvu?: string;
  nombreBanco: string;
  alias?: string;
};

export type ArchivoFormulario = { uri: string; name: string; type: string };

export type CrearChequeRequest = {
  moneda: 'ARS' | 'USD';
  nacional: boolean;
  titular: string;
  numeroCheque: string;
  monto: number;
  fechaVencimiento: string;
  bancoEmisor: string;
  fotoAnverso?: ArchivoFormulario;
  fotoReverso?: ArchivoFormulario;
};
