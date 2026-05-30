import { SubastaCategoria } from './subasta';

/**
 * Tipos relacionados al usuario actual de la app.
 *
 * El concepto de "categoria" del usuario comparte el mismo set de valores que
 * la categoria de una subasta (`SubastaCategoria`): comun < especial < plata <
 * oro < platino. Se reexporta como alias `Categoria` para que en los call sites
 * quede claro a quien pertenece (usuario vs requerida por la subasta).
 *
 * Cuando este el backend real, este tipo va a venir de `GET /api/usuario/perfil`.
 */

export type Categoria = SubastaCategoria;

/**
 * Orden jerarquico de categorias. Cuanto mayor el numero, mas privilegios.
 * Se usa para validar el acceso a inscripciones / pujas.
 */
export const CATEGORIA_ORDER: Record<Categoria, number> = {
  comun: 0,
  especial: 1,
  plata: 2,
  oro: 3,
  platino: 4,
};

/**
 * True si la categoria del usuario alcanza para inscribirse en una subasta de
 * categoria dada. Refleja la regla del dominio: "la categoria del usuario debe
 * ser mayor o igual a la categoria de la subasta".
 */
export function puedeInscribirsePorCategoria(
  userCat: Categoria,
  subastaCat: SubastaCategoria,
): boolean {
  return CATEGORIA_ORDER[userCat] >= CATEGORIA_ORDER[subastaCat];
}

/**
 * Datos del usuario actual cargado en sesion.
 *
 * Hoy es un mock estatico (ver `src/mocks/usuarioActual.ts`). Cuando exista
 * sesion real, esto va a venir de un store global hidratado con el endpoint
 * de perfil.
 */
export type UsuarioActual = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  categoria: Categoria;
  /** True si el usuario tiene una multa pendiente que le bloquea participar. */
  multaActiva: boolean;
};
