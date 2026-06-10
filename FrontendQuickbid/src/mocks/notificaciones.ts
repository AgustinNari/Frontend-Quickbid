export type NotifTipo = 'subasta' | 'consigna' | 'pago' | 'catalogo' | 'puja';

export type Notificacion = {
  id: string;
  tipo: NotifTipo;
  titulo: string;
  cuerpo: string;
  hora: string;
  leida: boolean;
  grupo: 'HOY' | 'AYER' | 'ESTA SEMANA';
};

export const MOCK_NOTIFICACIONES: Notificacion[] = [
  {
    id: 'n_001',
    tipo: 'subasta',
    titulo: '¡Ganaste el lote #042!',
    cuerpo: 'Mercedes-Benz 280SL adjudicado por $ 43,1M',
    hora: 'hace 12 min',
    leida: false,
    grupo: 'HOY',
  },
  {
    id: 'n_002',
    tipo: 'consigna',
    titulo: 'Consignación aprobada',
    cuerpo: 'Tu reloj Rolex Submariner entró al catálogo',
    hora: 'hace 2 hs',
    leida: false,
    grupo: 'HOY',
  },
  {
    id: 'n_003',
    tipo: 'puja',
    titulo: 'Puja superada',
    cuerpo: 'Te superaron en "Fiat 600 1965" - nueva base $ 3,4M',
    hora: 'hace 4 hs',
    leida: false,
    grupo: 'HOY',
  },
  {
    id: 'n_004',
    tipo: 'pago',
    titulo: 'Liquidación acreditada',
    cuerpo: '$ 780K depositados en tu cuenta bancaria',
    hora: 'ayer 18:24',
    leida: true,
    grupo: 'AYER',
  },
  {
    id: 'n_005',
    tipo: 'catalogo',
    titulo: 'Nuevo catálogo disponible',
    cuerpo: 'Subasta de Arte Moderno — 42 lotes',
    hora: 'ayer 10:05',
    leida: true,
    grupo: 'AYER',
  },
];
