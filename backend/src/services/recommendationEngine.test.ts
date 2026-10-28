import { describe, expect, it } from 'vitest';
import { recommendProducts } from './recommendationEngine.js';
import { getAllProducts } from './catalogService.js';
import type { CatalogProduct } from '../types/catalog.js';
import type { ImageAnalysis } from '../types/analysis.js';
import type { TasteProfile } from '../types/profile.js';

const analysis: ImageAnalysis = { category: 'fashion', relevant: true, detectedObject: 'vestido', primaryColors: ['beige'], secondaryColors: ['terracota'], style: ['minimalista'], possibleMaterials: ['lino'], visualDescription: 'Vestido beige', observedFeatures: [], inferences: [], confidenceNotes: [], retryReason: null };
const product = (id: string, subcategory: string, color: string, style: string, price = 1000): CatalogProduct => ({ id, externalProductId: null, name: id, description: 'Demo', store: 'StyleMatch Demo', productUrl: null, category: 'fashion', subcategory, primaryColor: color, secondaryColors: [], styles: [style], material: 'lino', price, currency: 'MXN', image: '/images/catalog/fashion-placeholder.svg', imageRightsStatus: 'placeholder_owned', available: null, availabilityVerified: false, tags: ['casual'], occasions: ['casual', 'work', 'date', 'party', 'formal_event', 'daily'], genderTarget: null, productAudience: 'unspecified', source: { type: 'internal_demo', url: null }, lastVerifiedAt: null, verificationStatus: 'demo' });
const products = [product('bag', 'bolsos', 'beige', 'minimalista'), product('shoe', 'zapatos', 'terracota', 'clásico'), product('jacket', 'chamarras', 'beige', 'minimalista'), product('duplicate-bag', 'bolsos', 'beige', 'minimalista'), { ...product('unavailable', 'accesorios', 'beige', 'minimalista'), verificationStatus: 'verified' as const, available: false }];
const beigeProfile: TasteProfile = { id: 'a', alias: null, interestCategory: 'fashion', preferredStyles: ['minimalista'], favoriteColors: ['beige'], avoidedColors: [], preferredMaterials: ['lino'], createdAt: '', updatedAt: '' };
const terracottaProfile: TasteProfile = { ...beigeProfile, id: 'b', favoriteColors: ['terracota'], preferredStyles: ['clásico'] };

