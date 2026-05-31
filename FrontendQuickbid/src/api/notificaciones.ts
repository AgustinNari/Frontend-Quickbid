import { apiFetch } from './client';

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface NotificacionData {
  id: number;
  tipo: string;
  categoria: 'subastas' | 'transacciones';
  mensaje: string;
  leida: boolean;
  fechaCreacion: string;
  fechaLectura: string | null;
  referenciaId: number | null;
}

export interface NotificacionesListData {
  total: number;
  noLeidas: number;
  page: number;
  notificaciones: NotificacionData[];
}

// ── Endpoints ──────────────────────────────────────────────────────────────

export const notificacionesApi = {

  /** GET /api/usuario/notificaciones */
  listar: (params?: { categoria?: string; leidas?: boolean; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.categoria && params.categoria !== 'todo') q.set('categoria', params.categoria);
    if (params?.leidas !== undefined) q.set('leidas', String(params.leidas));
    if (params?.page) q.set('page', String(params.page));
    const qs = q.toString();
    return apiFetch<NotificacionesListData>(`/api/usuario/notificaciones${qs ? `?${qs}` : ''}`);
  },

  /** PATCH /api/usuario/notificaciones/{id}/leer — id puede ser un número o "all" */
  marcarLeida: (id: number | 'all') =>
    apiFetch(`/api/usuario/notificaciones/${id}/leer`, { method: 'PATCH' }),
};
