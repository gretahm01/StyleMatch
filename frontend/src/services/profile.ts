import type { TasteProfile, TasteProfileInput } from '../types/profile';
import { apiUrl } from './api';
const json = { 'Content-Type': 'application/json' };
async function profileFetch(path: string, init?: RequestInit): Promise<Response> {
  let endpoint = path;
  try {
    endpoint = apiUrl(path);
    const response = await fetch(endpoint, init);
    if (!response.ok) console.error('Profile API request failed', { status: response.status, endpoint });
    return response;
  } catch (error) {
    console.error('Profile API request failed', { status: null, endpoint });
    throw error;
  }
}
export async function getProfile(id: string): Promise<TasteProfile | null> { const response = await profileFetch(`/api/profiles/${id}`); if (response.status === 404) return null; if (!response.ok) throw new Error('No fue posible consultar el perfil.'); return (await response.json() as { profile: TasteProfile }).profile; }
export async function saveProfile(id: string, input: TasteProfileInput, exists: boolean): Promise<TasteProfile> { let response = await profileFetch(exists ? `/api/profiles/${id}` : '/api/profiles', { method: exists ? 'PUT' : 'POST', headers: json, body: JSON.stringify(exists ? input : { id, ...input }) }); if (!exists && response.status === 409) response = await profileFetch(`/api/profiles/${id}`, { method: 'PUT', headers: json, body: JSON.stringify(input) }); if (!response.ok) throw new Error('No fue posible guardar el perfil.'); return (await response.json() as { profile: TasteProfile }).profile; }
export async function removeProfile(id: string): Promise<void> { const response = await profileFetch(`/api/profiles/${id}`, { method: 'DELETE' }); if (!response.ok && response.status !== 404) throw new Error('No fue posible eliminar el perfil.'); }
