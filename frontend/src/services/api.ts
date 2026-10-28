import type { ApiHealth } from '../types/api';

export async function getApiHealth(): Promise<ApiHealth> {
  const response = await fetch('/api/health');
  if (!response.ok) throw new Error('Backend no disponible');
  return response.json() as Promise<ApiHealth>;
}
