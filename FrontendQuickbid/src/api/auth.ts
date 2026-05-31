import { apiFetch } from './client';

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  email: string;
  nombre: string;
  apellido: string;
}

// ── Endpoints ──────────────────────────────────────────────────────────────

export const authApi = {

  /** POST /api/auth/registro/etapa1 — datos personales */
  etapa1: (data: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    domicilio: string;
  }) =>
    apiFetch('/api/auth/registro/etapa1', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** POST /api/auth/registro/etapa2 — foto del DNI */
  etapa2: (data: { email: string; fotoDni: string }) =>
    apiFetch('/api/auth/registro/etapa2', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** POST /api/auth/registro/verificar-token */
  verificarToken: (token: string) =>
    apiFetch('/api/auth/registro/verificar-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  /** POST /api/auth/registro/etapa3 — crear clave */
  etapa3: (data: { email: string; clave: string }) =>
    apiFetch('/api/auth/registro/etapa3', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** POST /api/auth/registro/reenviar-link */
  reenviarLink: (email: string) =>
    apiFetch('/api/auth/registro/reenviar-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  /** POST /api/auth/login */
  login: (email: string, clave: string) =>
    apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, clave }),
    }),

  /** POST /api/auth/recuperar-clave */
  recuperarClave: (email: string) =>
    apiFetch('/api/auth/recuperar-clave', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  /** PUT /api/auth/cambiar-clave */
  cambiarClave: (token: string, nuevaClave: string) =>
    apiFetch('/api/auth/cambiar-clave', {
      method: 'PUT',
      body: JSON.stringify({ token, nuevaClave }),
    }),
};
