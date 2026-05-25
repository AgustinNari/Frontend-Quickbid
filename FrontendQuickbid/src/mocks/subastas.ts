import {
  ItemCatalogo,
  ItemDetalle,
  SubastaDetalle,
  SubastaResumen,
} from '../types/subasta';

/**
 * Mock de subastas para desarrollo / demo sin backend.
 *
 * Cuando el backend esté listo, este archivo desaparece y los datos vienen de
 * `GET /api/subastas`, `GET /api/subastas/{id}` y `GET /api/subastas/{id}/catalogo`
 * vía TanStack Query.
 */

export const MOCK_SUBASTAS: SubastaResumen[] = [
  {
    id: 'sub_001',
    titulo: 'Colección Vanguardia',
    estado: 'activa',
    categoria: 'plata',
    segmento: 'arte',
    moneda: 'USD',
    fechaInicio: '2026-05-25T18:00:00Z',
    ubicacion: 'Grosvenor Square, Londres',
    rematador: 'Renata Centenario',
    cantidadItems: 10,
  },
  {
    id: 'sub_002',
    titulo: 'Joyas del Siglo XX',
    estado: 'activa',
    categoria: 'oro',
    segmento: 'joyas',
    moneda: 'USD',
    fechaInicio: '2026-05-25T20:00:00Z',
    ubicacion: 'Madison Avenue, NYC',
    rematador: 'Carlo Demarchi',
    cantidadItems: 4,
  },
  {
    id: 'sub_003',
    titulo: 'Subasta Anual de Clásicos',
    estado: 'activa',
    categoria: 'platino',
    segmento: 'vehiculos',
    moneda: 'USD',
    fechaInicio: '2026-05-25T19:30:00Z',
    ubicacion: 'Pebble Beach, California',
    rematador: 'Antoine Beaumont',
    cantidadItems: 5,
  },
  {
    id: 'sub_004',
    titulo: 'Relojería Suiza Vintage',
    estado: 'proxima',
    categoria: 'especial',
    segmento: 'relojeria',
    moneda: 'USD',
    fechaInicio: '2026-05-28T17:00:00Z',
    ubicacion: 'Ginebra, Suiza',
    rematador: 'Henri Lafont',
    cantidadItems: 41,
  },
  {
    id: 'sub_005',
    titulo: 'Antigüedades Rioplatenses',
    estado: 'proxima',
    categoria: 'comun',
    segmento: 'antiguedades',
    moneda: 'ARS',
    fechaInicio: '2026-05-30T15:00:00Z',
    ubicacion: 'Recoleta, Buenos Aires',
    rematador: 'Lucía Arruti',
    cantidadItems: 56,
  },
  {
    id: 'sub_006',
    titulo: 'Diseño Italiano Mid-Century',
    estado: 'proxima',
    categoria: 'plata',
    segmento: 'diseno',
    moneda: 'USD',
    fechaInicio: '2026-06-02T18:00:00Z',
    ubicacion: 'Milán, Italia',
    rematador: 'Sofia Marinelli',
    cantidadItems: 28,
  },
  {
    id: 'sub_007',
    titulo: 'Colección Privada Borges',
    estado: 'proxima',
    categoria: 'oro',
    segmento: 'coleccion',
    moneda: 'USD',
    fechaInicio: '2026-06-05T16:00:00Z',
    ubicacion: 'San Telmo, Buenos Aires',
    rematador: 'Renata Centenario',
    cantidadItems: 87,
  },
  {
    id: 'sub_008',
    titulo: 'Joyas Contemporáneas',
    estado: 'proxima',
    categoria: 'comun',
    segmento: 'joyas',
    moneda: 'ARS',
    fechaInicio: '2026-06-08T19:00:00Z',
    ubicacion: 'Palermo, Buenos Aires',
    rematador: 'Lucía Arruti',
    cantidadItems: 22,
  },
];

