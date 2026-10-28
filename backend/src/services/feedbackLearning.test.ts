import { describe, expect, it } from 'vitest';
import { clearFeedback, deleteFeedback, getFeedback, listFeedback, saveFeedback } from './feedbackService.js';
import { inferPreferences } from './preferenceLearningService.js';
import { recommendProducts } from './recommendationEngine.js';
import { createProfile, deleteProfile, getProfile } from './profileService.js';
import type { CatalogProduct } from '../types/catalog.js';
import type { ImageAnalysis } from '../types/analysis.js';

const profileId = '1f4c44de-72ee-4f1d-a1c3-ddfd710d432f';
const makeProduct = (id: string, color: string, style: string, subcategory: string): CatalogProduct => ({ id, externalProductId: null, name: id, description: 'Demo', store: 'StyleMatch Demo', productUrl: null, category: 'fashion', subcategory, primaryColor: color, secondaryColors: [], styles: [style], material: 'lino', price: 900, currency: 'MXN', image: '/images/catalog/fashion-placeholder.svg', imageRightsStatus: 'placeholder_owned', available: null, availabilityVerified: false, tags: ['casual'], occasions: ['casual'], genderTarget: null, productAudience: 'unspecified', source: { type: 'internal_demo', url: null }, lastVerifiedAt: null, verificationStatus: 'demo' });
const products = [makeProduct('learn-beige', 'beige', 'minimalista', 'bolsos'), makeProduct('learn-black', 'negro', 'clásico', 'zapatos'), makeProduct('learn-neutral', 'terracota', 'bohemio', 'accesorios')];
const analysis: ImageAnalysis = { category: 'fashion', relevant: true, detectedObject: 'vestido', primaryColors: ['beige'], secondaryColors: [], style: ['minimalista'], possibleMaterials: ['lino'], visualDescription: 'Demo', observedFeatures: [], inferences: [], confidenceNotes: [], retryReason: null };

describe('product feedback and preference learning', () => {
  it('upserts one feedback row, updates stars and supports deletion', () => {
    clearFeedback(profileId);
    saveFeedback(profileId, 'learn-beige', { rating: 5, isFavorite: true });
    saveFeedback(profileId, 'learn-beige', { rating: 2 });
    expect(listFeedback(profileId)).toHaveLength(1);
    expect(getFeedback(profileId, 'learn-beige')?.rating).toBe(2);
    expect(getFeedback(profileId, 'learn-beige')?.isFavorite).toBe(true);
    expect(deleteFeedback(profileId, 'learn-beige')).toBe(true);
    expect(listFeedback(profileId)).toHaveLength(0);
  });

  it('learns moderated positive and negative signals without changing explicit profile data', () => {
    clearFeedback(profileId);
    saveFeedback(profileId, 'learn-beige', { rating: 5, isFavorite: true });
    const one = inferPreferences(listFeedback(profileId), products);
    expect(one.active).toBe(false);
    saveFeedback(profileId, 'learn-black', { rating: 1, notInterested: true });
    const learned = inferPreferences(listFeedback(profileId), products);
    expect(learned.active).toBe(true);
    expect(learned.colors.find((signal) => signal.value === 'beige')?.direction).toBe('positive');
    expect(learned.colors.find((signal) => signal.value === 'negro')?.direction).toBe('negative');
  });

  it('changes only the preference component after reproducible local feedback', () => {
    clearFeedback(profileId);
    const before = recommendProducts({ analysis, occasion: 'casual', products, inferredPreferences: inferPreferences([], products) });
    const beforeBeige = before.recommendations.find((item) => item.product.id === 'learn-beige')!;
    saveFeedback(profileId, 'learn-beige', { rating: 5, isFavorite: true });
    saveFeedback(profileId, 'learn-black', { rating: 1, notInterested: true });
    const feedback = listFeedback(profileId); const inferred = inferPreferences(feedback, products);
    const after = recommendProducts({ analysis, occasion: 'casual', products, inferredPreferences: inferred, excludedProductIds: feedback.filter((item) => item.notInterested).map((item) => item.productId) });
    const afterBeige = after.recommendations.find((item) => item.product.id === 'learn-beige')!;
    expect(afterBeige.breakdown.inferredPreferenceScore).toBeGreaterThan(0);
    expect(afterBeige.breakdown.preferenceScore).toBeGreaterThan(beforeBeige.breakdown.preferenceScore);
    expect(afterBeige.breakdown.visualScore).toBe(beforeBeige.breakdown.visualScore);
    expect(afterBeige.breakdown.occasionScore).toBe(beforeBeige.breakdown.occasionScore);
    expect(afterBeige.explanation).toContain('afinidad por beige');
    expect(after.recommendations.map((item) => item.product.id)).not.toContain('learn-black');
  });

  it('clears all feedback history', () => {
    expect(clearFeedback(profileId)).toBeGreaterThanOrEqual(1);
    expect(listFeedback(profileId)).toHaveLength(0);
  });

  it('recalculates learning after changing a rating and preserves explicit preferences', () => {
    const explicitProfileId = 'ce74743c-6f99-45c5-825e-e4da5adf301f';
    deleteProfile(explicitProfileId); clearFeedback(explicitProfileId);
    createProfile(explicitProfileId, { alias: null, interestCategory: 'fashion', preferredStyles: ['clásico'], favoriteColors: ['olivo'], avoidedColors: [], preferredMaterials: ['algodón'] });
    saveFeedback(explicitProfileId, 'learn-beige', { rating: 5 }); saveFeedback(explicitProfileId, 'learn-black', { rating: 4 });
    const before = inferPreferences(listFeedback(explicitProfileId), products).colors.find((signal) => signal.value === 'beige')?.score;
    saveFeedback(explicitProfileId, 'learn-beige', { rating: 1 });
    const after = inferPreferences(listFeedback(explicitProfileId), products).colors.find((signal) => signal.value === 'beige')?.score;
    expect(after).toBeLessThan(before ?? 0);
    expect(getProfile(explicitProfileId)?.favoriteColors).toEqual(['olivo']);
    expect(getProfile(explicitProfileId)?.preferredStyles).toEqual(['clásico']);
    clearFeedback(explicitProfileId); deleteProfile(explicitProfileId);
  });
});
