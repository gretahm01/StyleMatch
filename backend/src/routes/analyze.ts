import { Router, type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { analyzeImage } from '../services/analysisService.js';
import { AnalysisProviderError } from '../services/analysisProviderError.js';
import { MAX_IMAGE_BYTES, validateImageBuffer } from '../services/imageValidation.js';
import { occasionSchema, profileIdSchema } from '../schemas/profile.js';
import { getProfile } from '../services/profileService.js';
import { getAllProducts } from '../services/catalogService.js';
import { recommendProducts } from '../services/recommendationEngine.js';
import { listFeedback } from '../services/feedbackService.js';
import { inferPreferences } from '../services/preferenceLearningService.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 7, fieldSize: 2048, parts: 8 } });
const priceSchema = z.coerce.number().finite().nonnegative().optional();
const formSchema = z.object({ category: z.enum(['fashion', 'home']), mode: z.enum(['real', 'demo']).optional().default('real'), profileId: profileIdSchema.optional(), occasion: occasionSchema, minPrice: priceSchema, maxPrice: priceSchema, includeDemo: z.enum(['true', 'false']).optional().transform((value) => value !== 'false'), audience: z.enum(['women', 'men', 'unisex', 'unspecified']).optional().default('unspecified') }).superRefine((data, context) => {
  if (data.minPrice !== undefined && data.maxPrice !== undefined && data.minPrice > data.maxPrice) context.addIssue({ code: 'custom', path: ['maxPrice'], message: 'El presupuesto máximo debe ser igual o mayor al mínimo.' });
  const fashion = ['casual', 'work', 'date', 'party', 'formal_event', 'daily'];
  if ((data.category === 'fashion') !== fashion.includes(data.occasion)) context.addIssue({ code: 'custom', path: ['occasion'], message: 'La ocasión no corresponde a la categoría.' });
});
export const analyzeRouter = Router();

analyzeRouter.post('/', upload.single('image'), async (request, response) => {
  const startedAt = Date.now();
  const parsed = formSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ message: 'Selecciona una categoría válida: fashion o home.' });
  if (!request.file) return response.status(400).json({ message: 'Selecciona una imagen para analizar.' });
  try {
    const mime = await validateImageBuffer(request.file.buffer, request.file.mimetype);
    const result = await analyzeImage({ buffer: request.file.buffer, mime, category: parsed.data.category, mode: parsed.data.mode });
    const profile = parsed.data.profileId ? getProfile(parsed.data.profileId) : undefined;
    const products = getAllProducts();
    const feedback = parsed.data.profileId ? listFeedback(parsed.data.profileId) : [];
    const inferredPreferences = inferPreferences(feedback, products);
    const recommendations = result.analysis.relevant ? recommendProducts({ analysis: result.analysis, profile, inferredPreferences, excludedProductIds: feedback.filter((item) => item.notInterested).map((item) => item.productId), occasion: parsed.data.occasion, minPrice: parsed.data.minPrice, maxPrice: parsed.data.maxPrice, includeDemo: parsed.data.includeDemo, audience: parsed.data.audience, products }) : { recommendations: [], reason: result.analysis.retryReason, hasMore: false, remainingCount: 0 };
    return response.json({ ...result, profileId: profile?.id ?? null, occasion: parsed.data.occasion, includeDemo: parsed.data.includeDemo, inferredPreferences, ...recommendations });
  } catch (error) {
    if (error instanceof AnalysisProviderError) {
      console.warn(JSON.stringify({ event: 'analysis_provider_failure', httpStatus: error.status, category: error.category, durationMs: Date.now() - startedAt }));
      return response.status(error.status).json({ message: error.message });
    }
    return response.status(422).json({ message: error instanceof Error ? error.message : 'No fue posible analizar la imagen.' });
  }
});

analyzeRouter.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') return response.status(413).json({ message: 'La imagen debe pesar 5 MB o menos.' });
  return response.status(400).json({ message: 'Solicitud de imagen no válida.' });
});
