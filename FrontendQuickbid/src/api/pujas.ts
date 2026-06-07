import { apiFetch } from './client';
import {
  PujaActualApi,
  PujarRequestApi,
  PujarResponseApi,
} from '../types/puja';

function requiredData<T>(data: T | null, message: string): T {
  if (data === null) throw new Error(message);
  return data;
}

export function createBidIdempotencyKey() {
  const cryptoLike = globalThis as typeof globalThis & {
    crypto?: { randomUUID?: () => string };
  };
  const uuid = cryptoLike.crypto?.randomUUID?.();
  if (uuid) return uuid;

  const random = Math.random().toString(36).slice(2, 10);
  return `qb-bid-${Date.now()}-${random}`;
}

export const pujasApi = {
  async pujaActual(subastaId: number) {
    const response = await apiFetch<PujaActualApi>(`/api/subastas/${subastaId}/puja-actual`);
    return requiredData(response.data, 'El servidor no devolvio la puja actual');
  },

  async pujar(subastaId: number, payload: PujarRequestApi) {
    const response = await apiFetch<PujarResponseApi>(`/api/subastas/${subastaId}/pujar`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return requiredData(response.data, 'El servidor no devolvio el resultado de la puja');
  },
};
