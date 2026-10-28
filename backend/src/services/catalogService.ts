import catalog from '../data/catalog.json' with { type: 'json' };
import type { CatalogFilters, CatalogProduct, ProductAudience, ProductCategory } from '../types/catalog.js';

type RawCatalogProduct = Omit<CatalogProduct, 'productAudience' | 'activeForRecommendations'> & { productAudience?: ProductAudience; activeForRecommendations?: boolean };
const activeProductIds = new Set(['zara-16428810', 'zara-16483810', 'zara-16048810', 'zara-16869810', 'zara-16448810', 'bershka-2439478800', 'liverpool-1208694282', 'liverpool-1162531426', 'liverpool-1130263881', 'fashion-003', 'fashion-005', 'fashion-011', 'fashion-013', 'ikea-40608529', 'ikea-70544178', 'ikea-60585616', 'home-002', 'home-003', 'home-004', 'home-005', 'home-008', 'home-010']);
const products = (catalog as RawCatalogProduct[]).map((product) => ({ ...product, productAudience: product.productAudience ?? (product.genderTarget === 'mujer' ? 'women' : 'unspecified'), activeForRecommendations: product.activeForRecommendations ?? activeProductIds.has(product.id) }));

const normalize = (value: string) => value.trim().toLocaleLowerCase('es-MX');

export function getAllProducts(): CatalogProduct[] {
  return products;
}

export function getProductsByCategory(category: ProductCategory): CatalogProduct[] {
  return products.filter((product) => product.category === category);
}

export function getProductsByColor(color: string): CatalogProduct[] {
  const search = normalize(color);
  return products.filter((product) => [product.primaryColor, ...product.secondaryColors].some((value) => normalize(value).includes(search)));
}

export function getProductsByStyle(style: string): CatalogProduct[] {
  const search = normalize(style);
  return products.filter((product) => product.styles.some((value) => normalize(value).includes(search)));
}

export function getProductsByMaterial(material: string): CatalogProduct[] {
  const search = normalize(material);
  return products.filter((product) => product.material !== null && normalize(product.material).includes(search));
}

export function getProductById(id: string): CatalogProduct | undefined {
  return products.find((product) => product.id === id);
}

export function getAvailableProducts(): CatalogProduct[] {
  return products.filter((product) => product.available === true && product.availabilityVerified);
}

export function filterProducts(filters: CatalogFilters): CatalogProduct[] {
  return products.filter((product) => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.color && !getProductsByColor(filters.color).some(({ id }) => id === product.id)) return false;
    if (filters.style && !getProductsByStyle(filters.style).some(({ id }) => id === product.id)) return false;
    if (filters.material && !getProductsByMaterial(filters.material).some(({ id }) => id === product.id)) return false;
    if (filters.available && !(product.available === true && product.availabilityVerified)) return false;
    if (filters.audience && filters.audience !== 'unspecified' && product.category === 'fashion' && !(product.productAudience === filters.audience || product.productAudience === 'unisex')) return false;
    if ((filters.minPrice !== undefined || filters.maxPrice !== undefined) && product.price === null) return false;
    if (filters.minPrice !== undefined && product.price! < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && product.price! > filters.maxPrice) return false;
    return true;
  });
}
