import { z } from 'zod';

export const profileIdSchema = z.string().uuid();
export const occasionSchema = z.enum(['casual', 'work', 'date', 'party', 'formal_event', 'daily', 'renew_living_room', 'decorate_bedroom', 'workspace', 'cozy_atmosphere', 'minimalist_decor']);
const stringList = z.array(z.string().trim().min(1).max(40)).max(20).default([]);
const styleList = z.array(z.string().trim().min(1).max(40)).max(3).default([]);

export const profileInputSchema = z.object({
  alias: z.string().trim().min(1).max(40).nullable().optional(),
  interestCategory: z.enum(['fashion', 'home', 'both']).default('both'),
  preferredStyles: stringList,
  fashionStyles: styleList,
  homeStyles: styleList,
  favoriteColors: stringList,
  avoidedColors: stringList,
  preferredMaterials: stringList,
  fashionPriorities: stringList,
  fashionCuts: stringList,
  fashionPatterns: stringList,
}).superRefine((profile, context) => {
  const avoided = new Set(profile.avoidedColors.map((color) => color.toLocaleLowerCase('es-MX')));
  if (profile.favoriteColors.some((color) => avoided.has(color.toLocaleLowerCase('es-MX')))) context.addIssue({ code: 'custom', path: ['favoriteColors'], message: 'Un color no puede ser favorito y estar marcado para evitar.' });
});

export const profileCreateSchema = profileInputSchema.extend({ id: profileIdSchema });
export type ProfileInput = z.infer<typeof profileInputSchema>;