// ── Detalle por id ──────────────────────────────────────────────────────────
//
// Tarea #11: detalle de subasta. Mockeamos los primeros 3 ids del listado.
// Cuando una subasta no tiene detalle todavía, las pantallas caen en un
// fallback construido a partir del `SubastaResumen` (ver `getMockDetalle`).

export const MOCK_SUBASTA_DETALLE: Record<string, SubastaDetalle> = {
  sub_001: {
    ...MOCK_SUBASTAS[0],
    subtitulo: 'Arte Contemporáneo y Mobiliario de Lujo',
    descripcion:
      'Una selección curada de obras contemporáneas y piezas de mobiliario de diseño provenientes de colecciones privadas europeas. Incluye 32 lotes con piezas de artistas emergentes y consagrados.',
    modalidad: 'virtual',
    zonaHoraria: 'GMT-3',
    inscripto: false,
  },
  sub_002: {
    ...MOCK_SUBASTAS[1],
    subtitulo: 'Alta Joyería del Siglo XX',
    descripcion:
      'Subasta de joyas históricas con piezas de las maisons más prestigiosas. Cada lote viene con certificado de autenticidad y tasación profesional.',
    modalidad: 'mixta',
    zonaHoraria: 'GMT-3',
    inscripto: true,
  },
  sub_003: {
    ...MOCK_SUBASTAS[2],
    subtitulo: 'Automóviles de Colección',
    descripcion:
      'Más de 20 vehículos clásicos restaurados al detalle. Categoría platino: requiere validación adicional de medio de pago y depósito de garantía.',
    modalidad: 'presencial',
    zonaHoraria: 'GMT-3',
    inscripto: false,
  },
};

/**
 * Devuelve el detalle de una subasta a partir del id.
 *
 * Si no tenemos un detalle específico mockeado, construye uno mínimo a partir
 * del resumen para que la pantalla pueda renderizarse igual sin romperse.
 * Esto desaparece cuando el backend exponga `GET /api/subastas/{id}` real.
 */
export function getMockDetalle(id: string): SubastaDetalle | null {
  const explicit = MOCK_SUBASTA_DETALLE[id];
  if (explicit) return explicit;

  const resumen = MOCK_SUBASTAS.find((s) => s.id === id);
  if (!resumen) return null;

  return {
    ...resumen,
    modalidad: 'virtual',
    zonaHoraria: 'GMT-3',
    inscripto: false,
  };
}

// ── Catálogo por id ─────────────────────────────────────────────────────────
//
// Mockeamos un catálogo "estrella" para sub_001 (10 lotes variados con
// distintos estados) y catálogos compactos para sub_002 y sub_003. Las demás
// subastas caen en un fallback vacío que activa el empty state del catálogo.

