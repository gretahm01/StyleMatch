import { z } from 'zod';
import { ImageAnalysisSchema } from '../types/analysis.js';
import { occasionSchema, profileIdSchema } from './profile.js';
import { catalogProductSchema } from './catalog.js';

export const reportInputSchema = z.object({
  profileId: profileIdSchema.nullable().optional(),
  profileAlias: z.string().trim().max(80).nullable().optional(),
  testCase: z.enum(['fashion_casual', 'fashion_elegant', 'fashion_bold_color', 'home_minimalist_room', 'home_cozy_modern']).nullable().optional(),
  category: z.enum(['fashion', 'home']), occasion: occasionSchema,
  minPrice: z.number().nonnegative().nullable().optional(), maxPrice: z.number().nonnegative().nullable().optional(), audience: z.enum(['women', 'men', 'unisex', 'unspecified']).optional().default('unspecified'),
  mode: z.enum(['real', 'demo']), analysis: ImageAnalysisSchema,
  recommendations: z.array(z.object({ product: catalogProductSchema, score: z.number(), breakdown: z.object({ visualScore: z.number(), preferenceScore: z.number(), explicitPreferenceScore: z.number(), inferredPreferenceScore: z.number(), occasionScore: z.number(), complementaryScore: z.number(), totalScore: z.number() }), explanation: z.string(), matchType: z.enum(['direct_match', 'color_harmony', 'style_compatible', 'room_compatible']) })).max(3),
  manualQuality: z.string().trim().max(1000).nullable().optional(),
}).superRefine((value, context) => {
  if (value.minPrice !== null && value.maxPrice !== null && value.minPrice !== undefined && value.maxPrice !== undefined && value.minPrice > value.maxPrice) context.addIssue({ code: 'custom', path: ['maxPrice'], message: 'El presupuesto no es válido.' });
});
export type ReportInput = z.infer<typeof reportInputSchema>;
