import { API_BASE_URL } from '../api/config';

export function resolveApiMediaUrl(path?: string | null) {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith('/') || path.startsWith('//')) return undefined;
  return `${API_BASE_URL}${path}`;
}
