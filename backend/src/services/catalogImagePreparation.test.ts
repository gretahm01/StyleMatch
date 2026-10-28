import { describe, expect, it } from 'vitest';
import { buildCatalogImagePrompt, getPendingCatalogImageTasks } from './catalogImagePreparation.js';
import type { CatalogProduct } from '../types/catalog.js';

const product = (overrides: Partial<CatalogProduct> = {}): CatalogProduct => ({
  id: 'demo-bag', externalProductId: null, name: 'Bolso arena', description: 'Demo', store: 'StyleMatch Demo', productUrl: null,
  category: 'fashion', subcategory: 'bolsos', primaryColor: 'beige', secondaryColors: ['crema'], styles: ['minimalista'], material: 'piel vegana',
  price: 1000, currency: 'MXN', image: '/images/catalog/demo-bag.svg', imageRightsStatus: 'placeholder_owned', available: true,
  availabilityVerified: true, tags: [], occasions: [], genderTarget: null, productAudience: 'unisex', activeForRecommendations: true,
  source: { type: 'internal_demo', url: null }, lastVerifiedAt: null, verificationStatus: 'demo', ...overrides,
});

describe('catalog image preparation', () => {
  it('selects only active products whose current asset is SVG and retains the fallback path', () => {
    const tasks = getPendingCatalogImageTasks([product(), product({ id: 'photo', image: '/images/catalog/photo.png', imageRightsStatus: 'generated_owned' }), product({ id: 'inactive', activeForRecommendations: false })]);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({ id: 'demo-bag', fallbackImage: '/images/catalog/demo-bag.svg', outputBaseName: 'demo-bag-gemini' });
  });

  it('creates a generic prompt from catalog attributes without brands or logos', () => {
    const prompt = buildCatalogImagePrompt(product());
    expect(prompt).toContain('Bolso arena');
    expect(prompt).toContain('beige');
    expect(prompt).toContain('piel vegana');
    expect(prompt).toContain('no logos');
    expect(prompt).toContain('not an official photograph');
  });
});
