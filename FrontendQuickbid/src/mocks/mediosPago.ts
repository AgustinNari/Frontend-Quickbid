import { MedioPago } from '../types/medioPago';
import { SubastaMoneda } from '../types/subasta';

/**
 * Medios de pago del usuario actual para desarrollo / demo sin backend.
 *
 * Se mockean 5 medios variados a proposito para cubrir todos los casos del
 * flujo de inscripcion:
 *  - tarjetas en ambas monedas (USD y ARS)
 *  - cuentas bancarias en ambas monedas
 *  - un cheque pendiente de validacion (no deberia poder usarse para inscripcion)
 *
 * Cuando exista backend, este archivo desaparece y la lista viene de
 * `GET /api/usuario/medios-pago`.
 */
export const MOCK_MEDIOS_PAGO: MedioPago[] = [
  {
    id: 'mp_001',
    tipo: 'tarjeta',
    etiqueta: 'Visa Signature',
    ultimos4: '1009',
    vencimiento: '2027-08',
    moneda: 'USD',
    estado: 'activo',
    principal: true,
  },
  {
    id: 'mp_002',
    tipo: 'tarjeta',
    etiqueta: 'Mastercard Black',
    ultimos4: '4421',
    vencimiento: '2026-11',
    moneda: 'ARS',
    estado: 'activo',
  },
  {
    id: 'mp_003',
    tipo: 'cuenta_bancaria',
    etiqueta: 'Banco Galicia',
    ultimos4: '8732',
    moneda: 'ARS',
    estado: 'activo',
  },
  {
    id: 'mp_004',
    tipo: 'cuenta_bancaria',
    etiqueta: 'Citi Private Bank',
    ultimos4: '0451',
    moneda: 'USD',
    estado: 'activo',
  },
  {
    id: 'mp_005',
    tipo: 'cheque_certificado',
    etiqueta: 'Cheque certificado #04582',
    moneda: 'USD',
    estado: 'pendiente_validacion',
  },
];

/**
 * Devuelve los medios de pago utilizables para inscribirse a una subasta.
 *
 * Filtra:
 *  - solo medios `activo` (los pendientes/vencidos no se pueden usar).
 *  - si se pasa una moneda, deja solo los compatibles con esa moneda.
 */
export function getMediosPagoUtilizables(moneda?: SubastaMoneda): MedioPago[] {
  let lista = MOCK_MEDIOS_PAGO.filter((m) => m.estado === 'activo');
  if (moneda) lista = lista.filter((m) => m.moneda === moneda);
  return lista;
}

/** Devuelve un medio de pago por id, o null si no existe. */
export function getMedioPagoById(id: string): MedioPago | null {
  return MOCK_MEDIOS_PAGO.find((m) => m.id === id) ?? null;
}
