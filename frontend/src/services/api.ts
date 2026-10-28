import type { ApiHealth } from '../types/api';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (configuredApiUrl) return `${configuredApiUrl}${normalizedPath}`;
  if (import.meta.env.DEV) return `http://localhost:3001${normalizedPath}`;
  throw new Error('La aplicación requiere VITE_API_URL para conectarse al backend publicado.');
}

export function apiAssetUrl(path: string): string {
  return apiUrl(path);
}

export async function getApiHealth(): Promise<ApiHealth> {
  const response = await fetch(apiUrl('/api/health'));
  if (!response.ok) throw new Error('Backend no disponible');
  return response.json() as Promise<ApiHealth>;
}
