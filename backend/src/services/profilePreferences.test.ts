import { describe, expect, it } from 'vitest';
import { profileInputSchema } from '../schemas/profile.js';
import { createProfile, deleteProfile, getProfile } from './profileService.js';
import { recommendProducts } from './recommendationEngine.js';
import type { CatalogProduct } from '../types/catalog.js';
import type { ImageAnalysis } from '../types/analysis.js';
import type { TasteProfile } from '../types/profile.js';

const baseProfile: TasteProfile = { id: 'f01cbb7a-e213-4059-afb7-daf657145322', alias: null, interestCategory: 'both', preferredStyles: [], fashionStyles: ['old_money'], homeStyles: ['nordico'], favoriteColors: ['vino'], avoidedColors: [], preferredMaterials: ['lino'], fashionPriorities: ['comodidad'], fashionCuts: ['regular'], fashionPatterns: ['lisos'], createdAt: '', updatedAt: '' };
const fashionProduct: CatalogProduct = { id: 'pref-fashion', externalProductId: null, name: 'Prenda clásica', description: 'Demo', store: 'StyleMatch Demo', productUrl: null, category: 'fashion', subcategory: 'bolsos', primaryColor: 'borgoña', secondaryColors: [], styles: ['clásico'], material: 'lino', price: 1000, currency: 'MXN', image: '/images/catalog/fashion-placeholder.svg', imageRightsStatus: 'placeholder_owned', available: null, availabilityVerified: false, tags: ['casual'], occasions: ['casual'], genderTarget: null, productAudience: 'unspecified', source: { type: 'internal_demo', url: null }, lastVerifiedAt: null, verificationStatus: 'demo' };
const homeProduct: CatalogProduct = { ...fashionProduct, id: 'pref-home', category: 'home', subcategory: 'lámparas', styles: ['escandinavo'], occasions: ['renew_living_room'] };
const fashionAnalysis: ImageAnalysis = { category: 'fashion', relevant: true, detectedObject: 'vestido', primaryColors: ['vino'], secondaryColors: [], style: ['clásico'], possibleMaterials: ['lino'], visualDescription: '', observedFeatures: [], inferences: [], confidenceNotes: [], retryReason: null };
const homeAnalysis: ImageAnalysis = { ...fashionAnalysis, category: 'home', detectedObject: 'sala', style: ['escandinavo'] };

describe('expanded taste profile', () => {
  it('accepts advanced preferences, defaults fields for older profiles and limits styles to three', () => {
    const legacy = profileInputSchema.parse({ alias: 'Anterior', interestCategory: 'fashion', preferredStyles: ['minimalista'], favoriteColors: ['beige'], avoidedColors: [], preferredMaterials: ['lino'] });
    expect(legacy.fashionStyles).toEqual([]);
    expect(legacy.fashionPriorities).toEqual([]);
    expect(profileInputSchema.safeParse({ ...legacy, fashionStyles: ['casual', 'elegante', 'minimalista', 'streetwear'] }).success).toBe(false);
    expect(profileInputSchema.parse({ ...legacy, fashionStyles: ['casual'], fashionPriorities: ['comodidad'], fashionCuts: ['regular'], fashionPatterns: ['lisos'] }).fashionPriorities).toEqual(['comodidad']);
  });

  it('migrates legacy profile data without losing existing explicit preferences', () => {
    const id = 'd9947464-a726-4b2d-a410-b924abc9f1a7'; deleteProfile(id);
    createProfile(id, { alias: 'Anterior', interestCategory: 'fashion', preferredStyles: ['minimalista'], favoriteColors: ['beige'], avoidedColors: [], preferredMaterials: ['lino'] } as never);
    const stored = getProfile(id)!;
    expect(stored.preferredStyles).toEqual(['minimalista']);
    expect(stored.fashionStyles).toEqual([]);
    expect(stored.fashionCuts).toEqual([]);
    deleteProfile(id);
  });

  it('persists advanced fashion preferences independently from home styles', () => {
    const id = 'b43d7a37-5c4c-47ce-aee8-3f36d2a24bd6'; deleteProfile(id);
    const input = profileInputSchema.parse({ alias: null, interestCategory: 'both', preferredStyles: [], fashionStyles: ['streetwear'], homeStyles: ['industrial'], favoriteColors: ['negro'], avoidedColors: [], preferredMaterials: ['denim'], fashionPriorities: ['originalidad'], fashionCuts: ['oversize'], fashionPatterns: ['graficos'] });
    createProfile(id, input);
    const stored = getProfile(id)!;
    expect(stored.fashionStyles).toEqual(['streetwear']);
    expect(stored.homeStyles).toEqual(['industrial']);
    expect(stored.fashionCuts).toEqual(['oversize']);
    expect(stored.fashionPatterns).toEqual(['graficos']);
    deleteProfile(id);
  });

  it('uses normalized new fashion and home styles plus color equivalents only where supported', () => {
    const fashion = recommendProducts({ analysis: fashionAnalysis, profile: baseProfile, occasion: 'casual', products: [fashionProduct] }).recommendations[0];
    const home = recommendProducts({ analysis: homeAnalysis, profile: baseProfile, occasion: 'renew_living_room', products: [homeProduct] }).recommendations[0];
    expect(fashion.breakdown.preferenceScore).toBeGreaterThan(0);
    expect(fashion.explanation).toContain('color favorito borgoña');
    expect(home.breakdown.preferenceScore).toBeGreaterThan(0);
    expect(home.explanation).toContain('estilo preferido escandinavo');
  });

  it('rejects a favorite color that is also avoided', () => {
    expect(profileInputSchema.safeParse({ alias: null, interestCategory: 'both', preferredStyles: [], favoriteColors: ['vino'], avoidedColors: ['vino'], preferredMaterials: [] }).success).toBe(false);
  });
});
