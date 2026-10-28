import type { CatalogProduct, ProductAudience } from '../types/catalog.js';
import type { ImageAnalysis } from '../types/analysis.js';
import type { Occasion, TasteProfile } from '../types/profile.js';
import type { InferredPreferences } from '../types/feedback.js';
import { inferredPreferenceAdjustment } from './preferenceLearningService.js';

export interface ScoreBreakdown { visualScore: number; preferenceScore: number; explicitPreferenceScore: number; inferredPreferenceScore: number; occasionScore: number; complementaryScore: number; totalScore: number; }
export type RecommendationMatchType = 'direct_match' | 'color_harmony' | 'style_compatible' | 'room_compatible';
export interface Recommendation { product: CatalogProduct; score: number; breakdown: ScoreBreakdown; explanation: string; matchType: RecommendationMatchType; }
export interface RecommendationResult { recommendations: Recommendation[]; reason: string | null; hasMore: boolean; remainingCount: number; }
export interface RecommendationInput { analysis: ImageAnalysis; profile?: TasteProfile; inferredPreferences?: InferredPreferences; excludedProductIds?: string[]; excludedSubcategories?: string[]; occasion: Occasion; minPrice?: number; maxPrice?: number; includeDemo?: boolean; audience?: ProductAudience; products: CatalogProduct[]; }

