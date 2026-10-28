import type { ImageAnalysis, Recommendation } from './analysis';
import type { CatalogBudget, ProductAudience, ProductCategory } from './catalog';
import type { Occasion } from './profile';

export type PresentationTestCase = 'fashion_casual' | 'fashion_elegant' | 'fashion_bold_color' | 'home_minimalist_room' | 'home_cozy_modern' | null;
export interface PresentationReport {
  id: string; profileId: string | null; profileAlias: string | null; testCase: PresentationTestCase; category: ProductCategory; occasion: Occasion;
  minPrice: number | null; maxPrice: number | null; audience: ProductAudience; mode: 'real' | 'demo'; analysis: ImageAnalysis;
  recommendations: Recommendation[]; manualQuality: string | null; createdAt: string;
}
export type PresentationReportInput = Omit<PresentationReport, 'id' | 'createdAt'>;
export interface TestCasePreset { id: Exclude<PresentationTestCase, null>; title: string; description: string; category: ProductCategory; occasion: Occasion; budget: CatalogBudget; }

export const presentationTestCases: TestCasePreset[] = [
  { id: 'fashion_casual', title: 'Moda casual', description: 'Prenda cómoda para uso diario.', category: 'fashion', occasion: 'casual', budget: { maxPrice: 1800 } },
  { id: 'fashion_elegant', title: 'Moda elegante', description: 'Look para una cita o evento formal.', category: 'fashion', occasion: 'formal_event', budget: { maxPrice: 3000 } },
  { id: 'fashion_bold_color', title: 'Moda de color llamativo', description: 'Prenda con un color protagonista.', category: 'fashion', occasion: 'party', budget: { maxPrice: 2400 } },
  { id: 'home_minimalist_room', title: 'Habitación minimalista', description: 'Espacio despejado, sobrio y funcional.', category: 'home', occasion: 'minimalist_decor', budget: { maxPrice: 3500 } },
  { id: 'home_cozy_modern', title: 'Espacio acogedor o moderno', description: 'Ambiente cálido con acentos contemporáneos.', category: 'home', occasion: 'cozy_atmosphere', budget: { maxPrice: 3500 } },
];

export function initialValuesForPresentationCase(preset: TestCasePreset) {
  return { category: preset.category, occasion: preset.occasion, budget: { ...preset.budget } };
}
