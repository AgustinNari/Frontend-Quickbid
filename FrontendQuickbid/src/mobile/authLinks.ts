export function normalizeAuthLink(url: string) {
  const marker = '#token=';
  const markerIndex = url.indexOf(marker);
  if (markerIndex < 0) return url;
  const token = url.slice(markerIndex + marker.length).split('&')[0];
  if (!token) return url;
  const base = url.slice(0, markerIndex);
  return `${base}${base.includes('?') ? '&' : '?'}token=${token}`;
}
