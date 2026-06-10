import { apiFetch } from './client';

export type EstadoCuenta =
  | 'activa'
  | 'restriccion_multa'
  | 'bloqueada_permanente';

export interface UsuarioSesion {
  id: number;
  email: string;
  nombre?: string;
  apellido?: string;
  categoria: string;
  puntos: number;
  estado?: EstadoCuenta;
}

export interface LoginRequest {
  email: string;
  clave: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  estadoCuenta: EstadoCuenta;
  usuario: UsuarioSesion;
}

export interface RefreshRequest {
  refreshToken: string;
}

export type RefreshResponse = LoginResponse;

export interface Etapa1Request {
  nombre: string;
  apellido: string;
  email: string;
  domicilioLegal: string;
  idPaisOrigen: number;
}

export interface Etapa1Response {
  idRegistro: number;
  siguientePaso: string;
}

export const authApi = {
  etapa1: (data: Etapa1Request) =>
    apiFetch<Etapa1Response>('/api/auth/registro/etapa1', {
      method: 'POST',
      body: JSON.stringify(data),
      public: true,
    }),

  etapa2: (
    email: string,
    fotoFrenteDni: { uri: string; name: string; type: string },
    fotoDorsoDni: { uri: string; name: string; type: string },
  ) => {
    const form = new FormData();
    form.append('email', email);
    form.append('fotoFrenteDni', fotoFrenteDni as unknown as string);
    form.append('fotoDorsoDni', fotoDorsoDni as unknown as string);
    return apiFetch('/api/auth/registro/etapa2', {
      method: 'POST',
      body: form as unknown as FormData,
      public: true,
    });
  },

  verificarToken: (token: string) =>
    apiFetch('/api/auth/registro/verificar-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
      public: true,
    }),

  etapa3: (data: {
    setupToken: string;
    claveNueva: string;
    claveConfirmacion: string;
  }) =>
    apiFetch<LoginResponse>('/api/auth/registro/etapa3', {
      method: 'POST',
      body: JSON.stringify({
        setup_token: data.setupToken,
        clave: data.claveNueva,
        claveConfirmacion: data.claveConfirmacion,
      }),
      public: true,
    }),

  reenviarLink: (email: string) =>
    apiFetch('/api/auth/registro/reenviar-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
      public: true,
    }),

  login: (request: LoginRequest) =>
    apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(request),
      public: true,
    }),

  refresh: (request: RefreshRequest) =>
    apiFetch<RefreshResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(request),
      public: true,
      skipRefresh: true,
    }),

  logout: (request: RefreshRequest) =>
    apiFetch('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify(request),
      public: true,
      skipRefresh: true,
    }),

  recuperarClave: (email: string) =>
    apiFetch('/api/auth/recuperar-clave', {
      method: 'POST',
      body: JSON.stringify({ email }),
      public: true,
    }),

  cambiarClave: (
    token: string,
    nuevaClave: string,
    claveConfirmacion: string,
  ) =>
    apiFetch('/api/auth/cambiar-clave', {
      method: 'PUT',
      body: JSON.stringify({
        token,
        claveNueva: nuevaClave,
        claveConfirmacion,
      }),
      public: true,
    }),

  cambiarClaveAutenticado: (
    claveActual: string,
    claveNueva: string,
    claveConfirmacion: string,
  ) =>
    apiFetch('/api/auth/cambiar-clave', {
      method: 'PUT',
      body: JSON.stringify({ claveActual, claveNueva, claveConfirmacion }),
    }),
};
