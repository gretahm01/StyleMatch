import type { Occasion } from '../types/profile';
import type { StyleCategory } from '../types/style';

export const occasionOptions: Record<StyleCategory, Array<{ value: Occasion; label: string }>> = { fashion: [{ value: 'casual', label: 'Casual' }, { value: 'work', label: 'Trabajo' }, { value: 'date', label: 'Cita' }, { value: 'party', label: 'Fiesta' }, { value: 'formal_event', label: 'Evento formal' }, { value: 'daily', label: 'Uso diario' }], home: [{ value: 'renew_living_room', label: 'Renovar sala' }, { value: 'decorate_bedroom', label: 'Decorar dormitorio' }, { value: 'workspace', label: 'Espacio de trabajo' }, { value: 'cozy_atmosphere', label: 'Ambiente acogedor' }, { value: 'minimalist_decor', label: 'Decoración minimalista' }] };
export function defaultOccasion(category: StyleCategory): Occasion { return occasionOptions[category][0].value; }
export function occasionLabel(value: string): string { return Object.values(occasionOptions).flat().find((option) => option.value === value)?.label ?? value; }
