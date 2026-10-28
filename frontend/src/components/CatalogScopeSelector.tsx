import type { CatalogRecommendationScope } from '../types/catalog';

interface CatalogScopeSelectorProps {
  value: CatalogRecommendationScope;
  onChange: (value: CatalogRecommendationScope) => void;
}

export function CatalogScopeSelector({ value, onChange }: CatalogScopeSelectorProps) {
  return <fieldset className="rounded-2xl border border-sand bg-cream/60 p-4"><legend className="px-1 text-sm font-semibold text-ink">Productos a recomendar</legend><p className="mt-1 text-xs leading-5 text-stone-600">Elige entre productos de tiendas verificadas o un catálogo mixto con artículos DEMO ilustrativos.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{([{ value: 'verified_only', title: 'Solo productos verificados', description: 'No se incluyen artículos DEMO.' }, { value: 'include_demo', title: 'Productos verificados + DEMO', description: 'Ambos tipos compiten con la misma puntuación.' }] as const).map((option) => <label key={option.value} className={`cursor-pointer rounded-xl border p-3 transition-colors ${value === option.value ? 'border-terracotta bg-peach/35' : 'border-sand bg-white hover:border-terracotta/60'}`}><input type="radio" name="catalog-scope" value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} className="sr-only" /><span className="block text-sm font-semibold text-ink">{option.title}</span><span className="mt-1 block text-xs text-stone-600">{option.description}</span></label>)}</div></fieldset>;
}
