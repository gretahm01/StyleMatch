import { z } from 'zod';
import type { ProductCategory } from './catalog.js';

export const ImageAnalysisSchema = z.object({
  category: z.enum(['fashion', 'home']),
  relevant: z.boolean(),
  detectedObject: z.string(),
  primaryColors: z.array(z.string()),
  secondaryColors: z.array(z.string()),
  style: z.array(z.string()),
  possibleMaterials: z.array(z.string()),
  visualDescription: z.string(),
  observedFeatures: z.array(z.string()),
  inferences: z.array(z.string()),
  confidenceNotes: z.array(z.string()),
  retryReason: z.string().nullable(),
});

export const ImageAnalysisJsonSchema = {
  type: 'object', additionalProperties: false,
  required: ['category', 'relevant', 'detectedObject', 'primaryColors', 'secondaryColors', 'style', 'possibleMaterials', 'visualDescription', 'observedFeatures', 'inferences', 'confidenceNotes', 'retryReason'],
  properties: {
    category: { type: 'string', enum: ['fashion', 'home'] }, relevant: { type: 'boolean' }, detectedObject: { type: 'string' }, primaryColors: { type: 'array', items: { type: 'string' } }, secondaryColors: { type: 'array', items: { type: 'string' } }, style: { type: 'array', items: { type: 'string' } }, possibleMaterials: { type: 'array', items: { type: 'string' } }, visualDescription: { type: 'string' }, observedFeatures: { type: 'array', items: { type: 'string' } }, inferences: { type: 'array', items: { type: 'string' } }, confidenceNotes: { type: 'array', items: { type: 'string' } }, retryReason: { type: ['string', 'null'] },
  },
} as const;

export type ImageAnalysis = z.infer<typeof ImageAnalysisSchema>;
export type AnalysisMode = 'real' | 'demo';
export type AnalysisCategory = ProductCategory;
