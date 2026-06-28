import { apiFetch } from './client';
import {
  CrearChequeRequest,
  CrearCuentaBancariaRequest,
  CrearTarjetaRequest,
  MedioPagoDto,
} from '../types/mediosPago';

function required<T>(data: T | null): T {
  if (data === null)
    throw new Error('El servidor no devolvió el medio de pago');
  return data;
}

export const mediosPagoApi = {
  async listar() {
    return required(
      (await apiFetch<MedioPagoDto[]>('/api/usuario/medios-pago')).data,
    );
  },
  async crear(payload: CrearTarjetaRequest | CrearCuentaBancariaRequest) {
    return required(
      (
        await apiFetch<MedioPagoDto>('/api/usuario/medios-pago', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      ).data,
    );
  },
  async crearCheque(payload: CrearChequeRequest) {
    const form = new FormData();
    form.append('moneda', payload.moneda);
    form.append('nacional', String(payload.nacional));
    form.append('titular', payload.titular);
    form.append('numeroCheque', payload.numeroCheque);
    form.append('monto', String(payload.monto));
    form.append('fechaVencimiento', payload.fechaVencimiento);
    form.append('bancoEmisor', payload.bancoEmisor);
    if (payload.fotoAnverso)
      form.append('fotoAnverso', payload.fotoAnverso as never);
    if (payload.fotoReverso)
      form.append('fotoReverso', payload.fotoReverso as never);
    return required(
      (
        await apiFetch<MedioPagoDto>('/api/usuario/medios-pago', {
          method: 'POST',
          body: form,
        })
      ).data,
    );
  },
  async eliminar(id: number) {
    await apiFetch(`/api/usuario/medios-pago/${id}`, { method: 'DELETE' });
  },
  async marcarPrincipal(id: number) {
    return required(
      (
        await apiFetch<MedioPagoDto>(
          `/api/usuario/medios-pago/${id}/principal`,
          { method: 'PATCH' },
        )
      ).data,
    );
  },
};
