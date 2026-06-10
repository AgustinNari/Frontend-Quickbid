export type PeriodoStats = 'mes' | 'trimestre' | 'año' | 'total';

export type EstadisticasPeriodo = {
  totalInvertido: string;
  variacion: string;
  variacionPos: boolean;
  tasaVictorias: number;
  tasaVictoriasVar: string;
  tasaVictoriasPos: boolean;
  pujaPromedio: string;
  pujaPromedioVar: string;
  pujaPromedioPos: boolean;
  gastosPorMes: number[];
  segmentoTop: {
    nombre: string;
    detalle: string;
    porcentaje: number;
  };
};

export const MOCK_ESTADISTICAS: Record<PeriodoStats, EstadisticasPeriodo> = {
  mes: {
    totalInvertido: '$ 73.420.000',
    variacion: '+18,4% vs mes anterior',
    variacionPos: true,
    tasaVictorias: 83,
    tasaVictoriasVar: '▲ 4',
    tasaVictoriasPos: true,
    pujaPromedio: '$ 6,1M',
    pujaPromedioVar: '▲ 12%',
    pujaPromedioPos: true,
    gastosPorMes: [
      0.2, 0.35, 0.3, 0.45, 0.4, 0.5, 0.38, 0.55, 0.48, 0.6, 0.7, 1.0,
    ],
    segmentoTop: {
      nombre: 'Relojes de colección',
      detalle: '5 compras · $ 38,2M gastado',
      porcentaje: 52,
    },
  },
  trimestre: {
    totalInvertido: '$ 198.700.000',
    variacion: '+11,2% vs trimestre anterior',
    variacionPos: true,
    tasaVictorias: 78,
    tasaVictoriasVar: '▲ 2',
    tasaVictoriasPos: true,
    pujaPromedio: '$ 5,8M',
    pujaPromedioVar: '▲ 7%',
    pujaPromedioPos: true,
    gastosPorMes: [
      0.3, 0.5, 0.45, 0.6, 0.55, 0.7, 0.5, 0.65, 0.6, 0.75, 0.8, 1.0,
    ],
    segmentoTop: {
      nombre: 'Relojes de colección',
      detalle: '14 compras · $ 112M gastado',
      porcentaje: 56,
    },
  },
  año: {
    totalInvertido: '$ 742.000.000',
    variacion: '+24,1% vs año anterior',
    variacionPos: true,
    tasaVictorias: 81,
    tasaVictoriasVar: '▲ 6',
    tasaVictoriasPos: true,
    pujaPromedio: '$ 7,2M',
    pujaPromedioVar: '▲ 15%',
    pujaPromedioPos: true,
    gastosPorMes: [
      0.4, 0.55, 0.5, 0.65, 0.6, 0.75, 0.6, 0.7, 0.65, 0.8, 0.85, 1.0,
    ],
    segmentoTop: {
      nombre: 'Vehículos clásicos',
      detalle: '8 compras · $ 320M gastado',
      porcentaje: 43,
    },
  },
  total: {
    totalInvertido: '$ 2.140.000.000',
    variacion: 'Desde tu ingreso',
    variacionPos: true,
    tasaVictorias: 79,
    tasaVictoriasVar: 'histórico',
    tasaVictoriasPos: true,
    pujaPromedio: '$ 6,8M',
    pujaPromedioVar: 'promedio',
    pujaPromedioPos: true,
    gastosPorMes: [
      0.3, 0.4, 0.45, 0.5, 0.55, 0.6, 0.55, 0.65, 0.7, 0.75, 0.85, 1.0,
    ],
    segmentoTop: {
      nombre: 'Vehículos clásicos',
      detalle: '31 compras · $ 980M gastado',
      porcentaje: 46,
    },
  },
};
