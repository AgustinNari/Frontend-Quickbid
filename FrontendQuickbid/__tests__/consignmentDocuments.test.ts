import { findGeneratedDocument } from '../src/utils/consignmentDocuments';
import { ConsignacionArchivoDto } from '../src/types/consignacionApi';

function file(
  filename: string,
  overrides: Partial<ConsignacionArchivoDto> = {},
): ConsignacionArchivoDto {
  return {
    archivoId: overrides.archivoId ?? 1,
    filename,
    contentType: 'application/pdf',
    sizeBytes: 631,
    estado: 'disponible',
    downloadAvailable: true,
    downloadUrl: '/api/consignaciones/1/archivos/1/descargar',
    ...overrides,
  };
}

describe('findGeneratedDocument', () => {
  it('encuentra documentos por tipo logico', () => {
    const agreement = file('documento-final.pdf', {
      tipo: 'acuerdo_consignacion',
    });

    expect(
      findGeneratedDocument(
        { documentosGenerados: [file('otro.pdf'), agreement] },
        'acuerdo_consignacion',
      ),
    ).toBe(agreement);
  });

  it('usa filename como fallback para clientes viejos', () => {
    const agreement = file('acuerdo_consignacion-16111.pdf');

    expect(
      findGeneratedDocument(
        { documentosGenerados: [agreement] },
        'acuerdo_consignacion',
      ),
    ).toBe(agreement);
  });

  it('reconoce poliza_seguro y poliza_consignacion como equivalentes', () => {
    const policy = file('poliza-8011.pdf', { tipo: 'poliza_seguro' });

    expect(
      findGeneratedDocument(
        { documentosGenerados: [policy] },
        'poliza_consignacion',
      ),
    ).toBe(policy);
  });

  it('reconoce liquidacion_venta aunque el filename sea legacy', () => {
    const liquidation = file('liquidacion-demo.pdf', {
      tipo: 'liquidacion_venta',
    });

    expect(
      findGeneratedDocument(
        { documentosGenerados: [liquidation] },
        'liquidacion_venta',
      ),
    ).toBe(liquidation);
  });
});
