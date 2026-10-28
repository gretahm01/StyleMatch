import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './app.js';
import catalog from './data/catalog.json' with { type: 'json' };
import {
  getAllProducts,
  getAvailableProducts,
  getProductById,
  getProductsByCategory,
  getProductsByColor,
  getProductsByMaterial,
  getProductsByStyle,
} from './services/catalogService.js';
import { catalogSchema } from './schemas/catalog.js';

describe('API base', () => {
  it('reports its health', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', service: 'stylematch-api' });
  });

  it('validates analyze uploads before reaching the model', async () => {
    const missing = await request(app).post('/api/analyze').field('category', 'fashion');
    const invalid = await request(app).post('/api/analyze').field('category', 'fashion').field('occasion', 'casual').attach('image', Buffer.from('not an image'), { filename: 'archivo.jpg', contentType: 'image/jpeg' });
    expect(missing.status).toBe(400);
    expect(invalid.status).toBe(422);
  });

  it('returns an explicitly identified demo analysis without OpenAI credentials', async () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9JUDcAAAAASUVORK5CYII=', 'base64');
    const response = await request(app).post('/api/analyze').field('category', 'fashion').field('mode', 'demo').field('occasion', 'casual').attach('image', png, { filename: 'prueba.png', contentType: 'image/png' });
    expect(response.status).toBe(200);
    expect(response.body.mode).toBe('demo');
    expect(response.body.analysis.confidenceNotes[0]).toContain('demostración');
    expect(response.body.recommendations.length).toBeLessThanOrEqual(3);
    expect(response.body.recommendations.every((item: { matchType: string; explanation: string }) => ['direct_match', 'color_harmony', 'style_compatible', 'room_compatible'].includes(item.matchType))).toBe(true);
  });

  it('creates, updates and deletes a local profile using validated JSON', async () => {
    const id = '98d6938d-7fcd-4dd9-a22c-0eaa3c7e99ca';
    const input = { id, alias: 'Luna', interestCategory: 'fashion', preferredStyles: ['minimalista'], favoriteColors: ['beige'], avoidedColors: ['negro'], preferredMaterials: ['lino'] };
    const created = await request(app).post('/api/profiles').send(input);
    expect(created.status).toBe(201);
    expect(created.body.profile.alias).toBe('Luna');
    const updated = await request(app).put(`/api/profiles/${id}`).send({ ...input, alias: 'Sol', id: undefined });
    expect(updated.status).toBe(200);
    expect(updated.body.profile.alias).toBe('Sol');
    expect((await request(app).delete(`/api/profiles/${id}`)).status).toBe(204);
    expect((await request(app).get(`/api/profiles/${id}`)).status).toBe(404);
  });

  it('rejects a color marked both as favorite and to avoid', async () => {
    const response = await request(app).post('/api/profiles').send({ id: '34235fc3-e9f3-4d2f-a20f-c6507c96f034', interestCategory: 'both', preferredStyles: [], favoriteColors: ['beige'], avoidedColors: ['beige'], preferredMaterials: [] });
    expect(response.status).toBe(400);
  });

  it('exposes the local catalog', async () => {
    const response = await request(app).get('/api/catalog');

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(54);
  });

  it('filters known prices by a valid budget and rejects invalid ranges', async () => {
    const response = await request(app).get('/api/catalog?category=fashion&minPrice=1000&maxPrice=1300');
    expect(response.status).toBe(200);
    expect(response.body.products.length).toBeGreaterThan(0);
    expect(response.body.products.every((product: { price: number }) => product.price >= 1000 && product.price <= 1300)).toBe(true);
    expect((await request(app).get('/api/catalog?minPrice=900&maxPrice=100')).status).toBe(400);
  });

  it('requires an occasion compatible with the selected category', async () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9JUDcAAAAASUVORK5CYII=', 'base64');
    const response = await request(app).post('/api/analyze').field('category', 'fashion').field('mode', 'demo').field('occasion', 'workspace').attach('image', png, { filename: 'prueba.png', contentType: 'image/png' });
    expect(response.status).toBe(400);
  });

  it('returns personalized recommendations in the complete simulated DEMO flow', async () => {
    const id = '89c56e9d-6c13-47fd-8a7f-4edb9635630c';
    await request(app).post('/api/profiles').send({ id, alias: 'Perfil de prueba', interestCategory: 'fashion', preferredStyles: ['minimalista'], favoriteColors: ['beige'], avoidedColors: [], preferredMaterials: ['lino'] });
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9JUDcAAAAASUVORK5CYII=', 'base64');
    const response = await request(app).post('/api/analyze').field('category', 'fashion').field('mode', 'demo').field('occasion', 'casual').field('profileId', id).field('maxPrice', '1500').attach('image', png, { filename: 'prueba.png', contentType: 'image/png' });
    expect(response.status).toBe(200);
    expect(response.body.profileId).toBe(id);
    expect(response.body.recommendations.length).toBeLessThanOrEqual(3);
    expect(response.body.recommendations.every((item: { product: { price: number } }) => item.product.price <= 1500)).toBe(true);
  });

  it('recalculates recommendations from an existing analysis without calling Gemini', async () => {
    const analysis = { category: 'fashion', relevant: true, detectedObject: 'Camisa', primaryColors: ['blanco'], secondaryColors: [], style: ['clásico'], possibleMaterials: [], visualDescription: 'Camisa blanca clásica', observedFeatures: ['camisa blanca'], inferences: [], confidenceNotes: [], retryReason: null };
    const response = await request(app).post('/api/recommendations').send({ analysis, occasion: 'work', minPrice: 0, maxPrice: 1500, includeDemo: false });
    expect(response.status).toBe(200);
    expect(response.body.occasion).toBe('work');
    expect(response.body.includeDemo).toBe(false);
    expect(response.body.recommendations.every((item: { product: { price: number }; productId?: string }) => item.product.price <= 1500)).toBe(true);
    expect(response.body.recommendations.every((item: { product: { verificationStatus: string } }) => item.product.verificationStatus === 'verified')).toBe(true);
    expect(new Set(response.body.recommendations.map((item: { product: { id: string } }) => item.product.id)).size).toBe(response.body.recommendations.length);
  });

  it('paginates local recommendations with excluded IDs without invoking an AI provider', async () => {
    const analysis = { category: 'fashion', relevant: true, detectedObject: 'Camisa', primaryColors: ['blanco'], secondaryColors: [], style: ['clásico'], possibleMaterials: [], visualDescription: 'Camisa blanca clásica', observedFeatures: [], inferences: [], confidenceNotes: [], retryReason: null };
    const first = await request(app).post('/api/recommendations').send({ analysis, occasion: 'work', includeDemo: true });
    expect(first.status).toBe(200);
    expect(first.body).toHaveProperty('hasMore');
    const shown = first.body.recommendations.map((item: { product: { id: string } }) => item.product.id);
    const second = await request(app).post('/api/recommendations').send({ analysis, occasion: 'work', includeDemo: true, excludedProductIds: shown });
    expect(second.status).toBe(200);
    expect(second.body.recommendations.some((item: { product: { id: string } }) => shown.includes(item.product.id))).toBe(false);
  });

  it('keeps four simulated presentation analyses within budget and without duplicate products', async () => {
    const scenarios = [
      { category: 'fashion', occasion: 'work', detectedObject: 'Camisa', primaryColors: ['blanco'], style: ['clásico'], description: 'Camisa blanca clásica' },
      { category: 'fashion', occasion: 'formal_event', detectedObject: 'Blusa', primaryColors: ['vino'], style: ['elegante'], description: 'Blusa borgoña elegante' },
      { category: 'fashion', occasion: 'casual', detectedObject: 'Pantalón', primaryColors: ['negro'], style: ['casual'], description: 'Pantalón negro casual' },
      { category: 'home', occasion: 'minimalist_decor', detectedObject: 'Habitación', primaryColors: ['blanco', 'beige'], style: ['minimalista'], description: 'Habitación minimalista' },
    ];
    for (const scenario of scenarios) {
      const analysis = { category: scenario.category, relevant: true, detectedObject: scenario.detectedObject, primaryColors: scenario.primaryColors, secondaryColors: [], style: scenario.style, possibleMaterials: [], visualDescription: scenario.description, observedFeatures: [], inferences: [], confidenceNotes: [], retryReason: null };
      const response = await request(app).post('/api/recommendations').send({ analysis, occasion: scenario.occasion, maxPrice: 2000 });
      expect(response.status).toBe(200);
      expect(response.body.recommendations.every((item: { product: { price: number } }) => item.product.price <= 2000)).toBe(true);
      expect(new Set(response.body.recommendations.map((item: { product: { id: string } }) => item.product.id)).size).toBe(response.body.recommendations.length);
    }
  });

  it('persists a presentation report without storing the uploaded photograph', async () => {
    const payload = { profileId: null, testCase: 'fashion_casual', category: 'fashion', occasion: 'casual', minPrice: null, maxPrice: 1800, mode: 'demo', analysis: { category: 'fashion', relevant: true, detectedObject: 'Prenda casual', primaryColors: ['beige'], secondaryColors: [], style: ['casual'], possibleMaterials: [], visualDescription: 'Resultado DEMO', observedFeatures: ['silueta'], inferences: [], confidenceNotes: ['DEMO'], retryReason: null }, recommendations: [], manualQuality: 'La prueba está lista para la presentación.' };
    const created = await request(app).post('/api/reports').send(payload);
    expect(created.status).toBe(201);
    expect(created.body.report.mode).toBe('demo');
    expect(created.body.report).not.toHaveProperty('image');
    const listed = await request(app).get('/api/reports');
    expect(listed.status).toBe(200);
    expect(listed.body.reports.some((report: { id: string }) => report.id === created.body.report.id)).toBe(true);
  });
});

