import { Router } from 'express';
import { feedbackInputSchema, feedbackRouteSchema } from '../schemas/feedback.js';
import { getProductById, getAllProducts } from '../services/catalogService.js';
import { clearFeedback, deleteFeedback, listFeedback, saveFeedback } from '../services/feedbackService.js';
import { inferPreferences } from '../services/preferenceLearningService.js';
import { ensureAnonymousProfile } from '../services/profileService.js';
import { profileIdSchema } from '../schemas/profile.js';

export const feedbackRouter = Router();
const responseFor = (profileId: string) => { const items = listFeedback(profileId); return { items, inferredPreferences: inferPreferences(items, getAllProducts()) }; };

feedbackRouter.get('/:profileId', (request, response) => {
  const profileId = profileIdSchema.safeParse(request.params.profileId);
  if (!profileId.success) return response.status(400).json({ message: 'Identificador de perfil no válido.' });
  return response.json(responseFor(profileId.data));
});
feedbackRouter.put('/:profileId/:productId', (request, response) => {
  const route = feedbackRouteSchema.safeParse(request.params); const input = feedbackInputSchema.safeParse(request.body);
  if (!route.success || !input.success) return response.status(400).json({ message: 'Datos de evaluación no válidos.' });
  if (!getProductById(route.data.productId)) return response.status(404).json({ message: 'Producto no encontrado.' });
  ensureAnonymousProfile(route.data.profileId);
  const feedback = saveFeedback(route.data.profileId, route.data.productId, input.data);
  return response.json({ feedback, ...responseFor(route.data.profileId) });
});
feedbackRouter.delete('/:profileId/:productId', (request, response) => {
  const route = feedbackRouteSchema.safeParse(request.params);
  if (!route.success) return response.status(400).json({ message: 'Ruta de evaluación no válida.' });
  return deleteFeedback(route.data.profileId, route.data.productId) ? response.status(204).send() : response.status(404).json({ message: 'Evaluación no encontrada.' });
});
feedbackRouter.delete('/:profileId', (request, response) => {
  const profileId = profileIdSchema.safeParse(request.params.profileId);
  if (!profileId.success) return response.status(400).json({ message: 'Identificador de perfil no válido.' });
  const deleted = clearFeedback(profileId.data);
  return response.json({ deleted, ...responseFor(profileId.data) });
});
