import {
  canMedioPagoCoverAmount,
  getMedioPagoLimitUsage,
  MedioPagoDto,
} from '../src/types/mediosPago';
import { formatPaymentMethodLabel } from '../src/utils/displayLabels';

const NOW = Date.parse('2026-06-21T12:00:00.000Z');

function medio(overrides: Partial<MedioPagoDto> = {}): MedioPagoDto {
  return {
    id: 1,
    tipo: 'tarjeta',
    moneda: 'ARS',
    estado: 'verificado',
    principal: true,
    aliasVisible: 'Visa 4242',
    ultimos4: '4242',
    banco: null,
    saldoGarantia: null,
    limiteMonto: 500000,
    limiteUsado: 25100,
    limiteDisponible: 474900,
    verificadoHasta: '2026-06-28T12:00:00.000Z',
    createdAt: '2026-01-01T12:00:00.000Z',
    ...overrides,
  };
}

describe('payment method limit usage', () => {
  test('does not duplicate the last four digits already present in the alias', () => {
    expect(formatPaymentMethodLabel(medio())).toBe('Visa 4242');
    expect(
      formatPaymentMethodLabel(medio({ aliasVisible: 'Visa', ultimos4: '4242' })),
    ).toBe('Visa - termina en 4242');
  });

  test('returns used, total, available and progress for a validated limit', () => {
    expect(getMedioPagoLimitUsage(medio(), NOW)).toEqual({
      total: 500000,
      used: 25100,
      available: 474900,
      progress: 25100 / 500000,
    });
  });

  test.each([
    { estado: 'pendiente_verificacion' },
    { limiteMonto: null, limiteUsado: null, limiteDisponible: null },
    { verificadoHasta: '2026-06-20T12:00:00.000Z' },
  ] satisfies Partial<MedioPagoDto>[])(
    'does not expose usage for unvalidated, null or expired limits: %o',
    overrides => {
      expect(getMedioPagoLimitUsage(medio(overrides), NOW)).toBeNull();
    },
  );

  test('never produces negative usage or availability on inconsistent data', () => {
    expect(
      getMedioPagoLimitUsage(
        medio({ limiteUsado: -50, limiteDisponible: -10 }),
        NOW,
      ),
    ).toEqual({ total: 500000, used: 0, available: 0, progress: 0 });
  });

  test('falls back to total minus available when used is absent', () => {
    expect(
      getMedioPagoLimitUsage(
        medio({ limiteUsado: null, limiteDisponible: 400000 }),
        NOW,
      )?.used,
    ).toBe(100000);
  });

  test('requires a finite sufficient limit instead of treating null as unlimited', () => {
    expect(canMedioPagoCoverAmount(medio(), 474900, NOW)).toBe(true);
    expect(canMedioPagoCoverAmount(medio(), 474901, NOW)).toBe(false);
    expect(
      canMedioPagoCoverAmount(
        medio({ limiteMonto: null, limiteUsado: null, limiteDisponible: null }),
        1,
        NOW,
      ),
    ).toBe(false);
  });

  test('also requires enough guarantee for certified cheques', () => {
    expect(
      canMedioPagoCoverAmount(
        medio({ tipo: 'cheque_certificado', saldoGarantia: 2000 }),
        2001,
        NOW,
      ),
    ).toBe(false);
  });
});
