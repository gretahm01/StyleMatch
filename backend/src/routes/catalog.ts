import { Router } from 'express';
import { filterProducts, getProductById } from '../services/catalogService.js';
import type { CatalogFilters, ProductCategory } from '../types/catalog.js';

export const catalogRouter = Router();

const parsePrice = (value: unknown): number | undefined | 'invalid' => {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(value)) return 'invalid';
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 'invalid';
};

catalogRouter.get('/', (request, response) => {
  const { category, color, style, material, available } = request.query;
  const minPrice = parsePrice(request.query.minPrice);
  const maxPrice = parsePrice(request.query.maxPrice);
  if (minPrice === 'invalid' || maxPrice === 'invalid' || (typeof minPrice === 'number' && typeof maxPrice === 'number' && minPrice > maxPrice)) {
    return response.status(400).json({ message: 'El rango de presupuesto no es válido.' });
  }
  const filters: CatalogFilters = {
    category: category === 'fashion' || category === 'home' ? category as ProductCategory : undefined,
    color: typeof color === 'string' ? color : undefined,
    style: typeof style === 'string' ? style : undefined,
    material: typeof material === 'string' ? material : undefined,
    available: available === 'true',
    minPrice,
    maxPrice,
  };
  const products = filterProducts(filters);
  return response.json({ products, meta: { total: products.length, budgetApplied: minPrice !== undefined || maxPrice !== undefined } });
});

catalogRouter.get('/:id', (request, response) => {
  const product = getProductById(request.params.id);
  if (!product) return response.status(404).json({ message: 'Producto no encontrado' });
  return response.json({ product });
});
