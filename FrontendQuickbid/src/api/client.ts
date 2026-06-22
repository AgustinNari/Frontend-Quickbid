import { API_BASE_URL } from './config';
import { documentModule } from '../mobile/nativeMobile';
import { reportQuickBidReachability } from '../mobile/reachability';

export interface ApiFieldError {
  field: string | null;
  code: string;
  message: string;
}

export interface ApiEnvelope<T = null> {
  data: T | null;
  message: string;
  errors: ApiFieldError[];
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors: ApiFieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type SessionTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

export type RefreshedSession = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  estadoCuenta: string;
  usuario: unknown;
};

type ApiFetchOptions = RequestInit & {
  public?: boolean;
  skipRefresh?: boolean;
};

export const API_TIMEOUT_MS = 20000;

let tokens: SessionTokens = { accessToken: null, refreshToken: null };
let refreshPromise: Promise<string | null> | null = null;
let onSessionRefreshed:
  | ((session: RefreshedSession) => void | Promise<void>)
  | null = null;
let onSessionExpired: (() => void | Promise<void>) | null = null;

export function setSessionTokens(
  accessToken: string | null,
  refreshToken: string | null,
) {
  tokens = { accessToken, refreshToken };
}

export function setAuthToken(accessToken: string | null) {
  tokens.accessToken = accessToken;
}

export function getAuthToken() {
  return tokens.accessToken;
}

export function configureSessionHandlers(handlers: {
  onRefreshed: (session: RefreshedSession) => void | Promise<void>;
  onExpired: () => void | Promise<void>;
}) {
  onSessionRefreshed = handlers.onRefreshed;
  onSessionExpired = handlers.onExpired;
}

function readableError(
  envelope: ApiEnvelope<unknown> | null,
  fallback: string,
) {
  const details =
    envelope?.errors?.map(error => error.message).filter(Boolean) ?? [];
  return details.length > 0
    ? details.join('\n')
    : envelope?.message || fallback;
}

function fallbackForStatus(status: number) {
  if (status === 400)
    return 'La solicitud tiene datos inválidos. Revisá la información e intentá nuevamente.';
  if (status === 401)
    return 'Tu sesión expiró o no estás autenticado. Iniciá sesión para continuar.';
  if (status === 403)
    return 'No tenés permiso para realizar esta acción con el estado actual de tu cuenta.';
  if (status === 409)
    return 'La operación no se puede completar porque el estado cambió. Actualizá e intentá nuevamente.';
  return 'No pudimos completar la solicitud. Intentá nuevamente en unos minutos.';
}

async function safeFetch(input: RequestInfo, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();
  init?.signal?.addEventListener('abort', abortFromCaller, { once: true });
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    reportQuickBidReachability(true);
    return response;
  } catch (error) {
    reportQuickBidReachability(false);
    if (controller.signal.aborted) {
      throw new ApiError(
        0,
        'QuickBid está iniciando o tarda más de lo esperado. Reintentá en unos segundos.',
      );
    }
    if (__DEV__) {
      console.warn('[QuickBid API] Error de red', {
        baseUrl: API_BASE_URL,
        endpoint: String(input),
        error,
        suggestion: 'Verificar backend, adb reverse o API base URL.',
      });
    }
    throw new ApiError(
      0,
      'No se pudo conectar con QuickBid. Verificá tu conexión o intentá nuevamente en unos minutos.',
    );
  } finally {
    clearTimeout(timeout);
    init?.signal?.removeEventListener('abort', abortFromCaller);
  }
}

export function userFacingError(
  error: unknown,
  fallback = 'No pudimos completar la operación. Intentá nuevamente.',
) {
  return error instanceof ApiError && error.message ? error.message : fallback;
}

