import { SubastaMoneda } from '../types/subasta';

/**
 * Formatea un monto entero con separador de miles "." al estilo es-AR.
 *
 * No usa `Intl.NumberFormat` para evitar dependencia de la build de Hermes
 * con full ICU (en algunos targets de Android la build viene sin tablas de
 * localización y `Intl.NumberFormat` cae en el formato del runtime, que es
 * impredecible). Descarta la parte fraccional.
 */
export function formatPrecio(monto: number, moneda: SubastaMoneda): string {
  const entero = Math.trunc(Math.abs(monto));
  const sep = entero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const signo = monto < 0 ? '-' : '';
  return `${moneda} ${signo}${sep}`;
}
