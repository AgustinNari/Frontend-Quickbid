import { apiFetch } from './client';
import { CatalogoPage, PaisCatalogo } from '../types/catalogos';

function required<T>(data: T | null, message: string): T {
  if (data === null) throw new Error(message);
  return data;
}

export const catalogosApi = {
  async buscarPaises(q = '', page = 0, size = 50) {
    const query = [
      q.trim() ? `q=${encodeURIComponent(q.trim())}` : null,
      `page=${page}`,
      `size=${size}`,
    ]
      .filter(Boolean)
      .join('&');

    const response = await apiFetch<CatalogoPage<PaisCatalogo>>(
      `/api/catalogos/paises?${query}`,
      { public: true },
    );
    return required(
      response.data,
      'El servidor no devolvió el catálogo de países',
    );
  },

  async obtenerPais(id: number) {
    const response = await apiFetch<PaisCatalogo>(
      `/api/catalogos/paises/${id}`,
      {
        public: true,
      },
    );
    return required(response.data, 'El servidor no devolvió el país');
  },
};
