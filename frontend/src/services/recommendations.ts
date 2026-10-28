import type { ImageAnalysis, Recommendation } from '../types/analysis';
import type { CatalogBudget, CatalogRecommendationScope, ProductAudience } from '../types/catalog';
import type { InferredPreferences } from '../types/feedback';
import type { Occasion } from '../types/profile';
import { apiUrl } from './api';

export async function refreshRecommendations(analysis: ImageAnalysis, profileId: string, occasion: Occasion, budget: CatalogBudget, scope: CatalogRecommendationScope, audience: ProductAudience, excludedProductIds: string[] = []): Promise<{ recommendations: Recommendation[]; recommendationReason: string | null; hasMore: boolean; remainingCount: number; occasion: Occasion; includeDemo: CatalogRecommendationScope; inferredPreferences: InferredPreferences }> {
  const response = await fetch(apiUrl('/api/recommendations'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ analysis, profileId, occasion, minPrice: budget.minPrice ?? null, maxPrice: budget.maxPrice ?? null, includeDemo: scope === 'include_demo', audience, excludedProductIds }) });
  const data = await response.json() as { recommendations?: Recommendation[]; reason?: string | null; hasMore?: boolean; remainingCount?: number; occasion?: Occasion; includeDemo?: boolean; inferredPreferences?: InferredPreferences; message?: string };
  if (!response.ok || !data.occasion || !data.inferredPreferences) throw new Error(data.message ?? 'No fue posible actualizar las recomendaciones.');
  return { recommendations: data.recommendations ?? [], recommendationReason: data.reason ?? null, hasMore: data.hasMore === true, remainingCount: data.remainingCount ?? 0, occasion: data.occasion, includeDemo: data.includeDemo === false ? 'verified_only' : 'include_demo', inferredPreferences: data.inferredPreferences };
}
