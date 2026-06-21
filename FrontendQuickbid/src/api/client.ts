import { API_BASE_URL } from './config';

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
    return 'La solicitud tiene datos invalidos. Revisa la informacion e intenta nuevamente.';
  if (status === 401)
    return 'Tu sesion expiro o no estas autenticado. Inicia sesion para continuar.';
  if (status === 403)
    return 'No tenes permiso para realizar esta accion con el estado actual de tu cuenta.';
  if (status === 409)
    return 'La operacion no se puede completar porque el estado cambio. Actualiza e intenta nuevamente.';
  return 'No pudimos completar la solicitud. Intenta nuevamente en unos minutos.';
}

async function safeFetch(input: RequestInfo, init?: RequestInit) {
  try {
    return await fetch(input, init);
  } catch (error) {
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
      'No se pudo conectar con QuickBid. Verifica tu conexion o intenta nuevamente en unos minutos.',
    );
  }
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
};

export async function apiDownload(path: string): Promise<DownloadedFile> {
  const request = (accessToken: string | null) =>
    safeFetch(`${API_BASE_URL}${path}`, {
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
  };
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
