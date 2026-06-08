import { apiFetch } from './client';
import {
  EstadisticasUsuario,
  HistorialUsuarioItem,
  NotificacionUsuario,
  Pagina,
  PerfilUsuario,
  PeriodoEstadisticas,
} from '../types/usuario';

function requiredData<T>(data: T | null, message: string): T {
  if (data === null) throw new Error(message);
  return data;
}

function query(params: Record<string, string | number | boolean | undefined>) {
  const values = Object.entries(params).filter(
    ([, value]) => value !== undefined,
  );
  if (values.length === 0) return '';
  return `?${values
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&')}`;
}

export const usuarioApi = {
  async perfil() {
    const response = await apiFetch<PerfilUsuario>('/api/usuario/perfil');
    return requiredData(response.data, 'El servidor no devolvio el perfil');
  },

  async estadisticas(periodo: PeriodoEstadisticas) {
    const response = await apiFetch<EstadisticasUsuario>(
      `/api/usuario/estadisticas${query({ periodo })}`,
    );
    return requiredData(
      response.data,
      'El servidor no devolvio las estadisticas',
    );
  },

  async historial(page = 0, size = 20) {
    const response = await apiFetch<Pagina<HistorialUsuarioItem>>(
      `/api/usuario/historial${query({ page, size })}`,
    );
    return requiredData(response.data, 'El servidor no devolvio el historial');
  },

  async notificaciones(
    params: {
      tipo?: string;
      categoria?: string;
      leida?: boolean;
      page?: number;
      size?: number;
    } = {},
  ) {
    const response = await apiFetch<Pagina<NotificacionUsuario>>(
      `/api/usuario/notificaciones${query(params)}`,
    );
    return requiredData(
      response.data,
      'El servidor no devolvio las notificaciones',
    );
  },

  async marcarNotificacionLeida(id: number) {
    const response = await apiFetch<NotificacionUsuario>(
      `/api/usuario/notificaciones/${id}/leer`,
      { method: 'PATCH' },
    );
    return requiredData(
      response.data,
      'El servidor no devolvio la notificacion',
    );
  },

  async marcarTodasLeidas() {
    const response = await apiFetch<NotificacionUsuario[]>(
      '/api/usuario/notificaciones/all/leer',
      { method: 'PATCH' },
    );
    return requiredData(
      response.data,
      'El servidor no devolvio las notificaciones',
    );
  },
};
