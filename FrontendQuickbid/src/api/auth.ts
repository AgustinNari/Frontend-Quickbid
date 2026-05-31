import { apiFetch } from './client';

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  email: string;
  nombre: string;
  categoria: string;
  estadoCuenta: string;
  requiereMedioPago: boolean;
  tieneMultasActivas: boolean;
}

export interface Etapa1Response {
  idRegistro: number;
  siguientePaso: string;
}

export interface VerificarTokenResponse {
  setupToken: string;
}

// ── Endpoints ──────────────────────────────────────────────────────────────

export const authApi = {

  /** POST /api/auth/registro/etapa1 — datos personales */
  etapa1: (data: {
    nombre: string;
    apellido: string;
    email: string;
    domicilioLegal: string;
    idPaisOrigen: number;
  }) =>
    apiFetch<Etapa1Response>('/api/auth/registro/etapa1', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * POST /api/auth/registro/etapa2 — fotos del DNI (multipart)
   * fotoFrenteDni y fotoDorsoDni son URIs de imagen locales del dispositivo.
   */
  etapa2: (email: string, fotoFrenteDni: { uri: string; name: string; type: string }, fotoDorsoDni: { uri: string; name: string; type: string }) => {
    const form = new FormData();
    form.append('email', email);
    // React Native trata los objetos { uri, name, type } como Blob para FormData
    form.append('fotoFrenteDni', fotoFrenteDni as unknown as string);
    form.append('fotoDorsoDni',  fotoDorsoDni  as unknown as string);
    return apiFetch('/api/auth/registro/etapa2', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
      body: form as unknown as string,
    });
  },

  /** POST /api/auth/registro/verificar-token */
  verificarToken: (token: string) =>
    apiFetch<VerificarTokenResponse>('/api/auth/registro/verificar-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  /** POST /api/auth/registro/etapa3 — crear clave con setupToken */
  etapa3: (data: { setupToken: string; clave: string; claveConfirmacion: string }) =>
    apiFetch<LoginResponse>('/api/auth/registro/etapa3', {
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

  /** POST /api/auth/cambiar-clave */
  cambiarClave: (token: string, nuevaClave: string, claveConfirmacion: string) =>
    apiFetch('/api/auth/cambiar-clave', {
      method: 'POST',
      body: JSON.stringify({ token, nuevaClave, claveConfirmacion }),
    }),
};