const equivalentGroups = [
  ['beige', 'crema', 'arena', 'marfil', 'blanco', 'roble'], ['terracota', 'arcilla', 'cobre', 'café', 'cafe', 'chocolate', 'marrón'], ['olivo', 'salvia', 'verde'], ['azul cielo', 'azul marino', 'azul'], ['negro', 'gris claro', 'gris'], ['vino', 'borgoña', 'burgundy', 'morado', 'ciruela'],
  ['minimalista', 'contemporáneo', 'escandinavo', 'nordico'], ['clásico', 'formal', 'old_money', 'elegante'], ['bohemio', 'rústico', 'natural', 'boho'], ['streetwear', 'urbano', 'utilitario'], ['athleisure', 'deportivo'], ['vintage', 'retro'],
];
const occasionLabels: Record<Occasion, string> = { casual: 'Casual', work: 'Trabajo', date: 'Cita', party: 'Fiesta', formal_event: 'Evento formal', daily: 'Uso diario', renew_living_room: 'Renovar sala', decorate_bedroom: 'Decorar dormitorio', workspace: 'Espacio de trabajo', cozy_atmosphere: 'Ambiente acogedor', minimalist_decor: 'Decoración minimalista' };
const normalize = (value: string) => value.trim().toLocaleLowerCase('es-MX').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const equivalent = (left: string, right: string) => { const a = normalize(left); const b = normalize(right); return a === b || equivalentGroups.some((group) => group.map(normalize).includes(a) && group.map(normalize).includes(b)); };
const matches = (left: string[], right: string[]) => left.filter((item) => right.some((other) => equivalent(item, other)));
const ratio = (left: string[], right: string[]) => left.length === 0 || right.length === 0 ? 0 : Math.min(1, matches(left, right).length / Math.min(left.length, right.length));
const round = (value: number) => Math.round(value * 100) / 100;
const usable = (values: string[]) => values.filter((value) => !['sin_preferencia', 'sin preferencia'].includes(normalize(value)));
const colorAliases: Record<string, string> = {
  borgona: 'vino', burgundy: 'vino', vino: 'vino', arena: 'beige', marfil: 'beige',
  cafe: 'cafe', marron: 'cafe', chocolate: 'cafe', 'azul marino': 'azul marino', navy: 'azul marino',
};
const neutralColors = new Set(['negro', 'blanco', 'beige', 'crema', 'gris', 'azul marino']);
const accentHarmony: Record<string, string[]> = {
  vino: ['negro', 'beige', 'crema', 'gris', 'oro', 'azul marino'],
  blanco: ['negro', 'beige', 'azul marino', 'gris'],
};
const styleCompatibility: Record<CatalogProduct['category'], string[][]> = {
  fashion: [['casual', 'deportivo'], ['minimalista', 'contemporaneo'], ['clasico', 'elegante', 'formal', 'old_money'], ['bohemio', 'boho', 'rustico'], ['streetwear', 'urbano'], ['athleisure', 'deportivo'], ['vintage', 'retro']],
  home: [['minimalista', 'contemporaneo', 'escandinavo', 'nordico'], ['bohemio', 'boho', 'rustico', 'natural'], ['clasico', 'elegante', 'formal']],
};
type VisualCompatibility = { matchType: RecommendationMatchType; directColors: string[]; directStyles: string[]; directMaterials: string[]; harmonyPairs: string[]; compatibleStyles: string[] };
const canonicalColor = (value: string) => colorAliases[normalize(value)] ?? normalize(value);
const sameColor = (left: string, right: string) => canonicalColor(left) === canonicalColor(right);
const directColorMatches = (left: string[], right: string[]) => left.filter((item) => right.some((other) => sameColor(item, other)));
function isColorHarmony(left: string, right: string): boolean {
  const a = canonicalColor(left); const b = canonicalColor(right);
  if (a === b) return false;
  if (neutralColors.has(a) && neutralColors.has(b)) return true;
  return (accentHarmony[a]?.includes(b) ?? false) || (accentHarmony[b]?.includes(a) ?? false);
}
function visualCompatibility(product: CatalogProduct, analysis: ImageAnalysis): VisualCompatibility | null {
  const productColors = [product.primaryColor, ...product.secondaryColors];
  const analysisColors = [...analysis.primaryColors, ...analysis.secondaryColors];
  const directColors = directColorMatches(productColors, analysisColors);
  const directStyles = product.styles.filter((style) => analysis.style.some((observed) => normalize(style) === normalize(observed)));
  const productMaterial = product.material;
  const directMaterials = productMaterial !== null && analysis.possibleMaterials.some((material) => normalize(material) === normalize(productMaterial)) ? [productMaterial] : [];
  if (directColors.length || directStyles.length || directMaterials.length) return { matchType: 'direct_match', directColors, directStyles, directMaterials, harmonyPairs: [], compatibleStyles: [] };
  const harmonyPairs = productColors.flatMap((color) => analysisColors.filter((observed) => isColorHarmony(color, observed)).map((observed) => `${observed} + ${color}`));
  if (harmonyPairs.length) return { matchType: 'color_harmony', directColors: [], directStyles: [], directMaterials: [], harmonyPairs, compatibleStyles: [] };
  const groups = styleCompatibility[product.category];
  const compatibleStyles = product.styles.filter((style) => analysis.style.some((observed) => groups.some((group) => group.includes(normalize(style)) && group.includes(normalize(observed)) && normalize(style) !== normalize(observed))));
  return compatibleStyles.length ? { matchType: 'style_compatible', directColors: [], directStyles: [], directMaterials: [], harmonyPairs: [], compatibleStyles } : null;
}
function profileStyles(profile: TasteProfile | undefined, category: CatalogProduct['category']): string[] { if (!profile) return []; const specific = category === 'fashion' ? (profile.fashionStyles ?? []) : (profile.homeStyles ?? []); return specific.length ? specific : profile.preferredStyles; }
const complementarySubcategories: Record<string, string[]> = {
  camisa: ['pantalones', 'tenis', 'zapatos', 'bolsos', 'cinturones', 'accesorios', 'chamarras'],
  blusa: ['pantalones', 'tenis', 'zapatos', 'bolsos', 'cinturones', 'accesorios', 'chamarras'],
  pantalon: ['blusas', 'tenis', 'zapatos', 'bolsos', 'cinturones', 'accesorios', 'chamarras'],
  vestido: ['tenis', 'zapatos', 'bolsos', 'accesorios', 'chamarras'],
  tenis: ['pantalones', 'blusas', 'chamarras', 'bolsos', 'cinturones', 'accesorios'],
  zapato: ['pantalones', 'blusas', 'chamarras', 'bolsos', 'cinturones', 'accesorios'],
  sala: ['lámparas', 'cojines', 'mesas auxiliares', 'cuadros', 'floreros', 'decoraciones', 'alfombras'],
  habitacion: ['lámparas', 'cojines', 'mesas auxiliares', 'cuadros', 'floreros', 'decoraciones', 'alfombras'],
  dormitorio: ['lámparas', 'cojines', 'mesas auxiliares', 'cuadros', 'floreros', 'decoraciones', 'alfombras'],
  espacio: ['lámparas', 'cojines', 'mesas auxiliares', 'cuadros', 'floreros', 'decoraciones', 'alfombras'],
};
function complementaryFactor(product: CatalogProduct, detectedObject: string): number {
  const detected = normalize(detectedObject);
  const rule = Object.entries(complementarySubcategories).find(([object]) => detected.includes(object))?.[1];
  if (rule) return rule.some((subcategory) => normalize(product.subcategory) === normalize(subcategory)) ? 1 : 0;
  return detected.includes(normalize(product.subcategory).replace(/s$/, '')) ? 0 : 1;
}
function occasionMatches(product: CatalogProduct, occasion: Occasion): string[] {
  const allowed = occasion === 'casual' ? ['casual', 'daily'] : occasion === 'daily' ? ['daily', 'casual'] : [occasion];
  return product.occasions.filter((value) => allowed.includes(value));
}
const bedroomSubcategories = new Set(['lamparas', 'alfombras', 'cojines', 'cuadros', 'floreros', 'decoraciones']);
const bedroomObjectTerms = ['dormitorio', 'habitacion', 'cuarto', 'recamara', 'bedroom'];
function isBedroomRoomCompatible(product: CatalogProduct, input: RecommendationInput): boolean {
  if (input.analysis.category !== 'home' || input.occasion !== 'decorate_bedroom') return false;
  const detectedObject = normalize(input.analysis.detectedObject);
  return bedroomObjectTerms.some((term) => detectedObject.includes(term))
    && product.occasions.includes('decorate_bedroom')
    && bedroomSubcategories.has(normalize(product.subcategory));
}
function roomCompatibility(): VisualCompatibility {
  return { matchType: 'room_compatible', directColors: [], directStyles: [], directMaterials: [], harmonyPairs: [], compatibleStyles: [] };
}
function scoreProduct(product: CatalogProduct, input: RecommendationInput, visual: VisualCompatibility): ScoreBreakdown {
  const productColors = [product.primaryColor, ...product.secondaryColors];
  const profile = input.profile;
  const positivePreference = profile ? ratio(productColors, profile.favoriteColors) * 0.4 + ratio(product.styles, profileStyles(profile, product.category)) * 0.4 + (product.material ? ratio([product.material], usable(profile.preferredMaterials)) : 0) * 0.2 : 0;
  const avoidancePenalty = profile && matches(productColors, profile.avoidedColors).length > 0 ? 0.75 : 0;
  const visualScore = visual.matchType === 'direct_match'
    ? Math.min(50, (visual.directColors.length ? 35 : 0) + (visual.directStyles.length ? 30 : 0) + (visual.directMaterials.length ? 25 : 0))
    : visual.matchType === 'color_harmony' ? 20
      : visual.matchType === 'style_compatible' ? 22 : 18;
  const explicitPreferenceScore = Math.max(-15, Math.min(15, round((positivePreference - avoidancePenalty) * 15)));
  const inferredPreferenceScore = Math.max(-5, Math.min(5, round(inferredPreferenceAdjustment(product, input.inferredPreferences) * 0.5)));
  const preferenceScore = round(explicitPreferenceScore + inferredPreferenceScore);
  const occasionScore = occasionMatches(product, input.occasion).length > 0 ? 15 : 0;
  const complementaryScore = complementaryFactor(product, input.analysis.detectedObject) * 10;
  return { visualScore, preferenceScore, explicitPreferenceScore, inferredPreferenceScore, occasionScore, complementaryScore, totalScore: round(visualScore + preferenceScore + occasionScore + complementaryScore) };
}
function explanation(product: CatalogProduct, input: RecommendationInput, visual: VisualCompatibility): string {
  const facts: string[] = []; const colors = [product.primaryColor, ...product.secondaryColors];
  if (visual.directColors.length) facts.push(`el color ${visual.directColors.join(', ')} coincide con la paleta detectada`);
  if (visual.directStyles.length) facts.push(`su estilo ${visual.directStyles.join(', ')} coincide con el estilo observado`);
  if (visual.directMaterials.length) facts.push(`su material ${visual.directMaterials.join(', ')} coincide con un material probable`);
  if (visual.harmonyPairs.length) facts.push(`armonía de color: ${visual.harmonyPairs[0]}`);
  if (visual.compatibleStyles.length) facts.push(`estilo compatible: ${visual.compatibleStyles.join(', ')}`);
  if (visual.matchType === 'room_compatible') facts.push(`es un elemento adecuado para habitación (${product.subcategory})`);
  if (input.profile) {
    const favoriteMatches = matches(colors, input.profile.favoriteColors); if (favoriteMatches.length) facts.push(`incluye tu color favorito ${favoriteMatches.join(', ')}`);
    const preferredStyleMatches = matches(product.styles, profileStyles(input.profile, product.category)); if (preferredStyleMatches.length) facts.push(`respeta tu estilo preferido ${preferredStyleMatches.join(', ')}`);
    if (product.material && matches([product.material], usable(input.profile.preferredMaterials)).length) facts.push(`usa tu material preferido ${product.material}`);
    const avoidedMatches = matches(colors, input.profile.avoidedColors); if (avoidedMatches.length) facts.push(`el color ${avoidedMatches.join(', ')} está marcado para evitar y reduce su puntuación`);
  }
  if (input.inferredPreferences?.active) {
    const learned = inferredPreferenceAdjustment(product, input.inferredPreferences);
    const learnedSignals = [...input.inferredPreferences.colors.filter((signal) => colors.some((color) => normalize(color) === normalize(signal.value))), ...input.inferredPreferences.styles.filter((signal) => product.styles.some((style) => normalize(style) === normalize(signal.value))), ...input.inferredPreferences.materials.filter((signal) => product.material !== null && normalize(product.material) === normalize(signal.value)), ...input.inferredPreferences.subcategories.filter((signal) => normalize(product.subcategory) === normalize(signal.value))];
    const positive = learnedSignals.filter((signal) => signal.score > 0).map((signal) => signal.value); const negative = learnedSignals.filter((signal) => signal.score < 0).map((signal) => signal.value);
    if (learned > 0 && positive.length) facts.push(`tus evaluaciones previas muestran afinidad por ${positive.join(', ')}`);
    if (learned < 0 && negative.length) facts.push(`tus evaluaciones previas reducen la afinidad por ${negative.join(', ')}`);
  }
  const occasionEvidence = occasionMatches(product, input.occasion); if (occasionEvidence.length) facts.push(`está declarado para ${occasionLabels[input.occasion]}`);
  if (!facts.length) facts.push('su compatibilidad visual fue validada con la fotografía');
  return `Se recomendó porque ${facts.join('; ')}.`;
}

