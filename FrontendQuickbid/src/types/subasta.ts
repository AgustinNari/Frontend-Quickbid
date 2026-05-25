/**
 * Tipos relacionados a subastas.
 *
 * Refleja la respuesta esperada de `GET /api/subastas` y `GET /api/subastas/{id}`
 * según el contrato definido en `Material/Endpoints.docx`.
 *
 * Cuando se conecte al backend real, estos tipos van a ser la fuente de verdad
 * para validar respuestas (idealmente con zod / valibot más adelante).
 */

// ── Enums / literales ────────────────────────────────────────────────────────

/** Estado de la subasta en su ciclo de vida. */
export type SubastaEstado = 'activa' | 'proxima' | 'finalizada';

/** Categoría requerida para participar (controla quién puede pujar). */
export type SubastaCategoria = 'comun' | 'especial' | 'plata' | 'oro' | 'platino';

/** Segmento / temática del catálogo. Lista preliminar — puede crecer. */
export type SubastaSegmento =
  | 'arte'
  | 'joyas'
  | 'vehiculos'
  | 'relojeria'
  | 'antiguedades'
  | 'diseno'
  | 'coleccion';

/** Moneda en la que se pujan los ítems. */
export type SubastaMoneda = 'ARS' | 'USD';

// ── Estructuras ──────────────────────────────────────────────────────────────

/**
 * Vista de subasta para el listado general.
 *
 * Es el shape de cada elemento de `GET /api/subastas`. Información reducida
 * suficiente para renderizar una card. El detalle completo (catálogo, reglas
 * de inscripción) viene en `Subasta` (futuro).
 */
export type SubastaResumen = {
  id: string;
  titulo: string;
  imagen?: string;
  estado: SubastaEstado;
  categoria: SubastaCategoria;
  segmento: SubastaSegmento;
  moneda: SubastaMoneda;
  /** ISO 8601 — fecha de inicio (importante para subastas próximas). */
  fechaInicio: string;
  ubicacion: string;
  rematador: string;
  /** Cantidad de lotes/ítems en el catálogo. */
  cantidadItems?: number;
};

/**
 * Filtros disponibles para `GET /api/subastas`.
 * Cualquier campo opcional ausente equivale a "sin filtro".
 */
export type SubastaFiltros = {
  estado?: SubastaEstado;
  segmento?: SubastaSegmento;
  categoria?: SubastaCategoria;
  moneda?: SubastaMoneda;
  /** Texto libre para buscar por título / rematador. (Cliente-side por ahora.) */
  query?: string;
};

// ── Mapeos de presentación ───────────────────────────────────────────────────

/** Labels en español para mostrar en UI. */
export const SEGMENTO_LABEL: Record<SubastaSegmento, string> = {
  arte: 'Arte',
  joyas: 'Joyas',
  vehiculos: 'Vehículos',
  relojeria: 'Relojería',
  antiguedades: 'Antigüedades',
  diseno: 'Diseño',
  coleccion: 'Colección',
};

export const CATEGORIA_LABEL: Record<SubastaCategoria, string> = {
  comun: 'Común',
  especial: 'Especial',
  plata: 'Plata',
  oro: 'Oro',
  platino: 'Platino',
};

export const ESTADO_LABEL: Record<SubastaEstado, string> = {
  activa: 'EN VIVO',
  proxima: 'PRÓXIMA',
  finalizada: 'FINALIZADA',
};
