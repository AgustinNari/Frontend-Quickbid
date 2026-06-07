import { apiFetch } from './client';
import {
  CompraDetalleDto,
  CompraEntregaDto,
  CompraEstadoBackend,
  CompraResumenDto,
  ConfigurarEntregaRequest,
  DocumentoCompraDto,
  PageDto,
  PagoCompraDto,
  PagoCompraRequest,
} from '../types/compraApi';

function required<T>(data: T | null, message: string): T {
  if (data === null) throw new Error(message);
  return data;
}

export function createIdempotencyKey(prefix: string) {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${random}`;
}

export const comprasApi = {
  async listar(params: { page?: number; size?: number; estado?: CompraEstadoBackend } = {}) {
    const query = [
      `page=${params.page ?? 0}`,
      `size=${params.size ?? 20}`,
      params.estado ? `estado=${encodeURIComponent(params.estado)}` : null,
    ].filter(Boolean).join('&');

    return required(
      (await apiFetch<PageDto<CompraResumenDto>>(`/api/compras?${query}`)).data,
      'El servidor no devolvio compras',
    );
  },

  async detalle(id: number) {
    return required(
      (await apiFetch<CompraDetalleDto>(`/api/compras/${id}`)).data,
      'El servidor no devolvio la compra',
    );
  },

  async configurarEntrega(id: number, payload: ConfigurarEntregaRequest) {
    return required(
      (await apiFetch<CompraEntregaDto>(`/api/compras/${id}/entrega`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })).data,
      'El servidor no devolvio la entrega',
    );
  },

  async pagar(id: number, payload: PagoCompraRequest) {
    return required(
      (await apiFetch<PagoCompraDto>(`/api/compras/${id}/pagar`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })).data,
      'El servidor no devolvio el pago',
    );
  },

  async pagarConMulta(id: number, payload: PagoCompraRequest) {
    return required(
      (await apiFetch<PagoCompraDto>(`/api/compras/${id}/pagar-con-multa`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })).data,
      'El servidor no devolvio el pago',
    );
  },

  async documentos(id: number) {
    return required(
      (await apiFetch<DocumentoCompraDto[]>(`/api/compras/${id}/documentos`)).data,
      'El servidor no devolvio documentos',
    );
  },
};
