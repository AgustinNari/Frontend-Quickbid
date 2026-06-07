export type TipoMedioPago = 'tarjeta' | 'cuenta_bancaria' | 'cheque_certificado';
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
  verificadoHasta: string | null;
  createdAt: string;
};

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
