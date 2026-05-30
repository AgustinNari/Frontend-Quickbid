export type EstadoConsignacion = 'activa' | 'rechazada' | 'vendida';

export type Consignacion = {
  id: string;
  nombre: string;
  precio: string;
  detalle: string;
  estado: EstadoConsignacion;
  badge?: number;       // notificación sin leer
  diasRestantes?: string;
};

export const MOCK_CONSIGNACIONES: Consignacion[] = [
  {
    id: '1',
    nombre: 'Reloj Cartier Santos 1978',
    precio: 'ARS 2.800.000',
    detalle: 'RM-006876 · 3 pujas',
    estado: 'activa',
    badge: 1,
  },
  {
    id: '2',
    nombre: 'Pintura óleo silenzio "Puerto"',
    precio: 'USD 3.500',
    detalle: 'Sale hoy a las 18:00',
    estado: 'activa',
  },
  {
    id: '3',
    nombre: 'Moneda oro 1899 — 50 pesos',
    precio: 'ARS 1.650.000',
    detalle: '3 días para vencimiento',
    estado: 'activa',
  },
  {
    id: '4',
    nombre: 'Moneda oro 1920 — 50 pesos',
    precio: 'ARS 300.000',
    detalle: '3 días para vencimiento',
    estado: 'activa',
  },
  {
    id: '5',
    nombre: 'Guitarra Gibson Les Paul 1960',
    precio: 'ARS 5.200.000',
    detalle: 'Rechazada por documentación incompleta',
    estado: 'rechazada',
  },
  {
    id: '6',
    nombre: 'Cámara Leica M3 cromada',
    precio: 'ARS 980.000',
    detalle: 'No cumple requisitos de autenticidad',
    estado: 'rechazada',
  },
  {
    id: '7',
    nombre: 'Sello postal 1910 — serie completa',
    precio: 'ARS 450.000',
    detalle: 'Rechazada · valor estimado insuficiente',
    estado: 'rechazada',
  },
  {
    id: '8',
    nombre: 'Automóvil Ford T 1924',
    precio: 'ARS 48.000.000',
    detalle: 'Vendido el 12 mar 2025',
    estado: 'vendida',
  },
  {
    id: '9',
    nombre: 'Violín Stradivarius (réplica firmada)',
    precio: 'ARS 3.100.000',
    detalle: 'Vendido el 05 ene 2025',
    estado: 'vendida',
  },
  {
    id: '10',
    nombre: 'Reloj Omega Seamaster 1968',
    precio: 'ARS 1.900.000',
    detalle: 'Vendido el 20 nov 2024',
    estado: 'vendida',
  },
];
