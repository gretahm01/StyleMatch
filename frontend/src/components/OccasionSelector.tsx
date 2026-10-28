import type { Occasion } from '../types/profile';
import type { StyleCategory } from '../types/style';
import { occasionOptions } from '../utils/occasions';

export function OccasionSelector({ category, value, onChange }: { category: StyleCategory; value: Occasion; onChange: (value: Occasion) => void }) {
  return <fieldset className="rounded-2xl border border-sand/80 bg-white/70 p-4"><legend className="px-1 text-sm font-semibold text-ink">¿Para qué ocasión?</legend><div className="mt-2 flex flex-wrap gap-2">{occasionOptions[category].map((option) => <button key={option.value} type="button" onClick={() => onChange(option.value)} className={`rounded-full px-3 py-2 text-sm transition ${value === option.value ? 'bg-terracotta text-white' : 'bg-cream text-stone-600 hover:bg-peach'}`}>{option.label}</button>)}</div></fieldset>;
}
