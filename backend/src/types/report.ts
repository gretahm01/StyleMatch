import type { ImageAnalysis } from './analysis.js';
import type { Occasion } from './profile.js';
import type { ProductAudience, ProductCategory } from './catalog.js';
import type { Recommendation } from '../services/recommendationEngine.js';
export type PresentationTestCase = 'fashion_casual' | 'fashion_elegant' | 'fashion_bold_color' | 'home_minimalist_room' | 'home_cozy_modern' | null;
export interface PresentationReport { id: string; profileId: string | null; profileAlias: string | null; testCase: PresentationTestCase; category: ProductCategory; occasion: Occasion; minPrice: number | null; maxPrice: number | null; audience: ProductAudience; mode: 'real' | 'demo'; analysis: ImageAnalysis; recommendations: Recommendation[]; manualQuality: string | null; createdAt: string; }
