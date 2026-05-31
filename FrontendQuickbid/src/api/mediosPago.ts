import { apiFetch } from './client';

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface MedioPagoData {
  id: number;
  tipo: string;
  marca: string | null;
  datosEnmascarados: string;
  titular: string | null;
  moneda: string;
  estado: string;
  esPrincipal: boolean;
}

export interface CrearTarjetaPayload {
  tipo: 'tarjeta_credito' | 'tarjeta_debito';
  moneda: 'ARS' | 'USD';
  nombreTitular: string;
  numeroTarjeta: string;
  vencimiento: string;
  cvv: string;
  nacional: boolean;
}

export interface CrearCuentaPayload {
  tipo: 'cuenta_bancaria';
  moneda: 'ARS' | 'USD';
  numeroCuenta: string;
  nombreBanco: string;
  alias?: string;
  nacional: boolean;
}

export interface CrearChequePayload {
  numeroCheque: string;
  monto: number;
  fechaVencimiento: string; // YYYY-MM-DD
  fotoAnverso: { uri: string; name: string; type: string };
  fotoReverso: { uri: string; name: string; type: string };
}

// ── Endpoints ──────────────────────────────────────────────────────────────

export const mediosPagoApi = {

  /** GET /api/usuario/medios-pago */
  listar: () =>
    apiFetch<{ medios: MedioPagoData[] }>('/api/usuario/medios-pago'),

  /** POST /api/usuario/medios-pago (tarjeta o cuenta — JSON) */
  crear: (payload: CrearTarjetaPayload | CrearCuentaPayload) =>
    apiFetch<{ id: number; estado: string }>('/api/usuario/medios-pago', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** DELETE /api/usuario/medios-pago/{id} */
  eliminar: (id: number) =>
    apiFetch(`/api/usuario/medios-pago/${id}`, { method: 'DELETE' }),

  /** PATCH /api/usuario/medios-pago/{id}/principal */
  marcarPrincipal: (id: number) =>
    apiFetch(`/api/usuario/medios-pago/${id}/principal`, { method: 'PATCH' }),

  /** POST /api/usuario/medios-pago — multipart (cheque con fotos) */
  crearCheque: (payload: CrearChequePayload) => {
    const form = new FormData();
    form.append('tipo',             'cheque');
    form.append('moneda',           'ARS');
    form.append('numeroCheque',     payload.numeroCheque);
    form.append('monto',            String(payload.monto));
    form.append('fechaVencimiento', payload.fechaVencimiento);
    form.append('fotoAnverso', { uri: payload.fotoAnverso.uri, name: payload.fotoAnverso.name, type: payload.fotoAnverso.type } as any);
    form.append('fotoReverso', { uri: payload.fotoReverso.uri, name: payload.fotoReverso.name, type: payload.fotoReverso.type } as any);
    return apiFetch<{ id: number; estado: string }>('/api/usuario/medios-pago', {
      method: 'POST',
      body: form as any,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
