import { toWebSocketBaseUrl } from '../src/api/config';
import {
  userFacingError,
  ApiError,
  resolveDownloadUrl,
} from '../src/api/client';
import { mapDocumentoCompra } from '../src/mappers/compras';
import { shouldWarnForHeavyAction } from '../src/context/NetworkContext';

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

test('deriva descarga autenticada sin poner tokens en la URL', () => {
  const url = resolveDownloadUrl('/api/compras/1/documentos/2/descargar');
  expect(url).toBe(
    'https://quickbid-backend-demo.onrender.com/api/compras/1/documentos/2/descargar',
  );
  expect(url).not.toMatch(/token=/i);
  expect(() =>
    resolveDownloadUrl('/api/documentos/2?access_token=secreto'),
  ).toThrow('La dirección del documento no es segura.');
});

test('advierte solo para acciones pesadas con datos moviles', () => {
  expect(shouldWarnForHeavyAction('cellular')).toBe(true);
  expect(shouldWarnForHeavyAction('wifi')).toBe(false);
  expect(shouldWarnForHeavyAction('unknown')).toBe(false);
});

test('mantiene un fallback legible si falla abrir o compartir', () => {
  const error = new ApiError(
    0,
    'No pudimos abrir o compartir el documento. Verificá tu conexión y que haya una app compatible.',
  );
  expect(userFacingError(error)).toContain('No pudimos abrir o compartir');
  expect(userFacingError(new Error('ActivityNotFoundException'))).not.toContain(
    'ActivityNotFoundException',
  );
});
