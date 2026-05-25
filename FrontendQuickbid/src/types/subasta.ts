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

/**
 * Modalidad de participación en la subasta.
 *
 * - `virtual`: 100% online (puja en vivo desde la app).
 * - `presencial`: requiere asistencia en la sede del rematador.
 * - `mixta`: ambas opciones disponibles.
 */
export type SubastaModalidad = 'virtual' | 'presencial' | 'mixta';

/**
 * Estado de un ítem (lote) dentro del catálogo secuencial de una subasta.
 *
 * Refleja el ciclo de vida dentro de la jornada de remate.
 */
export type ItemEstado = 'pendiente' | 'en_vivo' | 'vendido' | 'no_vendido';

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
 * Detalle completo de una subasta.
 *
 * Shape de `GET /api/subastas/{id}`. Hereda todos los campos del resumen y suma
 * la información adicional necesaria para la pantalla de detalle:
 *  - Descripción / sinopsis larga.
 *  - Modalidad (virtual / presencial / mixta).
 *  - Subtítulo o tagline (ej. "Arte Contemporáneo y Mobiliario de Lujo").
 *  - Zona horaria mostrada para la fecha (ej. "GMT-3").
 *  - Flag de inscripción del usuario actual (cuando el backend esté listo, va
 *    a venir derivado de la sesión; por ahora lo simulamos en el mock).
 */
export type SubastaDetalle = SubastaResumen & {
  subtitulo?: string;
  descripcion?: string;
  modalidad: SubastaModalidad;
  /** Zona horaria mostrada al usuario (ej. "GMT-3"). Solo para presentación. */
  zonaHoraria?: string;
  /** Si true, el usuario actual ya se inscribió y puede entrar a pujar. */
  inscripto?: boolean;
};

/**
 * Ítem (lote) del catálogo de una subasta.
 *
 * Shape de cada elemento de `GET /api/subastas/{id}/catalogo`. Cuando el
 * usuario es invitado, `precioBase` viene omitido (acá lo modelamos como
 * opcional para soportar ambos casos sin duplicar tipos).
 */
export type ItemCatalogo = {
  id: string;
  subastaId: string;
  /** Número de lote tal como se muestra (ej. "#042"). */
  lote: string;
  titulo: string;
  autor?: string;
  estado: ItemEstado;
  /** Precio base sugerido. Omitido para invitados. */
  precioBase?: number;
  moneda: SubastaMoneda;
  imagen?: string;
  /** Hereda el segmento de la subasta — usado para el placeholder visual. */
  segmento: SubastaSegmento;
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

export const MODALIDAD_LABEL: Record<SubastaModalidad, string> = {
  virtual: 'Virtual',
  presencial: 'Presencial',
  mixta: 'Virtual y presencial',
};

export const ITEM_ESTADO_LABEL: Record<ItemEstado, string> = {
  pendiente: 'PRÓXIMO',
  en_vivo: 'EN VIVO',
  vendido: 'VENDIDO',
  no_vendido: 'NO VENDIDO',
};
