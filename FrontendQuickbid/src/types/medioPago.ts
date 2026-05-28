import { SubastaMoneda } from './subasta';

/**
 * Tipos del dominio de medios de pago.
 *
 * Refleja el shape esperado de `GET /api/usuario/medios-pago` segun el
 * contrato definido en `Material/Endpoints.docx`. Cada medio queda asociado
 * a una moneda especifica — esto importa para inscribirse a una subasta,
 * porque la moneda del medio tiene que coincidir con la de la subasta
 * (sino el backend responde 422).
 */

export type MedioPagoTipo = 'tarjeta' | 'cuenta_bancaria' | 'cheque_certificado';

export type MedioPagoEstado = 'activo' | 'pendiente_validacion' | 'vencido';

export type MedioPago = {
  id: string;
  tipo: MedioPagoTipo;
  /** Etiqueta legible para mostrar: "Visa Signature", "Banco Galicia ARS", etc. */
  etiqueta: string;
  /** Ultimos 4 digitos cuando aplica (tarjetas y cuentas). Undefined para cheques. */
  ultimos4?: string;
  /** Fecha de vencimiento "YYYY-MM" (solo tarjetas). */
  vencimiento?: string;
  moneda: SubastaMoneda;
  estado: MedioPagoEstado;
  /** True si esta marcado como medio principal del usuario. */
  principal?: boolean;
};

/** Labels en espanol para mostrar tipo de medio en UI. */
export const MEDIO_PAGO_TIPO_LABEL: Record<MedioPagoTipo, string> = {
  tarjeta: 'Tarjeta',
  cuenta_bancaria: 'Cuenta bancaria',
  cheque_certificado: 'Cheque certificado',
};

/** Labels en espanol para mostrar estado de validacion en UI. */
export const MEDIO_PAGO_ESTADO_LABEL: Record<MedioPagoEstado, string> = {
  activo: 'Validado',
  pendiente_validacion: 'Pendiente de validación',
  vencido: 'Vencido',
};
