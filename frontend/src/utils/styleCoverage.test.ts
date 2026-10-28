import { describe, expect, it } from 'vitest';
import { stylesWithCoverage } from './styleCoverage';
import type { CatalogProduct } from '../types/catalog';

const item = (id: string, subcategory: string, style: string, verificationStatus: CatalogProduct['verificationStatus'] = 'demo'): CatalogProduct => ({ id, externalProductId: null, name: id, description: '', store: verificationStatus === 'demo' ? 'StyleMatch Demo' : 'Zara México', productUrl: verificationStatus === 'demo' ? null : 'https://www.zara.com/mx/es/x-p1.html', category: 'fashion', subcategory, primaryColor: 'beige', secondaryColors: [], styles: [style], material: null, price: 100, currency: 'MXN', image: '', imageRightsStatus: 'placeholder_owned', available: verificationStatus === 'demo' ? null : true, availabilityVerified: verificationStatus !== 'demo', tags: [], occasions: [], genderTarget: null, productAudience: 'unisex', activeForRecommendations: true, source: { type: verificationStatus === 'demo' ? 'internal_demo' : 'official_product_page', url: verificationStatus === 'demo' ? null : 'https://www.zara.com/mx/es/x-p1.html' }, lastVerifiedAt: verificationStatus === 'demo' ? null : '2026-10-27T00:00:00-06:00', verificationStatus });

describe('style coverage', () => {
  it('shows styles only with three distinct compatible subcategories', () => expect(stylesWithCoverage([item('a', 'bolsos', 'minimalista'), item('b', 'zapatos', 'minimalista'), item('c', 'chamarras', 'minimalista'), item('d', 'pantalones', 'y2k')], 'fashion', 'include_demo')).toEqual(['minimalista']));
  it('updates coverage between strict and mixed catalog modes', () => {
    const products = [item('a', 'bolsos', 'casual', 'verified'), item('b', 'zapatos', 'casual'), item('c', 'chamarras', 'casual')];
    expect(stylesWithCoverage(products, 'fashion', 'verified_only')).toEqual([]);
    expect(stylesWithCoverage(products, 'fashion', 'include_demo')).toEqual(['casual']);
  });
  it('applies the same distinct-subcategory coverage rule to home styles', () => {
    const products = [
      { ...item('a', 'lamparas', 'nórdico'), category: 'home' as const },
      { ...item('b', 'cojines', 'escandinavo'), category: 'home' as const },
      { ...item('c', 'mesas auxiliares', 'nordico'), category: 'home' as const },
      { ...item('d', 'floreros', 'industrial'), category: 'home' as const },
    ];
    expect(stylesWithCoverage(products, 'home', 'include_demo')).toEqual(['nordico']);
  });
  it('normalizes classic fashion catalog styles to the Old Money control', () => {
    expect(stylesWithCoverage([item('a', 'bolsos', 'clásico'), item('b', 'zapatos', 'clásico'), item('c', 'chamarras', 'clásico')], 'fashion', 'include_demo')).toEqual(['old_money']);
  });
});
