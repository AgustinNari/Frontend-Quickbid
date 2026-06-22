import { DireccionEnvioDto } from '../types/direcciones';

type PaymentLabelSource = {
  aliasVisible: string;
  ultimos4?: string | null;
  tipo?: string;
  moneda?: string;
  estado?: string;
};

export function formatPaymentMethodLabel(value: PaymentLabelSource) {
  const alias = value.aliasVisible.trim();
  const last4 = value.ultimos4?.trim();
  const aliasDigits = alias.replace(/\D/g, '');
  const suffix =
    last4 && !aliasDigits.endsWith(last4) ? ` - termina en ${last4}` : '';
  return `${alias}${suffix}`;
}

export function formatPaymentMethodDetail(value: PaymentLabelSource) {
  return [
    paymentMethodTypeLabel(value.tipo),
    value.moneda,
    value.estado ? humanizeLabel(value.estado) : null,
  ]
    .filter(Boolean)
    .join(' - ');
}

export function formatAddressLabel(value: DireccionEnvioDto) {
  return `${value.calle} ${value.numero}, ${value.localidad}, ${value.provincia}`;
}

export function paymentMethodTypeLabel(tipo?: string) {
  if (tipo === 'cuenta_bancaria') return 'Cuenta bancaria';
  if (tipo === 'cheque_certificado') return 'Cheque certificado';
  if (tipo === 'tarjeta') return 'Tarjeta';
  return tipo ? humanizeLabel(tipo) : null;
}

export function humanizeLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/^./, first => first.toUpperCase());
}
