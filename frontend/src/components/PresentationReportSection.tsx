import type { PresentationTestCase, TestCasePreset } from '../types/report';
import { presentationTestCases } from '../types/report';

export function PresentationTestCases({ value, onChange }: { value: PresentationTestCase; onChange: (preset: TestCasePreset | null) => void }) {
  return <section className="mt-5 rounded-2xl border border-sand bg-cream p-4" aria-label="Ejemplos rápidos">
    <div className="flex items-start justify-between gap-3">
      <div><h3 className="font-display font-semibold text-ink">Ejemplos rápidos</h3><p className="mt-1 text-xs text-stone-600">Carga una foto y ajustes de muestra; el análisis comienza al pulsar el botón.</p></div>
      <button type="button" onClick={() => onChange(null)} className="text-xs font-semibold text-terracotta underline">Limpiar</button>
    </div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">{presentationTestCases.map((preset) => <button key={preset.id} type="button" onClick={() => onChange(preset)} aria-pressed={value === preset.id} className={`rounded-xl border p-3 text-left transition ${value === preset.id ? 'border-terracotta bg-white shadow-sm' : 'border-sand bg-white/60 hover:border-terracotta/60'}`}><span className="text-sm font-semibold text-ink">{preset.title}</span><span className="mt-1 block text-xs text-stone-600">{preset.description}</span></button>)}</div>
  </section>;
}
