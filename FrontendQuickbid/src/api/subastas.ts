import { apiFetch } from './client';
import {
  CatalogoApi,
  InscripcionSubastaApi,
  ItemApi,
  PageApi,
  SubastaApiDetalle,
  SubastaApiResumen,
  SubastaListParams,
  VerificacionSubastaApi,
} from '../types/subastaApi';

function requiredData<T>(data: T | null, message: string): T {
  if (data === null) throw new Error(message);
  return data;
}

function queryString(params: SubastaListParams) {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined,
  );
  if (entries.length === 0) return '';
  return `?${entries
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&')}`;
}

export const subastasApi = {
  async listar(params: SubastaListParams = {}) {
    const response = await apiFetch<PageApi<SubastaApiResumen>>(
      `/api/subastas${queryString(params)}`,
    );
    return requiredData(
      response.data,
      'El servidor no devolvió el listado de subastas',
    );
  },

  async detalle(id: number) {
    const response = await apiFetch<SubastaApiDetalle>(`/api/subastas/${id}`);
    return requiredData(
      response.data,
      'El servidor no devolvió el detalle de la subasta',
    );
  },

  async catalogo(id: number) {
    const response = await apiFetch<CatalogoApi>(
      `/api/subastas/${id}/catalogo`,
    );
    return requiredData(response.data, 'El servidor no devolvió el catálogo');
  },

  async item(id: number) {
    const response = await apiFetch<ItemApi>(`/api/items/${id}`);
    return requiredData(
      response.data,
      'El servidor no devolvió el detalle del lote',
    );
  },

  async verificarAcceso(id: number) {
    const response = await apiFetch<VerificacionSubastaApi>(
      `/api/subastas/${id}/verificacion`,
      {
        method: 'POST',
      },
    );
    return requiredData(
      response.data,
      'El servidor no devolvió la verificación de acceso',
    );
  },

  async inscribirse(id: number, medioPagoId: number) {
    const response = await apiFetch<InscripcionSubastaApi>(
      `/api/subastas/${id}/inscribirse`,
      {
        method: 'POST',
        body: JSON.stringify({ medioPagoId }),
      },
    );
    return requiredData(
      response.data,
      'El servidor no devolvió la inscripción',
    );
  },
};
