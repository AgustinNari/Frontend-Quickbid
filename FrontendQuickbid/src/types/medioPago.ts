import { SubastaMoneda } from './subasta';

export type MedioPagoTipo = 'tarjeta' | 'cuenta_bancaria' | 'cheque_certificado';

export type MedioPagoEstado = 'activo' | 'pendiente_validacion' | 'vencido';

export type MedioPago = {
  id: string;
  tipo: MedioPagoTipo;
  etiqueta: string;
  ultimos4?: string;
  vencimiento?: string;
  moneda: SubastaMoneda;
  estado: MedioPagoEstado;
  principal?: boolean;
};

export const MEDIO_PAGO_TIPO_LABEL: Record<MedioPagoTipo, string> = {
  tarjeta: 'Tarjeta',
  cuenta_bancaria: 'Cuenta bancaria',
  cheque_certificado: 'Cheque certificado',
};

export const MEDIO_PAGO_ESTADO_LABEL: Record<MedioPagoEstado, string> = {
  activo: 'Validado',
  pendiente_validacion: 'Pendiente de validación',
  vencido: 'Vencido',
};
