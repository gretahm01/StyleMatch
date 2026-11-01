import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TasteProfile, TasteProfileInput } from '../types/profile';

const input: TasteProfileInput = {
  alias: 'Luna', interestCategory: 'fashion', preferredStyles: [], fashionStyles: [], homeStyles: [], favoriteColors: [], avoidedColors: [], preferredMaterials: [], fashionPriorities: [], fashionCuts: [], fashionPatterns: [],
};
const profile: TasteProfile = { id: 'profile-id', ...input };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('saveProfile in production', () => {
  it('uses VITE_API_URL as the origin and sends exactly one /api/profiles path', async () => {
    vi.stubEnv('VITE_API_URL', 'https://stylematch-api-9nvz.onrender.com');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ profile }), { status: 201, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const { saveProfile } = await import('./profile');

    await saveProfile('profile-id', input, false);

    expect(fetchMock).toHaveBeenCalledWith('https://stylematch-api-9nvz.onrender.com/api/profiles', expect.objectContaining({ method: 'POST' }));
  });
});
