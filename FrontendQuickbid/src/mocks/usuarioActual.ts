import { UsuarioActual } from '../types/usuario';

/**
 * Usuario hardcodeado para desarrollo / demo sin backend.
 *
 * Categoria PLATA elegida a proposito para que la demo cubra tres casos al
 * mismo tiempo:
 *  - subastas comunes / especiales / plata → puede inscribirse.
 *  - subastas oro / platino → bloqueadas con "categoria insuficiente".
 *  - subastas ya inscriptas → boton "Ya estas inscripto".
 *
 * Cuando exista sesion real, este mock desaparece y los datos vienen del
 * store global hidratado por `GET /api/usuario/perfil`.
 */
export const MOCK_USUARIO_ACTUAL: UsuarioActual = {
  id: 'u_001',
  nombre: 'Lázaro',
  apellido: 'Casalla',
  email: 'lazaro.casalla@example.com',
  categoria: 'oro',
  multaActiva: false,
  quickbidId: '2024-LC',
  puntos: 1050,
  miembroDesde: 'marzo 2023',
};
