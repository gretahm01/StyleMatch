import type { CatalogBudget, CatalogProduct, ProductCategory } from '../types/catalog';
import { apiUrl } from './api';

export async function getCatalogProducts(category: ProductCategory, budget: CatalogBudget = {}): Promise<CatalogProduct[]> {
  const parameters = new URLSearchParams({ category });
  if (budget.minPrice !== undefined) parameters.set('minPrice', String(budget.minPrice));
  if (budget.maxPrice !== undefined) parameters.set('maxPrice', String(budget.maxPrice));
  const response = await fetch(apiUrl(`/api/catalog?${parameters.toString()}`));
  if (!response.ok) throw new Error('No se pudo cargar el catálogo');
  const data = await response.json() as { products: CatalogProduct[] };
  return data.products;
}
export async function getAllCatalogProducts(): Promise<CatalogProduct[]> { const response = await fetch(apiUrl('/api/catalog')); if (!response.ok) throw new Error('No fue posible cargar el catálogo'); return (await response.json() as { products: CatalogProduct[] }).products; }
