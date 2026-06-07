export type DireccionEnvioDto = {
  id: number;
  alias: string;
  destinatario: string;
  calle: string;
  numero: string;
  piso: string | null;
  codigoPostal: string;
  localidad: string;
  provincia: string;
  pais: string;
  telefono: string | null;
  principal: boolean;
};

export type CrearDireccionRequest = Omit<DireccionEnvioDto, 'id' | 'principal'>;
