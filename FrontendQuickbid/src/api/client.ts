import { BASE_URL } from './config';

/** Formato estándar de respuesta del backend { data, message, errors? } */
export interface ApiResponse<T = null> {
  data?: T;
  message: string;
  errors?: string[];
}

/** Error tipado que viene del backend */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: string[],
  ) {
    super(message);
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

/**
 * Wrapper sobre fetch.
 * - Agrega Content-Type y Authorization automáticamente.
 * - Parsea la respuesta estándar { data, message, errors? }.
 * - Lanza ApiError si el status no es 2xx.
 */
export async function apiFetch<T = null>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let body: ApiResponse<T>;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(response.status, 'Error al parsear la respuesta del servidor');
  }

  if (!response.ok) {
    throw new ApiError(response.status, body.message ?? 'Error del servidor', body.errors);
  }

  return body;
}
