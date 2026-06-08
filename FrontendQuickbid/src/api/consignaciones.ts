import { apiFetch } from './client';
import {
  ConsignacionDetalleDto,
  ConsignacionFiltro,
  ConsignacionPageDto,
  ConsignacionPagoDevolucionDto,
  ConsignacionDevolucionPreviewDto,
  ConsignacionRequisitosDto,
  ConsignacionResumenDto,
  ConsignacionDevolucionDto,
  AceptarAcuerdoRequest,
  CrearConsignacionRequest,
  PagarEnvioDevolucionRequest,
  SeleccionarDevolucionRequest,
  SubirDocumentacionOrigenRequest,
} from '../types/consignacionApi';

function required<T>(data: T | null, message: string): T {
  if (data === null) throw new Error(message);
  return data;
}

function appendFile(form: FormData, key: string, file?: { uri: string; name: string; type: string }) {
  if (!file) return;
  form.append(key, file as never);
}

export const consignacionesApi = {
  async requisitos() {
    return required(
      (await apiFetch<ConsignacionRequisitosDto>('/api/consignaciones/requisitos')).data,
      'El servidor no devolvio requisitos de consignacion',
    );
  },

  async crear(payload: CrearConsignacionRequest) {
    const form = new FormData();
    form.append('segmento', payload.segmento);
    if (payload.categoriaSubasta) form.append('categoriaSubasta', payload.categoriaSubasta);
    form.append('aceptaTyC', String(payload.aceptaTyC));
    form.append('declaracionPropiedadYOrigenLicito', String(payload.declaracionPropiedadYOrigenLicito));
    form.append('titulo', payload.titulo);
    form.append('descripcion', payload.descripcion);
    if (payload.historia) form.append('historia', payload.historia);
    if (payload.fechaAproximada) form.append('fechaAproximada', payload.fechaAproximada);
    form.append('esObraDeArte', String(Boolean(payload.esObraDeArte)));
    if (payload.autor) form.append('autor', payload.autor);
    if (payload.historiaExtendida) form.append('historiaExtendida', payload.historiaExtendida);
    payload.fotos.forEach(file => appendFile(form, 'fotos', file));

    return required(
      (await apiFetch<ConsignacionDetalleDto>('/api/consignaciones', {
        method: 'POST',
        body: form,
      })).data,
      'El servidor no devolvio la consignacion creada',
    );
  },

  async subirDocumentacionOrigen(id: number, payload: SubirDocumentacionOrigenRequest) {
    const form = new FormData();
    appendFile(form, 'facturaCompra', payload.facturaCompra);
    appendFile(form, 'certificadoAutenticidad', payload.certificadoAutenticidad);
    if (payload.observaciones) form.append('observaciones', payload.observaciones);

    return required(
      (await apiFetch<ConsignacionDetalleDto>(`/api/consignaciones/${id}/documentacion-origen`, {
        method: 'POST',
        body: form,
      })).data,
      'El servidor no devolvio la consignacion actualizada',
    );
  },

  async listar(params: { filtro?: ConsignacionFiltro; page?: number; size?: number } = {}) {
    const query = [
      params.filtro ? `filtro=${encodeURIComponent(params.filtro)}` : null,
      `page=${params.page ?? 0}`,
      `size=${params.size ?? 20}`,
    ].filter(Boolean).join('&');

    return required(
      (await apiFetch<ConsignacionPageDto<ConsignacionResumenDto>>(`/api/consignaciones?${query}`)).data,
      'El servidor no devolvio consignaciones',
    );
  },

  async detalle(id: number) {
    return required(
      (await apiFetch<ConsignacionDetalleDto>(`/api/consignaciones/${id}`)).data,
      'El servidor no devolvio la consignacion',
    );
  },

  async aceptarAcuerdo(id: number, payload: AceptarAcuerdoRequest) {
    return required(
      (await apiFetch<ConsignacionDetalleDto>(`/api/consignaciones/${id}/acuerdo/aceptar`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })).data,
      'El servidor no devolvio la consignacion actualizada',
    );
  },

  async rechazarAcuerdo(id: number) {
    return required(
      (await apiFetch<ConsignacionDetalleDto>(`/api/consignaciones/${id}/acuerdo/rechazar`, {
        method: 'POST',
      })).data,
      'El servidor no devolvio la consignacion actualizada',
    );
  },

  async seleccionarDevolucion(id: number, payload: SeleccionarDevolucionRequest) {
    return required(
      (await apiFetch<ConsignacionDevolucionDto>(`/api/consignaciones/${id}/devolucion`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })).data,
      'El servidor no devolvio la devolucion registrada',
    );
  },

  async previewDevolucion(id: number, payload: SeleccionarDevolucionRequest) {
    return required(
      (await apiFetch<ConsignacionDevolucionPreviewDto>(`/api/consignaciones/${id}/devolucion/preview`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })).data,
      'El servidor no devolvio la cotizacion de devolucion',
    );
  },

  async pagarEnvioDevolucion(id: number, payload: PagarEnvioDevolucionRequest) {
    return required(
      (await apiFetch<ConsignacionPagoDevolucionDto>(`/api/consignaciones/${id}/devolucion/pagar-envio`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })).data,
      'El servidor no devolvio el pago de devolucion',
    );
  },
};

export function createConsignacionIdempotencyKey(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
