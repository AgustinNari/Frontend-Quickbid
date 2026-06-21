import { toWebSocketBaseUrl } from '../src/api/config';
import { userFacingError, ApiError } from '../src/api/client';
import { mapDocumentoCompra } from '../src/mappers/compras';

test('deriva WebSocket seguro desde Render', () => {
  expect(toWebSocketBaseUrl('https://quickbid.example')).toBe(
    'wss://quickbid.example',
  );
});

test('mapea un documento descargable con datos legibles', () => {
  const document = mapDocumentoCompra({
    id: 1,
    tipo: 'factura_compra',
    estado: 'disponible',
    archivoId: 2,
    filename: 'factura.pdf',
    contentType: 'application/pdf',
    sizeBytes: 2048,
    createdAt: '2026-06-21T12:00:00Z',
    downloadAvailable: true,
    downloadUrl: '/api/compras/1/documentos/1/descargar',
  });
  expect(document.tipoLabel).toBe('Factura de compra');
  expect(document.sizeLabel).toBe('2 KB');
  expect(document.downloadAvailable).toBe(true);
});

test('no expone errores tecnicos desconocidos', () => {
  expect(userFacingError(new Error('ECONNRESET'), 'Mensaje seguro')).toBe(
    'Mensaje seguro',
  );
  expect(userFacingError(new ApiError(409, 'Actualiza e intenta nuevamente.'))).toBe(
    'Actualiza e intenta nuevamente.',
  );
});
