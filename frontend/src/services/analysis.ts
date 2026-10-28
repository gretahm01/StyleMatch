import type { ImageAnalysis, Recommendation } from '../types/analysis';
import type { CatalogBudget, CatalogRecommendationScope, ProductAudience } from '../types/catalog';
import type { InferredPreferences } from '../types/feedback';
import type { Occasion } from '../types/profile';
import type { StyleCategory } from '../types/style';
import { apiUrl } from './api';

const emptyInferred: InferredPreferences = { feedbackCount: 0, active: false, confidence: 'insufficient', colors: [], styles: [], materials: [], subcategories: [] };
export async function analyzeImage(file: File, category: StyleCategory, mode: 'real' | 'demo', options: { profileId: string; occasion: Occasion; budget: CatalogBudget; scope: CatalogRecommendationScope; audience: ProductAudience }): Promise<{ analysis: ImageAnalysis; mode: 'real' | 'demo'; recommendations: Recommendation[]; recommendationReason: string | null; hasMore: boolean; remainingCount: number; occasion: Occasion; includeDemo: CatalogRecommendationScope; inferredPreferences: InferredPreferences }> {
  const body = new FormData(); body.append('image', file); body.append('category', category); body.append('mode', mode); body.append('profileId', options.profileId); body.append('occasion', options.occasion);
  body.append('includeDemo', String(options.scope === 'include_demo')); body.append('audience', options.audience); if (options.budget.minPrice !== undefined) body.append('minPrice', String(options.budget.minPrice)); if (options.budget.maxPrice !== undefined) body.append('maxPrice', String(options.budget.maxPrice));
  const response = await fetch(apiUrl('/api/analyze'), { method: 'POST', body });
  const data = await response.json() as { analysis?: ImageAnalysis; mode?: 'real' | 'demo'; recommendations?: Recommendation[]; reason?: string | null; hasMore?: boolean; remainingCount?: number; occasion?: Occasion; includeDemo?: boolean; inferredPreferences?: InferredPreferences; message?: string };
  if (!response.ok || !data.analysis || !data.mode) throw new Error(data.message ?? 'No fue posible analizar la fotografía.');
  return { analysis: data.analysis, mode: data.mode, recommendations: data.recommendations ?? [], recommendationReason: data.reason ?? null, hasMore: data.hasMore === true, remainingCount: data.remainingCount ?? 0, occasion: data.occasion ?? options.occasion, includeDemo: data.includeDemo === false ? 'verified_only' : 'include_demo', inferredPreferences: data.inferredPreferences ?? emptyInferred };
}