export const MOCK_CATALOGO: Record<string, ItemCatalogo[]> = {
  sub_001: [
    {
      id: 'lot_001',
      subastaId: 'sub_001',
      lote: '#001',
      titulo: 'Fragmentos de Eternidad N°12',
      autor: 'Elena Velázquez',
      estado: 'vendido',
      precioBase: 3000,
      moneda: 'USD',
      segmento: 'arte',
    },
    {
      id: 'lot_002',
      subastaId: 'sub_001',
      lote: '#002',
      titulo: 'Estructura Mínima',
      autor: 'Tomás Bauer',
      estado: 'vendido',
      precioBase: 2200,
      moneda: 'USD',
      segmento: 'arte',
    },
    {
      id: 'lot_003',
      subastaId: 'sub_001',
      lote: '#003',
      titulo: 'Escultura "Vive"',
      autor: 'Mariana Pizzi',
      estado: 'en_vivo',
      precioBase: 4200,
      moneda: 'USD',
      segmento: 'arte',
    },
    {
      id: 'lot_004',
      subastaId: 'sub_001',
      lote: '#004',
      titulo: 'Reloj de Colección',
      autor: 'Casa Beaumont',
      estado: 'pendiente',
      precioBase: 6100,
      moneda: 'USD',
      segmento: 'relojeria',
    },
    {
      id: 'lot_005',
      subastaId: 'sub_001',
      lote: '#005',
      titulo: 'Vasija de cerámica vidriada',
      autor: 'Anónimo, ca. 1960',
      estado: 'pendiente',
      precioBase: 1500,
      moneda: 'USD',
      segmento: 'antiguedades',
    },
    {
      id: 'lot_006',
      subastaId: 'sub_001',
      lote: '#006',
      titulo: 'Silla Eames original',
      autor: 'Charles & Ray Eames',
      estado: 'pendiente',
      precioBase: 3800,
      moneda: 'USD',
      segmento: 'diseno',
    },
    {
      id: 'lot_007',
      subastaId: 'sub_001',
      lote: '#007',
      titulo: 'Anillo Cartier Trinity',
      estado: 'pendiente',
      precioBase: 5400,
      moneda: 'USD',
      segmento: 'joyas',
    },
    {
      id: 'lot_008',
      subastaId: 'sub_001',
      lote: '#008',
      titulo: 'Óleo sobre tela – Sin título',
      autor: 'Lautaro Méndez',
      estado: 'pendiente',
      precioBase: 2900,
      moneda: 'USD',
      segmento: 'arte',
    },
    {
      id: 'lot_009',
      subastaId: 'sub_001',
      lote: '#009',
      titulo: 'Mesa lateral mid-century',
      autor: 'Eero Saarinen',
      estado: 'pendiente',
      precioBase: 2400,
      moneda: 'USD',
      segmento: 'diseno',
    },
    {
      id: 'lot_010',
      subastaId: 'sub_001',
      lote: '#010',
      titulo: 'Grabado original – Serie Noche',
      autor: 'Renata Centenario',
      estado: 'pendiente',
      precioBase: 1800,
      moneda: 'USD',
      segmento: 'arte',
    },
  ],
  sub_002: [
    {
      id: 'lot_201',
      subastaId: 'sub_002',
      lote: '#001',
      titulo: 'Collar Art Deco con esmeraldas',
      autor: 'Van Cleef & Arpels, c.1930',
      estado: 'pendiente',
      precioBase: 18500,
      moneda: 'USD',
      segmento: 'joyas',
    },
    {
      id: 'lot_202',
      subastaId: 'sub_002',
      lote: '#002',
      titulo: 'Anillo solitario diamante 2.4ct',
      estado: 'pendiente',
      precioBase: 9800,
      moneda: 'USD',
      segmento: 'joyas',
    },
    {
      id: 'lot_203',
      subastaId: 'sub_002',
      lote: '#003',
      titulo: 'Pulsera tennis – Oro blanco 18k',
      estado: 'pendiente',
      precioBase: 6200,
      moneda: 'USD',
      segmento: 'joyas',
    },
    {
      id: 'lot_204',
      subastaId: 'sub_002',
      lote: '#004',
      titulo: 'Aros Bvlgari Serpenti',
      estado: 'pendiente',
      precioBase: 4400,
      moneda: 'USD',
      segmento: 'joyas',
    },
  ],
  sub_003: [
    {
      id: 'lot_301',
      subastaId: 'sub_003',
      lote: '#001',
      titulo: 'Porsche 911 Carrera GTS 1972',
      estado: 'pendiente',
      precioBase: 145000,
      moneda: 'USD',
      segmento: 'vehiculos',
    },
    {
      id: 'lot_302',
      subastaId: 'sub_003',
      lote: '#002',
      titulo: 'Mercedes-Benz 280SL Pagoda 1970',
      estado: 'pendiente',
      precioBase: 92000,
      moneda: 'USD',
      segmento: 'vehiculos',
    },
    {
      id: 'lot_303',
      subastaId: 'sub_003',
      lote: '#003',
      titulo: 'Jaguar E-Type Series 1',
      estado: 'pendiente',
      precioBase: 118000,
      moneda: 'USD',
      segmento: 'vehiculos',
    },
    {
      id: 'lot_304',
      subastaId: 'sub_003',
      lote: '#004',
      titulo: 'Fiat 600 Multipla 1965',
      estado: 'pendiente',
      precioBase: 18400,
      moneda: 'USD',
      segmento: 'vehiculos',
    },
    {
      id: 'lot_305',
      subastaId: 'sub_003',
      lote: '#005',
      titulo: 'Alfa Romeo Giulietta Spider 1959',
      estado: 'pendiente',
      precioBase: 76000,
      moneda: 'USD',
      segmento: 'vehiculos',
    },
  ],
};

