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
let onSessionRefreshed: ((session: RefreshedSession) => void | Promise<void>) | null = null;
let onSessionExpired: (() => void | Promise<void>) | null = null;

export function setSessionTokens(accessToken: string | null, refreshToken: string | null) {
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

function readableError(envelope: ApiEnvelope<unknown> | null, fallback: string) {
  const details = envelope?.errors?.map(error => error.message).filter(Boolean) ?? [];
  return details.length > 0 ? details.join('\n') : envelope?.message || fallback;
}

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T> | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(response.status, 'Error al interpretar la respuesta del servidor');
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (!tokens.refreshToken) return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
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
  const { public: isPublic = false, skipRefresh = false, ...requestOptions } = options;
  const headers: Record<string, string> = {
    ...(requestOptions.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(requestOptions.headers as Record<string, string>),
  };

  if (!isPublic && tokens.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers,
  });

  if (response.status === 401 && !isPublic && !skipRefresh && tokens.refreshToken) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...requestOptions,
        headers: { ...headers, Authorization: `Bearer ${refreshedToken}` },
      });
    }
  }

  const body = await parseEnvelope<T>(response);
  if (!response.ok) {
    throw new ApiError(response.status, readableError(body, 'Error del servidor'), body?.errors ?? []);
  }

  return body ?? { data: null, message: '', errors: [] };
}
