import { apiFetch } from './client';
import { CrearDireccionRequest, DireccionEnvioDto } from '../types/direcciones';

function required<T>(data: T | null): T {
  if (data === null) throw new Error('El servidor no devolvio la direccion');
  return data;
}

export const direccionesApi = {
  async listar() {
    return required(
      (await apiFetch<DireccionEnvioDto[]>('/api/usuario/direcciones-envio'))
        .data,
    );
  },
  async crear(payload: CrearDireccionRequest) {
    return required(
      (
        await apiFetch<DireccionEnvioDto>('/api/usuario/direcciones-envio', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      ).data,
    );
  },
  async eliminar(id: number) {
    await apiFetch(`/api/usuario/direcciones-envio/${id}`, {
      method: 'DELETE',
    });
  },
  async marcarPrincipal(id: number) {
    return required(
      (
        await apiFetch<DireccionEnvioDto>(
          `/api/usuario/direcciones-envio/${id}/principal`,
          { method: 'PATCH' },
        )
      ).data,
    );
  },
};
