import type { ProductAudience } from '../types/catalog';

const options: Array<{ value: ProductAudience; label: string }> = [{ value: 'unspecified', label: 'Cualquiera' }, { value: 'women', label: 'Mujer' }, { value: 'men', label: 'Hombre' }, { value: 'unisex', label: 'Unisex' }];

export function AudienceSelector({ value, onChange }: { value: ProductAudience; onChange: (value: ProductAudience) => void }) {
  return <fieldset className="rounded-2xl border border-sand/80 bg-white/70 p-4"><legend className="px-1 text-sm font-semibold text-ink">Público de productos</legend><div className="mt-2 flex flex-wrap gap-2">{options.map((option) => <label key={option.value} className={`cursor-pointer rounded-full border px-3 py-2 text-sm font-medium transition ${value === option.value ? 'border-terracotta bg-peach/50 text-terracotta' : 'border-sand bg-white text-stone-600 hover:border-terracotta/60'}`}><input className="sr-only" type="radio" name="product-audience" checked={value === option.value} onChange={() => onChange(option.value)} /><span>{option.label}</span></label>)}</div><p className="mt-2 text-xs text-stone-500">No se infiere tu género a partir de la fotografía.</p></fieldset>;
}
