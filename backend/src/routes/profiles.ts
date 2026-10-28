import { Router } from 'express';
import { profileCreateSchema, profileIdSchema, profileInputSchema } from '../schemas/profile.js';
import { createProfile, deleteProfile, getProfile, updateProfile } from '../services/profileService.js';

export const profilesRouter = Router();

profilesRouter.get('/:id', (request, response) => {
  const id = profileIdSchema.safeParse(request.params.id);
  if (!id.success) return response.status(400).json({ message: 'Identificador de perfil no válido.' });
  const profile = getProfile(id.data);
  return profile ? response.json({ profile }) : response.status(404).json({ message: 'Perfil no encontrado.' });
});

profilesRouter.post('/', (request, response) => {
  const parsed = profileCreateSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ message: 'Datos de perfil no válidos.' });
  if (getProfile(parsed.data.id)) return response.status(409).json({ message: 'El perfil local ya existe.' });
  return response.status(201).json({ profile: createProfile(parsed.data.id, parsed.data) });
});

profilesRouter.put('/:id', (request, response) => {
  const id = profileIdSchema.safeParse(request.params.id);
  const input = profileInputSchema.safeParse(request.body);
  if (!id.success || !input.success) return response.status(400).json({ message: 'Datos de perfil no válidos.' });
  const profile = updateProfile(id.data, input.data);
  return profile ? response.json({ profile }) : response.status(404).json({ message: 'Perfil no encontrado.' });
});

profilesRouter.delete('/:id', (request, response) => {
  const id = profileIdSchema.safeParse(request.params.id);
  if (!id.success) return response.status(400).json({ message: 'Identificador de perfil no válido.' });
  return deleteProfile(id.data) ? response.status(204).send() : response.status(404).json({ message: 'Perfil no encontrado.' });
});