async function parseEnvelope<T>(
  response: Response,
): Promise<ApiEnvelope<T> | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(
      response.status,
      'No pudimos interpretar la respuesta de QuickBid.',
    );
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (!tokens.refreshToken) return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
      const envelope = await parseEnvelope<RefreshedSession>(response);
      if (!response.ok || !envelope?.data) return null;

      tokens = {
        accessToken: envelope.data.accessToken,
        refreshToken: envelope.data.refreshToken,
      };
      await onSessionRefreshed?.(envelope.data);
      return envelope.data.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  const accessToken = await refreshPromise;
  if (!accessToken) {
    setSessionTokens(null, null);
    await onSessionExpired?.();
  }
  return accessToken;
}

export async function apiFetch<T = null>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<ApiEnvelope<T>> {
  const {
    public: isPublic = false,
    skipRefresh = false,
    ...requestOptions
  } = options;
  const headers: Record<string, string> = {
    ...(requestOptions.body instanceof FormData
      ? {}
      : { 'Content-Type': 'application/json' }),
    ...(requestOptions.headers as Record<string, string>),
  };

  if (!isPublic && tokens.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  let response = await safeFetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers,
  });

  if (
    response.status === 401 &&
    !isPublic &&
    !skipRefresh &&
    tokens.refreshToken
  ) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      response = await safeFetch(`${API_BASE_URL}${path}`, {
        ...requestOptions,
        headers: { ...headers, Authorization: `Bearer ${refreshedToken}` },
      });
    }
  }

  const body = await parseEnvelope<T>(response);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      readableError(body, fallbackForStatus(response.status)),
      body?.errors ?? [],
    );
  }

  return body ?? { data: null, message: '', errors: [] };
}

export type DownloadedFile = {
  filename: string | null;
  contentType: string;
  sizeBytes: number;
  shared: boolean;
};

export async function apiDownload(
  path: string,
  fallbackFilename?: string,
): Promise<DownloadedFile> {
  const url = resolveDownloadUrl(path);
  const nativeDocument = documentModule;
  if (nativeDocument) {
    const request = (accessToken: string | null) =>
      nativeDocument.downloadAndShare(
        url,
        accessToken ? `Bearer ${accessToken}` : '',
        fallbackFilename ?? null,
      );
    try {
      return await request(tokens.accessToken);
    } catch (error) {
      if (nativeErrorCode(error) === 'HTTP_401' && tokens.refreshToken) {
        const refreshedToken = await refreshAccessToken();
        if (refreshedToken) return request(refreshedToken);
      }
      throw new ApiError(
        0,
        'No pudimos abrir o compartir el documento. Verificá tu conexión y que haya una app compatible.',
      );
    }
  }

  const request = (accessToken: string | null) =>
    safeFetch(url, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });

  let response = await request(tokens.accessToken);
  if (response.status === 401 && tokens.refreshToken) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) response = await request(refreshedToken);
  }
  if (!response.ok) {
    const body = await parseEnvelope<unknown>(response);
    throw new ApiError(
      response.status,
      readableError(body, fallbackForStatus(response.status)),
      body?.errors ?? [],
    );
  }

  const blob = await response.blob();
  return {
    filename: filenameFromDisposition(
      response.headers.get('Content-Disposition'),
    ),
    contentType:
      response.headers.get('Content-Type') ||
      blob.type ||
      'application/octet-stream',
    sizeBytes: blob.size,
    shared: false,
  };
}

export function resolveDownloadUrl(path: string) {
  if (!path.startsWith('/') || /^\/\//.test(path)) {
    throw new ApiError(400, 'La dirección del documento no es válida.');
  }
  if (/[?&](access_)?token=/i.test(path)) {
    throw new ApiError(400, 'La dirección del documento no es segura.');
  }
  return `${API_BASE_URL}${path}`;
}

function nativeErrorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : null;
}

function filenameFromDisposition(value: string | null) {
  if (!value) return null;
  const encoded = value.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return encoded;
    }
  }
  return value.match(/filename="?([^";]+)"?/i)?.[1] ?? null;
}
