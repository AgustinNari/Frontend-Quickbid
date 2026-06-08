import { SubastaMoneda } from '../types/subasta';

export function formatPrecio(monto: number, moneda: SubastaMoneda): string {
  const entero = Math.trunc(Math.abs(monto));
  const sep = entero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const signo = monto < 0 ? '-' : '';
  return `${moneda} ${signo}${sep}`;
}
