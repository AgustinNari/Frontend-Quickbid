import { SubastaCategoria } from './subasta';

export type Categoria = SubastaCategoria;
export const CATEGORIA_ORDER: Record<Categoria, number> = {
  comun: 0,
  especial: 1,
  plata: 2,
  oro: 3,
  platino: 4,
};
export function puedeInscribirsePorCategoria(
  userCat: Categoria,
  subastaCat: SubastaCategoria,
) {
  return CATEGORIA_ORDER[userCat] >= CATEGORIA_ORDER[subastaCat];
}
export type UsuarioActual = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  categoria: Categoria;
  multaActiva: boolean;
  quickbidId?: string;
  puntos?: number;
  miembroDesde?: string;
};

export type PeriodoEstadisticas = 'mes' | 'trimestre' | 'anual' | 'total';

export type ProgresoCategoria = {
  categoriaActual: string;
  siguienteCategoria: string | null;
  puntosActuales: number;
  puntosSiguienteCategoria: number | null;
  puntosFaltantes: number;
  porcentaje: number;
};

export type PermisosUsuario = {
  puedeNavegar: boolean;
  puedePujar: boolean;
  puedeInscribirse: boolean;
  puedeConsignar: boolean;
  tieneRestriccionMulta: boolean;
};

export type PerfilUsuario = {
  cuentaId: number;
  nombre: string;
  apellido: string;
  email: string;
  categoria: string;
  puntos: number;
  progreso: ProgresoCategoria;
  estadoCuenta: string;
  estadoOperativo: string;
  permisos: PermisosUsuario;
};

export type ActividadMensual = {
  mes: string;
  pujas: number;
  compras: number;
};

export type MetricasComprador = {
  totalPujado: number;
  totalPagado: number;
  tasaExito: number;
  cantidadCompras: number;
  cantidadPujas: number;
  subastasParticipadas: number;
};

export type MetricasVendedor = {
  consignaciones: number;
  vendidas: number;
  liquidadas: number;
  totalLiquidado: number;
};

export type EstadisticasUsuario = MetricasComprador & {
  periodo: PeriodoEstadisticas;
  compradorPostor: MetricasComprador;
  vendedorConsignador: MetricasVendedor;
  actividadMensual: ActividadMensual[];
};

export type HistorialUsuarioItem = {
  tipo: 'puja' | 'compra' | string;
  subastaId: number;
  itemCatalogoId: number;
  productoId: number | null;
  monto: number;
  moneda: string;
  fecha: string;
  estado: string;
};

export type NotificacionUsuario = {
  id: number;
  tipo: string;
  titulo: string;
  descripcion: string;
  referenciaTipo: string | null;
  referenciaId: number | null;
  leida: boolean;
  createdAt: string;
};

export type Pagina<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
