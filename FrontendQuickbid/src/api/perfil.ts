import { apiFetch } from './client';

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface PerfilData {
  email: string;
  nombre: string;
  iniciales: string;
  categoria: string;
  reputacionPostor: number;
  puntajeAcumulado: number;
}

export interface EstadisticasData {
  periodo: string;
  totalPujado: number;
  porcentajeExito: number;
  totalPagado: number;
  serieHistorica: { etiqueta: string; valor: number }[];
}

export interface HistorialData {
  total: number;
  page: number;
  limit: number;
  items: unknown[];
}

// ── Endpoints ──────────────────────────────────────────────────────────────

export const perfilApi = {

  /** GET /api/usuario/perfil */
  getPerfil: () =>
    apiFetch<PerfilData>('/api/usuario/perfil'),

  /** GET /api/usuario/estadisticas?periodo=mes|trimestre|anual */
  getEstadisticas: (periodo: 'mes' | 'trimestre' | 'anual' = 'mes') =>
    apiFetch<EstadisticasData>(`/api/usuario/estadisticas?periodo=${periodo}`),

  /** GET /api/usuario/historial?page=1&limit=20 */
  getHistorial: (page = 1, limit = 20) =>
    apiFetch<HistorialData>(`/api/usuario/historial?page=${page}&limit=${limit}`),
};
