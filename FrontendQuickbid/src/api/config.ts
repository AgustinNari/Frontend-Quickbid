export type ApiMode = 'localReverse' | 'emulator' | 'public';

// Cambiar solo estas dos constantes para una demo contra un backend publico.
// El dominio example.com es un placeholder: reemplazarlo antes de usar modo public.
export const API_MODE: ApiMode = 'public';
export const PUBLIC_API_BASE_URL = 'https://quickbid-backend-demo.onrender.com';

const API_BASE_URLS: Record<ApiMode, string> = {
  localReverse: 'http://localhost:8080',
  emulator: 'http://10.0.2.2:8080',
  public: PUBLIC_API_BASE_URL,
};

export const API_BASE_URL = API_BASE_URLS[API_MODE].replace(/\/+$/, '');
export const WS_BASE_URL = toWebSocketBaseUrl(API_BASE_URL);

function toWebSocketBaseUrl(apiBaseUrl: string) {
  if (apiBaseUrl.startsWith('https://')) {
    return `wss://${apiBaseUrl.slice('https://'.length)}`;
  }
  if (apiBaseUrl.startsWith('http://')) {
    return `ws://${apiBaseUrl.slice('http://'.length)}`;
  }
  throw new Error('API_BASE_URL debe comenzar con http:// o https://');
}