/**
 * Devuelve el catálogo de una subasta a partir del id.
 *
 * Si no hay catálogo mockeado, devolvemos un array vacío para que la pantalla
 * muestre el empty state — esto refleja también lo que sería un 200 OK con
 * lista vacía del backend real.
 */
export function getMockCatalogo(subastaId: string): ItemCatalogo[] {
  return MOCK_CATALOGO[subastaId] ?? [];
}

// ── Detalle por item ────────────────────────────────────────────────────────
//
// Tarea #12: detalle de ítem. Mockeamos algunos lotes representativos (uno
// vendido, uno en vivo, uno pendiente, uno de cada subasta principal). El
// resto cae al fallback `getMockItemDetalle` que devuelve sólo lo que ya
// está en el listado del catálogo.

export const MOCK_ITEM_DETALLE: Record<string, ItemDetalle> = {
  lot_001: {
    ...MOCK_CATALOGO['sub_001'][0],
    descripcion:
      'Obra contemporánea en técnica mixta sobre lienzo. Pieza única firmada por la artista, parte de la serie "Fragmentos de Eternidad" exhibida en la Bienal de São Paulo 2024.',
    procedencia: 'Colección privada, Buenos Aires',
    dimensiones: '120 x 90 cm',
    condicion: 'Excelente',
  },
  lot_003: {
    ...MOCK_CATALOGO['sub_001'][2],
    descripcion:
      'Escultura en bronce patinado de la serie "Vive". Adjudicada en vivo durante la jornada actual.',
    procedencia: 'Taller del artista',
    dimensiones: '45 x 30 x 25 cm',
    condicion: 'Excelente',
  },
  lot_201: {
    ...MOCK_CATALOGO['sub_002'][0],
    descripcion:
      'Collar Art Deco circa 1930 con esmeraldas colombianas talla cabochon montadas sobre platino. Incluye certificado de autenticidad de Van Cleef & Arpels Heritage.',
    procedencia: 'Colección privada europea',
    condicion: 'Excelente, restauración menor del cierre',
  },
  lot_301: {
    ...MOCK_CATALOGO['sub_003'][0],
    descripcion:
      'Porsche 911 Carrera GTS 1972 restaurado al detalle. Matching numbers verificado. Documentación completa de origen y mantenimientos.',
    procedencia: 'Colección privada, Pebble Beach',
    condicion: 'Concours-ready',
  },
};

/**
 * Devuelve el detalle de un ítem buscando primero en `MOCK_ITEM_DETALLE` y
 * cayendo al `ItemCatalogo` del listado si no hay un detalle explícito.
 *
 * Cuando el backend exponga `GET /api/subastas/{subastaId}/catalogo/{itemId}`
 * este helper desaparece y se reemplaza por la query real.
 */
export function getMockItemDetalle(itemId: string): ItemDetalle | null {
  const explicit = MOCK_ITEM_DETALLE[itemId];
  if (explicit) return explicit;

  for (const items of Object.values(MOCK_CATALOGO)) {
    const found = items.find((i) => i.id === itemId);
    if (found) return { ...found };
  }
  return null;
}
