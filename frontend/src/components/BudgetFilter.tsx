import type { CatalogBudget } from '../types/catalog';

interface BudgetFilterProps { value: CatalogBudget; onChange: (value: CatalogBudget) => void; }

export function BudgetFilter({ value, onChange }: BudgetFilterProps) {
  const update = (field: keyof CatalogBudget, raw: string) => {
    const next = raw === '' ? undefined : Number(raw);
    onChange({ ...value, [field]: Number.isFinite(next) ? next : undefined });
  };
  return (
    <fieldset className="rounded-2xl border border-sand/80 bg-white/70 p-4">
      <legend className="px-1 text-sm font-semibold text-ink">Presupuesto opcional (MXN)</legend>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-stone-600">Mínimo<input aria-label="Presupuesto mínimo" inputMode="numeric" min="0" type="number" value={value.minPrice ?? ''} onChange={(event) => update('minPrice', event.target.value)} className="mt-1 w-full rounded-xl border border-sand bg-cream px-3 py-2 text-ink outline-none focus:border-terracotta" placeholder="$0" /></label>
        <label className="text-sm text-stone-600">Máximo<input aria-label="Presupuesto máximo" inputMode="numeric" min="0" type="number" value={value.maxPrice ?? ''} onChange={(event) => update('maxPrice', event.target.value)} className="mt-1 w-full rounded-xl border border-sand bg-cream px-3 py-2 text-ink outline-none focus:border-terracotta" placeholder="Sin límite" /></label>
      </div>
      <p className="mt-2 text-xs text-stone-500">Solo se muestran artículos con precio conocido dentro del rango.</p>
    </fieldset>
  );
}
