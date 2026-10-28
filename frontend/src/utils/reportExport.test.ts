import { describe, expect, it } from 'vitest';
import { serializePresentationReports } from './reportExport';

describe('exportación de reportes', () => {
  it('preserva modo, presupuesto y resultados sin incluir fotografías', () => {
    const json = serializePresentationReports([{ id: 'report-1', profileId: null, profileAlias: 'Perfil de presentación', testCase: 'fashion_casual', category: 'fashion', occasion: 'casual', minPrice: null, maxPrice: 1800, audience: 'unspecified', mode: 'demo', analysis: { category: 'fashion', relevant: true, detectedObject: 'Prenda', primaryColors: ['beige'], secondaryColors: [], style: ['casual'], possibleMaterials: [], visualDescription: 'Resultado DEMO', observedFeatures: [], inferences: [], confidenceNotes: [], retryReason: null }, recommendations: [], manualQuality: 'Correcto', createdAt: '2026-10-27T00:00:00.000Z' }]);
    const parsed = JSON.parse(json) as { reports: Array<{ mode: string; maxPrice: number; image?: unknown }> };
    expect(parsed.reports[0]).toMatchObject({ mode: 'demo', maxPrice: 1800 });
    expect(parsed.reports[0]).not.toHaveProperty('image');
  });
});