describe('catalog integrity', () => {
  it('keeps DEMO records and adds separately identified verified products', () => {
    expect(catalog).toHaveLength(54);
    expect(catalog.filter((product) => product.verificationStatus === 'demo')).toHaveLength(30);
    expect(catalog.filter((product) => product.verificationStatus === 'verified')).toHaveLength(24);
    expect(catalog.filter((product) => product.category === 'fashion')).toHaveLength(30);
    expect(catalog.filter((product) => product.category === 'home')).toHaveLength(24);
  });

  it('keeps a compact active catalog while preserving inactive records as backup', () => {
    const active = getAllProducts().filter((product) => product.activeForRecommendations);
    expect(active).toHaveLength(22);
    expect(active.filter((product) => product.category === 'fashion').length).toBeGreaterThanOrEqual(12);
    expect(active.filter((product) => product.category === 'home').length).toBeGreaterThanOrEqual(6);
    expect(getAllProducts().filter((product) => !product.activeForRecommendations)).toHaveLength(32);
  });

  it('contains unique IDs and all mandatory fields', () => {
    const ids = catalog.map((product) => product.id);
    expect(new Set(ids).size).toBe(catalog.length);
    for (const product of catalog) {
      expect(product.id).toBeTruthy();
      expect(product.name).toBeTruthy();
      expect(product.description).toBeTruthy();
      expect(['fashion', 'home']).toContain(product.category);
      expect(product.subcategory).toBeTruthy();
      expect(product.primaryColor).toBeTruthy();
      expect(product.secondaryColors.length).toBeGreaterThan(0);
      expect(product.verificationStatus === 'verified' || product.styles.length > 0).toBe(true);
      expect(product.price === null || product.price >= 0).toBe(true);
      expect(product.image).toMatch(/^\/images\/catalog\/.+\.(svg|jpe?g|png|webp)$/);
      expect(['placeholder_owned', 'authorized', 'external_not_copied', 'generated_owned']).toContain(product.imageRightsStatus);
      expect(['verified', 'pending_verification', 'demo']).toContain(product.verificationStatus);
      expect(product.source.type).toBeTruthy();
      expect(product.tags.length).toBeGreaterThan(0);
    }
  });

  it('validates its schema and keeps DEMO records visibly separate from official stores', () => {
    expect(catalogSchema.safeParse(catalog).success).toBe(true);
    expect(catalog.filter((product) => product.verificationStatus === 'demo').every((product) => product.store === 'StyleMatch Demo' && product.productUrl === null)).toBe(true);
    expect(catalog.filter((product) => product.verificationStatus === 'verified').every((product) => product.store !== 'StyleMatch Demo' && product.productUrl && product.source.url && product.lastVerifiedAt)).toBe(true);
    const invalid = structuredClone(catalog);
    invalid[0] = { ...invalid[0], store: 'H&M México', verificationStatus: 'verified', productUrl: 'https://example.test/item', source: { type: 'official_product_page', url: 'https://example.test/item' }, lastVerifiedAt: '2026-10-27T12:00:00-06:00' };
    expect(catalogSchema.safeParse(invalid).success).toBe(false);
  });

  it('references a distinct existing local image and fallback for every catalog product', () => {
    const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
    const images = catalog.map((product) => product.image);
    expect(new Set(images).size).toBe(catalog.length);
    expect(images.every((image) => !image.includes('placeholder'))).toBe(true);
    for (const product of catalog) expect(existsSync(path.join(directory, product.image))).toBe(true);
    expect(existsSync(path.join(directory, '/images/catalog/fashion-placeholder.svg'))).toBe(true);
    expect(existsSync(path.join(directory, '/images/catalog/home-placeholder.svg'))).toBe(true);
  });

  it('provides the documented catalog query functions', () => {
    expect(getProductsByCategory('fashion')).toHaveLength(30);
    expect(getProductsByColor('terracota').length).toBeGreaterThan(0);
    expect(getProductsByStyle('minimalista').length).toBeGreaterThan(0);
    expect(getProductsByMaterial('cerámica').length).toBeGreaterThan(0);
    expect(getProductById('home-001')?.name).toBeTruthy();
    expect(getAvailableProducts()).toHaveLength(24);
  });
});
