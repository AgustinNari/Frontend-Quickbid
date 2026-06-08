export type HistorialTipo = 'puja' | 'compra';
export type HistorialEstado = 'ganada' | 'superada' | 'adjudicado' | 'perdida';

export type HistorialItem = {
  id: string;
  fecha: string;
  tipo: HistorialTipo;
  estado: HistorialEstado;
  itemNombre: string;
  subastaNombre: string;
  monto: string;
};

export const MOCK_HISTORIAL: HistorialItem[] = [
  {
    id: 'h_001',
    fecha: '28 MAR 2026',
    tipo: 'puja',
    estado: 'ganada',
    itemNombre: 'Mercedes-Benz 280SL 1970',
    subastaNombre: 'Subasta Clásicos · Lote #042',
    monto: '$ 43,1M',
  },
  {
    id: 'h_002',
    fecha: '02 ABR 2026',
    tipo: 'compra',
    estado: 'adjudicado',
    itemNombre: 'Patek Philippe Calatrava',
    subastaNombre: 'Subasta Relojes · Lote #016',
    monto: '~ $ 18,9M',
  },
  {
    id: 'h_003',
    fecha: '26 MAR 2026',
    tipo: 'puja',
    estado: 'superada',
    itemNombre: 'Berni — "Juanito"',
    subastaNombre: 'Subasta Arte · Lote #003',
    monto: '$ 8,4M',
  },
  {
    id: 'h_004',
    fecha: '26 MAR 2026',
    tipo: 'puja',
    estado: 'ganada',
    itemNombre: 'Anillo Cartier Trinity',
    subastaNombre: 'Subasta Joyería · Lote #027',
    monto: '$ 780K',
  },
  {
    id: 'h_005',
    fecha: '01 MAR 2026',
    tipo: 'puja',
    estado: 'ganada',
    itemNombre: 'Fiat 600 1965',
    subastaNombre: 'Subasta Clásicos · Lote #009',
    monto: '$ 3,2M',
  },
];
