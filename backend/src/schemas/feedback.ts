import { z } from 'zod';
import { profileIdSchema } from './profile.js';

export const feedbackInputSchema = z.object({ rating: z.number().int().min(1).max(5).nullable().optional(), isFavorite: z.boolean().optional(), notInterested: z.boolean().optional() }).refine((value) => value.rating !== undefined || value.isFavorite !== undefined || value.notInterested !== undefined, { message: 'Incluye al menos un dato de evaluación.' });
export const feedbackRouteSchema = z.object({ profileId: profileIdSchema, productId: z.string().trim().min(1).max(100) });
export type FeedbackInput = z.infer<typeof feedbackInputSchema>;
