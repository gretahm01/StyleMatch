import type { CatalogProduct } from '../types/catalog.js';
import type { ProductFeedback, InferredPreferences, InferredSignal } from '../types/feedback.js';

type Signals = Map<string, number>;
const add = (signals: Signals, values: string[], amount: number) => values.forEach((value) => signals.set(value, (signals.get(value) ?? 0) + amount));
const ratingSignal = (rating: number | null): number => rating === 5 ? 1.5 : rating === 4 ? 1 : rating === 2 ? -1 : rating === 1 ? -1.5 : 0;
const toSignals = (source: Signals, count: number): InferredSignal[] => [...source.entries()].map(([value, total]): InferredSignal => ({ value, score: Math.round(Math.max(-1, Math.min(1, total / Math.max(count, 1))) * 100) / 100, direction: total >= 0 ? 'positive' : 'negative' })).filter((signal) => signal.score !== 0).sort((a, b) => Math.abs(b.score) - Math.abs(a.score) || a.value.localeCompare(b.value));
export function inferPreferences(feedback: ProductFeedback[], products: CatalogProduct[]): InferredPreferences {
  const colors = new Map<string, number>(); const styles = new Map<string, number>(); const materials = new Map<string, number>(); const subcategories = new Map<string, number>();
  const byId = new Map(products.map((product) => [product.id, product]));
  for (const item of feedback) { const product = byId.get(item.productId); if (!product) continue; const signal = ratingSignal(item.rating) + (item.isFavorite ? 1 : 0) + (item.notInterested ? -2 : 0); if (!signal) continue; add(colors, [product.primaryColor, ...product.secondaryColors], signal); add(styles, product.styles, signal); if (product.material) add(materials, [product.material], signal); add(subcategories, [product.subcategory], signal); }
  const count = feedback.length; return { feedbackCount: count, active: count >= 2, confidence: count < 2 ? 'insufficient' : count < 5 ? 'emerging' : 'established', colors: toSignals(colors, count), styles: toSignals(styles, count), materials: toSignals(materials, count), subcategories: toSignals(subcategories, count) };
}
export function inferredPreferenceAdjustment(product: CatalogProduct, preferences: InferredPreferences | undefined): number {
  if (!preferences?.active) return 0;
  const lookup = (signals: InferredSignal[], value: string) => signals.find((signal) => signal.value.toLocaleLowerCase('es-MX') === value.toLocaleLowerCase('es-MX'))?.score ?? 0;
  const scores = [lookup(preferences.colors, product.primaryColor), ...product.secondaryColors.map((color) => lookup(preferences.colors, color)), ...product.styles.map((style) => lookup(preferences.styles, style)), product.material ? lookup(preferences.materials, product.material) : 0, lookup(preferences.subcategories, product.subcategory)];
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const moderation = Math.min(1, preferences.feedbackCount / 5);
  return Math.round(average * moderation * 10 * 100) / 100;
}
