import type { StyleCategory } from './style';
import type { CatalogProduct, CatalogRecommendationScope } from './catalog';
import type { Occasion } from './profile';
import type { InferredPreferences } from './feedback';
export interface ImageAnalysis { category: StyleCategory; relevant: boolean; detectedObject: string; primaryColors: string[]; secondaryColors: string[]; style: string[]; possibleMaterials: string[]; visualDescription: string; observedFeatures: string[]; inferences: string[]; confidenceNotes: string[]; retryReason: string | null; }
export interface ScoreBreakdown { visualScore: number; preferenceScore: number; explicitPreferenceScore: number; inferredPreferenceScore: number; occasionScore: number; complementaryScore: number; totalScore: number; }
export interface Recommendation { product: CatalogProduct; score: number; breakdown: ScoreBreakdown; explanation: string; matchType: 'direct_match' | 'color_harmony' | 'style_compatible' | 'room_compatible'; }
export type AnalysisState = { status: 'idle' } | { status: 'loading'; retrying?: boolean } | { status: 'success'; analysis: ImageAnalysis; mode: 'real' | 'demo'; recommendations: Recommendation[]; recommendationReason: string | null; hasMore: boolean; remainingCount: number; occasion: Occasion; includeDemo: CatalogRecommendationScope; inferredPreferences: InferredPreferences } | { status: 'error'; message: string };
