import type { StyleCategory } from '../types/style';

interface CategorySelectorProps {
  value: StyleCategory;
  onChange: (category: StyleCategory) => void;
}

const categories: Array<{ value: StyleCategory; label: string; detail: string; icon: string }> = [
  { value: 'fashion', label: 'Moda', detail: 'Outfits y accesorios', icon: '◒' },
  { value: 'home', label: 'Hogar', detail: 'Espacios y decoración', icon: '⌂' },
];

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Categoría de inspiración">
      {categories.map((category) => {
        const selected = value === category.value;
        return (
          <button
            key={category.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(category.value)}
            className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all duration-300 sm:p-4 ${selected ? 'border-terracotta bg-peach/45 shadow-[0_8px_20px_rgba(156,80,52,0.10)]' : 'border-sand bg-white hover:border-terracotta/40 hover:bg-cream'}`}
          >
            <span className={`grid size-9 place-items-center rounded-xl text-lg ${selected ? 'bg-terracotta text-white' : 'bg-cream text-stone-500'}`}>{category.icon}</span>
            <span><span className="block font-semibold text-ink">{category.label}</span><span className="hidden text-xs text-stone-500 sm:block">{category.detail}</span></span>
          </button>
        );
      })}
    </div>
  );
}
