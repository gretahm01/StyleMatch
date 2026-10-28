import { Router } from 'express';
import { z } from 'zod';
import { ImageAnalysisSchema } from '../types/analysis.js';
import { occasionSchema, profileIdSchema } from '../schemas/profile.js';
import { getProfile } from '../services/profileService.js';
import { getAllProducts } from '../services/catalogService.js';
import { recommendProducts } from '../services/recommendationEngine.js';
import { listFeedback } from '../services/feedbackService.js';
import { inferPreferences } from '../services/preferenceLearningService.js';

const price = z.number().finite().nonnegative().nullable().optional();
const inputSchema = z.object({ analysis: ImageAnalysisSchema, profileId: profileIdSchema.optional(), occasion: occasionSchema, minPrice: price, maxPrice: price, includeDemo: z.boolean().optional().default(true), audience: z.enum(['women', 'men', 'unisex', 'unspecified']).optional().default('unspecified'), excludedProductIds: z.array(z.string().min(1)).max(100).optional().default([]) }).superRefine((value, context) => {
  if (value.minPrice !== null && value.maxPrice !== null && value.minPrice !== undefined && value.maxPrice !== undefined && value.minPrice > value.maxPrice) context.addIssue({ code: 'custom', path: ['maxPrice'], message: 'El presupuesto máximo debe ser igual o mayor al mínimo.' });
});
export const recommendationsRouter = Router();
recommendationsRouter.post('/', (request, response) => {
  const parsed = inputSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ message: 'No fue posible actualizar las recomendaciones con estos criterios.' });
  const profile = parsed.data.profileId ? getProfile(parsed.data.profileId) : undefined;
  const products = getAllProducts();
  const feedback = parsed.data.profileId ? listFeedback(parsed.data.profileId) : [];
  const inferredPreferences = inferPreferences(feedback, products);
  const shownProducts = products.filter((product) => parsed.data.excludedProductIds.includes(product.id));
  const result = parsed.data.analysis.relevant ? recommendProducts({ analysis: parsed.data.analysis, profile, inferredPreferences, excludedProductIds: [...feedback.filter((item) => item.notInterested).map((item) => item.productId), ...parsed.data.excludedProductIds], excludedSubcategories: shownProducts.map((product) => product.subcategory), occasion: parsed.data.occasion, minPrice: parsed.data.minPrice ?? undefined, maxPrice: parsed.data.maxPrice ?? undefined, includeDemo: parsed.data.includeDemo, audience: parsed.data.audience, products }) : { recommendations: [], reason: parsed.data.analysis.retryReason, hasMore: false, remainingCount: 0 };
  return response.json({ recommendations: result.recommendations, reason: result.reason, hasMore: result.hasMore, remainingCount: result.remainingCount, occasion: parsed.data.occasion, includeDemo: parsed.data.includeDemo, inferredPreferences });
});
