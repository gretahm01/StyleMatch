import type { CatalogProduct, CatalogRecommendationScope } from '../types/catalog';
import type { StyleCategory } from '../types/style';

const normalize = (value: string) => value.trim().toLocaleLowerCase('es-MX').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const fashionAliases: Record<string, string> = {
  clasico: 'old_money',
  old_money: 'old_money',
  'old money': 'old_money',
  bohemio: 'boho',
  boho: 'boho',
};
const homeAliases: Record<string, string> = {
  escandinavo: 'nordico',
  nordico: 'nordico',
  boho: 'bohemio',
  bohemio: 'bohemio',
};
const key = (value: string, category: StyleCategory) => {
  const normalized = normalize(value);
  return (category === 'fashion' ? fashionAliases : homeAliases)[normalized] ?? normalized;
};

export function stylesWithCoverage(products: CatalogProduct[], category: StyleCategory, scope: CatalogRecommendationScope): string[] {
  const coverage = new Map<string, Set<string>>();
  for (const product of products) {
    if (product.activeForRecommendations === false || product.category !== category || product.price === null) continue;
    if (scope === 'verified_only' && product.verificationStatus !== 'verified') continue;
    if (product.verificationStatus !== 'demo' && !(product.available === true && product.availabilityVerified)) continue;
    for (const style of product.styles) {
      const styleKey = key(style, category);
      const subcategories = coverage.get(styleKey) ?? new Set<string>();
      subcategories.add(normalize(product.subcategory));
      coverage.set(styleKey, subcategories);
    }
  }
  return [...coverage.entries()].filter(([, subcategories]) => subcategories.size >= 3).map(([style]) => style);
}
