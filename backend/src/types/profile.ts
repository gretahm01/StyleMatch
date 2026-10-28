import type { ProductCategory } from './catalog.js';

export type InterestCategory = ProductCategory | 'both';
export type Occasion = 'casual' | 'work' | 'date' | 'party' | 'formal_event' | 'daily' | 'renew_living_room' | 'decorate_bedroom' | 'workspace' | 'cozy_atmosphere' | 'minimalist_decor';

export interface TasteProfile {
  id: string;
  alias: string | null;
  interestCategory: InterestCategory;
  preferredStyles: string[];
  fashionStyles: string[];
  homeStyles: string[];
  favoriteColors: string[];
  avoidedColors: string[];
  preferredMaterials: string[];
  fashionPriorities: string[];
  fashionCuts: string[];
  fashionPatterns: string[];
  createdAt: string;
  updatedAt: string;
}