describe('recommendation engine', () => {
  it('returns three unique, diverse available candidates and avoids a non-complementary duplicate class', () => {
    const result = recommendProducts({ analysis, profile: beigeProfile, occasion: 'casual', products });
    expect(result.recommendations).toHaveLength(3);
    expect(new Set(result.recommendations.map((item) => item.product.subcategory)).size).toBe(3);
    expect(result.recommendations.map((item) => item.product.id)).not.toContain('unavailable');
  });
  it('changes ranking for different preferences and respects maximum budget', () => {
    const beige = recommendProducts({ analysis, profile: beigeProfile, occasion: 'casual', products });
    const terracotta = recommendProducts({ analysis, profile: terracottaProfile, occasion: 'casual', products });
    const beigeBag = beige.recommendations.find((item) => item.product.id === 'bag')!;
    const terracottaBag = terracotta.recommendations.find((item) => item.product.id === 'bag')!;
    expect(beigeBag.breakdown.preferenceScore).toBeGreaterThan(terracottaBag.breakdown.preferenceScore);
    expect(beigeBag.breakdown.totalScore).toBeGreaterThan(terracottaBag.breakdown.totalScore);
    expect(beigeBag.explanation).toContain('color beige');
    expect(beigeBag.explanation).toContain('estilo preferido minimalista');
    const limited = recommendProducts({ analysis, occasion: 'casual', maxPrice: 900, products });
    expect(limited.recommendations).toHaveLength(0);
    expect(limited.reason).toContain('No hay productos del catálogo actual que combinen de forma verificable');
  });

  it('applies avoided colors as a consistent negative preference factor', () => {
    const avoidBeige: TasteProfile = { ...terracottaProfile, avoidedColors: ['beige'] };
    const withoutAvoidance = recommendProducts({ analysis, profile: terracottaProfile, occasion: 'casual', products });
    const withAvoidance = recommendProducts({ analysis, profile: avoidBeige, occasion: 'casual', products });
    const before = withoutAvoidance.recommendations.find((item) => item.product.id === 'bag')!;
    const after = withAvoidance.recommendations.find((item) => item.product.id === 'bag')!;
    expect(after.breakdown.preferenceScore).toBeLessThan(before.breakdown.preferenceScore);
    expect(after.explanation).toContain('marcado para evitar');
  });
  it('prioritizes a verified compatible product over a DEMO product when scores are tied', () => {
    const real = { ...product('real-bag', 'bolsos', 'beige', 'minimalista'), verificationStatus: 'verified' as const, store: 'Zara México' as const, productUrl: 'https://www.zara.com/mx/es/example-p1.html', available: true, availabilityVerified: true, source: { type: 'official_product_page' as const, url: 'https://www.zara.com/mx/es/example-p1.html' }, lastVerifiedAt: '2026-10-27T18:00:00-06:00' };
    const demo = product('demo-bag', 'bolsos', 'beige', 'minimalista');
    const result = recommendProducts({ analysis: { ...analysis, detectedObject: 'blusa' }, occasion: 'casual', products: [demo, real] });
    expect(result.recommendations[0].product.id).toBe('real-bag');
  });
  it('ranks white-shirt and wine-blouse analyses differently when matching candidates exist', () => {
    const candidates = [product('white-bag', 'bolsos', 'blanco', 'clásico'), product('wine-shoes', 'zapatos', 'vino', 'elegante'), product('neutral-belt', 'cinturones', 'negro', 'casual')];
    const white = recommendProducts({ analysis: { ...analysis, detectedObject: 'camisa blanca', primaryColors: ['blanco'], secondaryColors: [], style: ['clásico'], possibleMaterials: [] }, occasion: 'work', products: candidates });
    const wine = recommendProducts({ analysis: { ...analysis, detectedObject: 'blusa vino', primaryColors: ['vino'], secondaryColors: [], style: ['elegante'], possibleMaterials: [] }, occasion: 'date', products: candidates });
    expect(white.recommendations[0].product.id).toBe('white-bag');
    expect(wine.recommendations[0].product.id).toBe('wine-shoes');
  });
  it('lets a higher visual score beat a verified product with a lower score', () => {
    const visuallyMatchingDemo = product('demo-white-bag', 'bolsos', 'blanco', 'clásico');
    const weakVerified = { ...product('verified-black-shoe', 'zapatos', 'negro', 'casual'), verificationStatus: 'verified' as const, store: 'Liverpool México' as const, productUrl: 'https://www.liverpool.com.mx/tienda/pdp/example/1', available: true, availabilityVerified: true, source: { type: 'official_product_page' as const, url: 'https://www.liverpool.com.mx/tienda/pdp/example/1' }, lastVerifiedAt: '2026-10-27T18:00:00-06:00' };
    const result = recommendProducts({ analysis: { ...analysis, detectedObject: 'camisa blanca', primaryColors: ['blanco'], secondaryColors: [], style: ['clásico'], possibleMaterials: [] }, occasion: 'work', products: [weakVerified, visuallyMatchingDemo] });
    expect(result.recommendations[0].product.id).toBe('demo-white-bag');
    expect(result.recommendations).toHaveLength(2);
    expect(result.recommendations[0].matchType).toBe('direct_match');
  });
  it('uses verified status only as a tie-breaker', () => {
    const demo = product('demo-tie', 'bolsos', 'beige', 'minimalista');
    const verified = { ...product('verified-tie', 'zapatos', 'beige', 'minimalista'), verificationStatus: 'verified' as const, store: 'Zara México' as const, productUrl: 'https://www.zara.com/mx/es/example-p1.html', available: true, availabilityVerified: true, source: { type: 'official_product_page' as const, url: 'https://www.zara.com/mx/es/example-p1.html' }, lastVerifiedAt: '2026-10-27T18:00:00-06:00' };
    const result = recommendProducts({ analysis: { ...analysis, detectedObject: 'blusa', primaryColors: ['beige'], secondaryColors: [], style: ['minimalista'] }, occasion: 'casual', products: [demo, verified] });
    expect(result.recommendations[0].score).toBe(result.recommendations[1].score);
    expect(result.recommendations[0].product.id).toBe('verified-tie');
  });
  it('excludes every DEMO product in verified-only mode and explains a short real result', () => {
    const real = { ...product('real-shoe', 'zapatos', 'beige', 'minimalista'), verificationStatus: 'verified' as const, store: 'Liverpool México' as const, productUrl: 'https://www.liverpool.com.mx/tienda/pdp/tenis-para-mujer/1176394218', available: true, availabilityVerified: true, source: { type: 'official_product_page' as const, url: 'https://www.liverpool.com.mx/tienda/pdp/tenis-para-mujer/1176394218' }, lastVerifiedAt: '2026-10-27T18:00:00-06:00' };
    const result = recommendProducts({ analysis: { ...analysis, detectedObject: 'camisa blanca clásica' }, occasion: 'work', includeDemo: false, products: [real, product('demo-bag', 'bolsos', 'beige', 'minimalista')] });
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations.every((item) => item.product.verificationStatus === 'verified')).toBe(true);
    expect(result.reason).toContain('tiendas reales');
  });
  it('uses complement rules for a white shirt and does not return another shirt or duplicate subcategories', () => {
    const shirt = product('shirt', 'blusas', 'blanco', 'clásico');
    const candidates = [shirt, product('pants', 'pantalones', 'negro', 'clásico'), product('shoes', 'zapatos', 'blanco', 'clásico'), product('belt', 'cinturones', 'negro', 'clásico'), product('bag', 'bolsos', 'beige', 'clásico')];
    const result = recommendProducts({ analysis: { ...analysis, detectedObject: 'Camisa blanca clásica', primaryColors: ['blanco'], style: ['clásico'] }, occasion: 'work', products: candidates });
    expect(result.recommendations.map((item) => item.product.subcategory)).not.toContain('blusas');
    expect(new Set(result.recommendations.map((item) => item.product.subcategory)).size).toBe(result.recommendations.length);
  });
  it('filters fashion products by audience while keeping unisex only for compatible selections', () => {
    const women = { ...product('women-bag', 'bolsos', 'beige', 'minimalista'), productAudience: 'women' as const };
    const men = { ...product('men-belt', 'cinturones', 'negro', 'minimalista'), productAudience: 'men' as const };
    const unisex = { ...product('unisex-shoes', 'zapatos', 'beige', 'minimalista'), productAudience: 'unisex' as const };
    const unspecified = product('unspecified-jacket', 'chamarras', 'beige', 'minimalista');
    const womenResult = recommendProducts({ analysis: { ...analysis, detectedObject: 'camisa' }, occasion: 'casual', audience: 'women', products: [women, men, unisex, unspecified] });
    expect(womenResult.recommendations.map((item) => item.product.id)).toEqual(expect.arrayContaining(['women-bag', 'unisex-shoes']));
    expect(womenResult.recommendations.map((item) => item.product.id)).not.toContain('men-belt');
    expect(womenResult.recommendations.map((item) => item.product.id)).not.toContain('unspecified-jacket');
    const anyResult = recommendProducts({ analysis: { ...analysis, detectedObject: 'camisa' }, occasion: 'casual', audience: 'unspecified', products: [women, men, unisex, unspecified] });
    expect(anyResult.recommendations).toHaveLength(3);
  });
  it('paginates compatible products without repeating IDs or subcategories and reports exhaustion', () => {
    const candidates = [product('page-bag', 'bolsos', 'blanco', 'clásico'), product('page-shoes', 'zapatos', 'blanco', 'clásico'), product('page-belt', 'cinturones', 'negro', 'clásico'), product('page-jacket', 'chamarras', 'blanco', 'clásico'), product('page-pants', 'pantalones', 'negro', 'clásico')];
    const input = { analysis: { ...analysis, detectedObject: 'camisa blanca', primaryColors: ['blanco'], secondaryColors: [], style: ['clásico'] }, occasion: 'work' as const, products: candidates };
    const first = recommendProducts(input);
    const second = recommendProducts({ ...input, excludedProductIds: first.recommendations.map((item) => item.product.id), excludedSubcategories: first.recommendations.map((item) => item.product.subcategory) });
    expect(first.hasMore).toBe(true);
    expect(second.recommendations.some((item) => first.recommendations.some((shown) => shown.product.id === item.product.id || shown.product.subcategory === item.product.subcategory))).toBe(false);
    const exhausted = recommendProducts({ ...input, excludedProductIds: [...first.recommendations, ...second.recommendations].map((item) => item.product.id), excludedSubcategories: [...first.recommendations, ...second.recommendations].map((item) => item.product.subcategory) });
    expect(exhausted.hasMore).toBe(false);
    expect(exhausted.remainingCount).toBe(0);
  });
  it('mixes verified and DEMO fashion candidates, while strict mode excludes DEMO', () => {
    const verified = { ...product('fashion-verified', 'bolsos', 'blanco', 'clásico'), verificationStatus: 'verified' as const, store: 'Zara México' as const, productUrl: 'https://www.zara.com/mx/es/example-p1.html', available: true, availabilityVerified: true, source: { type: 'official_product_page' as const, url: 'https://www.zara.com/mx/es/example-p1.html' }, lastVerifiedAt: '2026-10-27T18:00:00-06:00' };
    const demo = product('fashion-demo', 'zapatos', 'blanco', 'clásico');
    const input = { analysis: { ...analysis, detectedObject: 'camisa blanca', primaryColors: ['blanco'], secondaryColors: [], style: ['clásico'] }, occasion: 'work' as const, products: [verified, demo] };
    const mixed = recommendProducts({ ...input, includeDemo: true });
    expect(new Set(mixed.recommendations.map((item) => item.product.verificationStatus))).toEqual(new Set(['verified', 'demo']));
    expect(recommendProducts({ ...input, includeDemo: false }).recommendations.every((item) => item.product.verificationStatus === 'verified')).toBe(true);
  });
  it('mixes verified and DEMO home candidates with the same origin rules', () => {
    const base = { ...product('home-demo', 'cojines', 'beige', 'minimalista'), category: 'home' as const, store: 'StyleMatch Demo' as const, productAudience: 'unspecified' as const, occasions: ['renew_living_room'] };
    const verified = { ...base, id: 'home-verified', subcategory: 'lámparas', verificationStatus: 'verified' as const, store: 'IKEA México' as const, productUrl: 'https://www.ikea.com/mx/es/p/example/', available: true, availabilityVerified: true, source: { type: 'official_product_page' as const, url: 'https://www.ikea.com/mx/es/p/example/' }, lastVerifiedAt: '2026-10-27T18:00:00-06:00' };
    const result = recommendProducts({ analysis: { ...analysis, category: 'home', detectedObject: 'sala', primaryColors: ['beige'], secondaryColors: [], style: ['minimalista'] }, occasion: 'renew_living_room', includeDemo: true, products: [base, verified] });
    expect(new Set(result.recommendations.map((item) => item.product.verificationStatus))).toEqual(new Set(['verified', 'demo']));
  });
  it('uses the real catalog to differentiate white, wine and black visual analyses', () => {
    const catalog = getAllProducts();
    const white = recommendProducts({ analysis: { ...analysis, detectedObject: 'camisa blanca', primaryColors: ['blanco'], secondaryColors: [], style: ['clásico'], possibleMaterials: [] }, occasion: 'daily', includeDemo: true, products: catalog });
    const wine = recommendProducts({ analysis: { ...analysis, detectedObject: 'blusa vino', primaryColors: ['vino'], secondaryColors: [], style: ['elegante'], possibleMaterials: [] }, occasion: 'date', includeDemo: true, products: catalog });
    const black = recommendProducts({ analysis: { ...analysis, detectedObject: 'pantalón negro', primaryColors: ['negro'], secondaryColors: [], style: ['casual'], possibleMaterials: [] }, occasion: 'casual', includeDemo: true, products: catalog });
    expect(white.recommendations.every((item) => ['direct_match', 'color_harmony', 'style_compatible', 'room_compatible'].includes(item.matchType))).toBe(true);
    expect(new Set(white.recommendations.map((item) => item.product.id))).not.toEqual(new Set(wine.recommendations.map((item) => item.product.id)));
    expect(white.recommendations.some((item) => item.product.primaryColor === 'blanco' && item.matchType === 'direct_match')).toBe(true);
    expect(wine.recommendations.some((item) => item.matchType === 'direct_match' && item.product.styles.includes('elegante'))).toBe(true);
    expect(new Set(black.recommendations.map((item) => item.product.id))).not.toEqual(new Set(white.recommendations.map((item) => item.product.id)));
  });
  it('uses explicit color harmony only after the product declares the selected occasion', () => {
    const blackPartyBag = { ...product('black-party-bag', 'bolsos', 'negro', 'urbano'), occasions: ['party'] };
    const result = recommendProducts({ analysis: { ...analysis, detectedObject: 'blusa', primaryColors: ['vino'], secondaryColors: [], style: ['romántico'], possibleMaterials: [] }, occasion: 'party', products: [blackPartyBag] });
    expect(result.recommendations[0].matchType).toBe('color_harmony');
    expect(result.recommendations[0].explanation).toContain('armonía de color: vino + negro');
  });
  it('uses real catalog occasions as a strict eligibility rule for formal and party looks', () => {
    const catalog = getAllProducts();
    const formal = recommendProducts({ analysis: { ...analysis, detectedObject: 'blusa', primaryColors: ['negro'], secondaryColors: [], style: ['clásico'], possibleMaterials: [] }, occasion: 'formal_event', includeDemo: true, products: catalog });
    const party = recommendProducts({ analysis: { ...analysis, detectedObject: 'blusa', primaryColors: ['verde lima'], secondaryColors: [], style: ['elegante'], possibleMaterials: [] }, occasion: 'party', includeDemo: true, products: catalog });
    expect(formal.recommendations.every((item) => item.product.occasions.includes('formal_event'))).toBe(true);
    expect(formal.recommendations.map((item) => item.product.id)).not.toEqual(expect.arrayContaining(['bershka-2439478800', 'liverpool-1174669813', 'liverpool-1176394218']));
    expect(party.recommendations[0].product.id).toBe('zara-16483810');
    expect(party.recommendations.every((item) => item.product.occasions.includes('party'))).toBe(true);
    expect(party.reason).toContain('Solo hay');
  });
  it('does not let profile, favorite color or inferred preferences bypass occasions', () => {
    const casualBlack = { ...product('casual-black', 'bolsos', 'negro', 'casual'), occasions: ['casual'] };
    const result = recommendProducts({ analysis: { ...analysis, detectedObject: 'blusa', primaryColors: ['negro'], secondaryColors: [], style: ['casual'], possibleMaterials: [] }, profile: { ...beigeProfile, favoriteColors: ['negro'], preferredStyles: ['casual'] }, occasion: 'formal_event', products: [casualBlack] });
    expect(result.recommendations).toEqual([]);
  });
  it('excludes a product that only matches the profile or occasion', () => {
    const profileOnly = { ...product('profile-only', 'bolsos', 'rojo', 'urbano'), tags: ['oficina'] };
    const result = recommendProducts({ analysis: { ...analysis, detectedObject: 'camisa blanca', primaryColors: ['blanco'], secondaryColors: [], style: ['clásico'], possibleMaterials: [] }, profile: { ...beigeProfile, favoriteColors: ['rojo'], preferredStyles: ['urbano'] }, occasion: 'work', products: [profileOnly] });
    expect(result.recommendations).toEqual([]);
    expect(result.reason).toBe('No hay productos del catálogo actual que combinen de forma verificable con esta foto.');
  });
  it('applies the same visual eligibility rule to the real home catalog', () => {
    const result = recommendProducts({ analysis: { ...analysis, category: 'home', detectedObject: 'sala', primaryColors: ['beige'], secondaryColors: [], style: ['minimalista'], possibleMaterials: [] }, occasion: 'renew_living_room', includeDemo: true, products: getAllProducts() });
    expect(result.recommendations.every((item) => ['direct_match', 'color_harmony', 'style_compatible', 'room_compatible'].includes(item.matchType))).toBe(true);
    expect(result.recommendations.every((item) => item.matchType !== 'color_harmony' || item.explanation.includes('armonía de color:'))).toBe(true);
    expect(new Set(result.recommendations.map((item) => item.product.id)).size).toBe(result.recommendations.length);
    expect(new Set(result.recommendations.map((item) => item.product.subcategory)).size).toBe(result.recommendations.length);
  });
  it('uses declared home occasions strictly for a workspace', () => {
    const result = recommendProducts({ analysis: { ...analysis, category: 'home', detectedObject: 'espacio de trabajo', primaryColors: ['azul'], secondaryColors: [], style: ['minimalista'], possibleMaterials: [] }, occasion: 'workspace', includeDemo: true, products: getAllProducts() });
    expect(result.recommendations).not.toEqual([]);
    expect(result.recommendations.every((item) => item.product.occasions.includes('workspace'))).toBe(true);
    expect(result.recommendations.every((item) => item.product.subcategory === 'lámparas')).toBe(true);
  });
  it('returns no filler or additional pages when the real catalog has no verifiable match', () => {
    const result = recommendProducts({ analysis: { ...analysis, category: 'home', detectedObject: 'sala', primaryColors: ['morado'], secondaryColors: [], style: ['industrial'], possibleMaterials: [] }, occasion: 'renew_living_room', includeDemo: true, products: getAllProducts() });
    expect(result.recommendations).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.reason).toBe('No hay productos del catálogo actual que combinen de forma verificable con esta foto.');
  });
  it('does not repeat real-catalog IDs or subcategories between direct-match pages', () => {
    const input = { analysis: { ...analysis, detectedObject: 'camisa negra', primaryColors: ['negro'], secondaryColors: [], style: ['casual'], possibleMaterials: [] }, occasion: 'casual' as const, includeDemo: true, products: getAllProducts() };
    const first = recommendProducts(input);
    const second = recommendProducts({ ...input, excludedProductIds: first.recommendations.map((item) => item.product.id), excludedSubcategories: first.recommendations.map((item) => item.product.subcategory) });
    expect(first.recommendations).toHaveLength(3);
    expect(second.recommendations.some((item) => first.recommendations.some((shown) => shown.product.id === item.product.id || shown.product.subcategory === item.product.subcategory))).toBe(false);
    expect(second.recommendations.every((item) => ['direct_match', 'color_harmony', 'style_compatible', 'room_compatible'].includes(item.matchType))).toBe(true);
  });
  it('allows only declared business-casual products for work and keeps casual sportswear out', () => {
    const result = recommendProducts({ analysis: { ...analysis, detectedObject: 'camisa blanca', primaryColors: ['blanco'], secondaryColors: [], style: ['casual'], possibleMaterials: [] }, occasion: 'work', includeDemo: true, products: getAllProducts() });
    const ids = result.recommendations.map((item) => item.product.id);
    expect(ids).toEqual(expect.arrayContaining(['liverpool-1162531426', 'zara-16448810']));
    expect(ids.some((id) => ['liverpool-1208694282', 'liverpool-1130263881'].includes(id))).toBe(true);
    expect(ids).not.toEqual(expect.arrayContaining(['bershka-2439478800', 'liverpool-1174669813', 'liverpool-1208825000']));
    expect(result.recommendations.every((item) => item.product.occasions.includes('work'))).toBe(true);
  });
  it('keeps formal event strict even when profile signals favor casual black products', () => {
    const result = recommendProducts({ analysis: { ...analysis, detectedObject: 'blusa negra', primaryColors: ['negro'], secondaryColors: [], style: ['clásico'], possibleMaterials: [] }, profile: { ...beigeProfile, favoriteColors: ['negro'], preferredStyles: ['casual'] }, occasion: 'formal_event', includeDemo: true, products: getAllProducts() });
    expect(result.recommendations.every((item) => item.product.occasions.includes('formal_event'))).toBe(true);
    expect(result.recommendations.map((item) => item.product.id)).not.toEqual(expect.arrayContaining(['bershka-2439478800', 'liverpool-1174669813', 'liverpool-1208825000', 'liverpool-1162531426']));
  });
  it('prioritizes the declared green satin party bag when it visually matches the party look', () => {
    const green = recommendProducts({ analysis: { ...analysis, detectedObject: 'blusa verde lima', primaryColors: ['verde lima'], secondaryColors: [], style: ['elegante'], possibleMaterials: [] }, occasion: 'party', includeDemo: true, products: getAllProducts() });
    const orange = recommendProducts({ analysis: { ...analysis, detectedObject: 'blusa naranja', primaryColors: ['naranja'], secondaryColors: [], style: ['elegante'], possibleMaterials: [] }, occasion: 'party', includeDemo: true, products: getAllProducts() });
    expect(green.recommendations[0]?.product.id).toBe('zara-16483810');
    expect(orange.recommendations[0]?.product.id).toBe('zara-16869810');
    expect(green.recommendations.every((item) => item.product.occasions.includes('party'))).toBe(true);
    expect(orange.recommendations.every((item) => item.product.occasions.includes('party'))).toBe(true);
  });
  it('uses only declared bedroom-context objects for a bedroom analysis', () => {
    const result = recommendProducts({ analysis: { ...analysis, category: 'home', detectedObject: 'habitación minimalista', primaryColors: ['morado'], secondaryColors: [], style: ['industrial'], possibleMaterials: [] }, occasion: 'decorate_bedroom', includeDemo: true, products: getAllProducts() });
    const bedroomSubcategories = new Set(['lámparas', 'alfombras', 'cojines', 'cuadros', 'floreros', 'decoraciones']);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations.every((item) => item.product.occasions.includes('decorate_bedroom'))).toBe(true);
    expect(result.recommendations.every((item) => bedroomSubcategories.has(item.product.subcategory))).toBe(true);
    expect(result.recommendations.some((item) => item.matchType === 'room_compatible')).toBe(true);
  });
});
