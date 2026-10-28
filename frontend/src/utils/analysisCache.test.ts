import { describe, expect, it } from 'vitest';
import { analysisCacheKey, imageFingerprint } from './analysisCache';

describe('caché de análisis en memoria', () => {
  it('reconoce la misma imagen y separa categoría o modo para evitar reutilización incorrecta', async () => {
    const bytes = new TextEncoder().encode('misma-imagen');
    const fingerprint = await imageFingerprint({ arrayBuffer: async () => bytes.buffer } as Pick<File, 'arrayBuffer'>);
    expect(analysisCacheKey('fashion', 'real', fingerprint)).toBe(analysisCacheKey('fashion', 'real', fingerprint));
    expect(analysisCacheKey('fashion', 'real', fingerprint)).not.toBe(analysisCacheKey('home', 'real', fingerprint));
    expect(analysisCacheKey('fashion', 'real', fingerprint)).not.toBe(analysisCacheKey('fashion', 'demo', fingerprint));
  });
  it('genera otra huella para una fotografía distinta', async () => {
    const first = await imageFingerprint({ arrayBuffer: async () => new TextEncoder().encode('foto-a').buffer } as Pick<File, 'arrayBuffer'>);
    const second = await imageFingerprint({ arrayBuffer: async () => new TextEncoder().encode('foto-b').buffer } as Pick<File, 'arrayBuffer'>);
    expect(first).not.toBe(second);
  });
});