export function recommendProducts(input: RecommendationInput): RecommendationResult {
  const excludedSubcategories = new Set((input.excludedSubcategories ?? []).map(normalize));
  const candidates = input.products.filter((product) => product.activeForRecommendations !== false && product.category === input.analysis.category && !input.excludedProductIds?.includes(product.id) && !excludedSubcategories.has(normalize(product.subcategory)) && product.price !== null && (input.minPrice === undefined || product.price >= input.minPrice) && (input.maxPrice === undefined || product.price <= input.maxPrice) && (input.audience === undefined || input.audience === 'unspecified' || product.category !== 'fashion' || product.productAudience === input.audience || product.productAudience === 'unisex') && (input.includeDemo !== false || product.verificationStatus === 'verified') && (product.verificationStatus === 'demo' || (product.available === true && product.availabilityVerified)) && (!input.profile || input.profile.interestCategory === 'both' || input.profile.interestCategory === product.category) && occasionMatches(product, input.occasion).length > 0);
  const sortRanked = (left: Recommendation, right: Recommendation) => right.breakdown.visualScore - left.breakdown.visualScore || right.score - left.score || Number(right.product.verificationStatus === 'verified') - Number(left.product.verificationStatus === 'verified') || left.product.id.localeCompare(right.product.id);
  const ranked = candidates.flatMap((product) => {
    const visual = visualCompatibility(product, input.analysis);
    const compatibility = visual ?? (isBedroomRoomCompatible(product, input) ? roomCompatibility() : null);
    if (!compatibility || complementaryFactor(product, input.analysis.detectedObject) === 0) return [];
    const breakdown = scoreProduct(product, input, compatibility);
    return [{ product, breakdown, score: breakdown.totalScore, matchType: compatibility.matchType, explanation: explanation(product, input, compatibility) }];
  }).sort(sortRanked);
  const selected: Recommendation[] = [];
  for (const item of ranked) { if (!selected.some((chosen) => chosen.product.id === item.product.id || chosen.product.subcategory === item.product.subcategory)) selected.push(item); if (selected.length === 3) break; }
  const selectedSubcategories = new Set(selected.map((item) => normalize(item.product.subcategory)));
  const selectedIds = new Set(selected.map((item) => item.product.id));
  const remainingCount = ranked.filter((item) => !selectedIds.has(item.product.id) && !selectedSubcategories.has(normalize(item.product.subcategory))).length;
  const scope = input.includeDemo === false ? ' de tiendas reales' : '';
  const noMatchReason = 'No hay productos del catálogo actual que combinen de forma verificable con esta foto.';
  const reason = selected.length === 3 ? null : selected.length === 0
    ? noMatchReason
    : `Solo hay ${selected.length} producto(s)${scope} con compatibilidad visual verificable para esta foto.`;
  return { recommendations: selected, hasMore: remainingCount > 0, remainingCount, reason };
}
