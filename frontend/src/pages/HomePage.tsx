import { useEffect, useMemo, useRef, useState } from 'react';
import { AnalysisStatus } from '../components/AnalysisStatus';
import { AudienceSelector } from '../components/AudienceSelector';
import { BudgetFilter } from '../components/BudgetFilter';
import { CategorySelector } from '../components/CategorySelector';
import { CatalogScopeSelector } from '../components/CatalogScopeSelector';
import { FeedbackHistory } from '../components/FeedbackHistory';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { ImagePreview } from '../components/ImagePreview';
import { ImageUploader } from '../components/ImageUploader';
import type { ImageUploaderHandle } from '../components/ImageUploader';
import { OccasionSelector } from '../components/OccasionSelector';
import { PresentationTestCases } from '../components/PresentationReportSection';
import { RecommendationSection } from '../components/RecommendationSection';
import { TasteProfileForm } from '../components/TasteProfileForm';
import { useImageUpload } from '../hooks/useImageUpload';
import { analyzeImage } from '../services/analysis';
import { getAllCatalogProducts } from '../services/catalog';
import { clearFeedback, deleteFeedback, getFeedback, saveFeedback } from '../services/feedback';
import { getProfile, removeProfile, saveProfile } from '../services/profile';
import { refreshRecommendations } from '../services/recommendations';
import type { AnalysisState } from '../types/analysis';
import type { CatalogBudget, CatalogProduct, CatalogRecommendationScope, ProductAudience } from '../types/catalog';
import type { InferredPreferences, ProductFeedback } from '../types/feedback';
import type { Occasion, TasteProfile, TasteProfileInput } from '../types/profile';
import { initialValuesForPresentationCase, type PresentationTestCase, type TestCasePreset } from '../types/report';
import type { StyleCategory } from '../types/style';
import { defaultOccasion } from '../utils/occasions';
import { analysisCacheKey, imageFingerprint } from '../utils/analysisCache';
import { stylesWithCoverage } from '../utils/styleCoverage';

const emptyProfile: TasteProfileInput = { alias: null, interestCategory: 'both', preferredStyles: [], fashionStyles: [], homeStyles: [], favoriteColors: [], avoidedColors: [], preferredMaterials: [], fashionPriorities: [], fashionCuts: [], fashionPatterns: [] };
const emptyInferred: InferredPreferences = { feedbackCount: 0, active: false, confidence: 'insufficient', colors: [], styles: [], materials: [], subcategories: [] };
type SuccessfulAnalysis = Extract<AnalysisState, { status: 'success' }>;
function getLocalProfileId() { const key = 'stylematch-profile-id'; const existing = localStorage.getItem(key); if (existing) return existing; const id = crypto.randomUUID(); localStorage.setItem(key, id); return id; }

export function HomePage() {
  const [category, setCategory] = useState<StyleCategory>('fashion');
  const [occasion, setOccasion] = useState<Occasion>(defaultOccasion('fashion'));
  const { file: imageFile, previewUrl, error: imageError, selectFile, clear: clearImage, isReady: isImageReady } = useImageUpload();
  const uploaderRef = useRef<ImageUploaderHandle>(null);
  const analysisCacheRef = useRef(new Map<string, SuccessfulAnalysis>()); const analyzingRef = useRef(false);
  const [profileId] = useState(getLocalProfileId);
  const [profile, setProfile] = useState<TasteProfile | null>(null);
  const [profileDraft, setProfileDraft] = useState<TasteProfileInput>(emptyProfile);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [feedback, setFeedback] = useState<ProductFeedback[]>([]);
  const [inferredPreferences, setInferredPreferences] = useState<InferredPreferences>(emptyInferred);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [analysisState, setAnalysisState] = useState<AnalysisState>({ status: 'idle' });
  const [lastSuccessfulAnalysis, setLastSuccessfulAnalysis] = useState<SuccessfulAnalysis | null>(null);
  const [refreshingRecommendations, setRefreshingRecommendations] = useState(false); const [loadingMoreRecommendations, setLoadingMoreRecommendations] = useState(false);
  const [demoMode, setDemoMode] = useState(false); const [budget, setBudget] = useState<CatalogBudget>({});
  const [catalogScope, setCatalogScope] = useState<CatalogRecommendationScope>('include_demo');
  const [styleCoverageMessage, setStyleCoverageMessage] = useState('');
  const [audience, setAudience] = useState<ProductAudience>('unspecified');
  const [testCase, setTestCase] = useState<PresentationTestCase>(null);

  useEffect(() => {
    getProfile(profileId).then((stored) => { setProfile(stored); if (stored) setProfileDraft({ alias: stored.alias, interestCategory: stored.interestCategory, preferredStyles: stored.preferredStyles, fashionStyles: stored.fashionStyles, homeStyles: stored.homeStyles, favoriteColors: stored.favoriteColors, avoidedColors: stored.avoidedColors, preferredMaterials: stored.preferredMaterials, fashionPriorities: stored.fashionPriorities, fashionCuts: stored.fashionCuts, fashionPatterns: stored.fashionPatterns }); }).catch(() => setProfile(null)).finally(() => setProfileLoaded(true));
    getFeedback(profileId).then(({ items, inferredPreferences: inferred }) => { setFeedback(items); setInferredPreferences(inferred); }).catch(() => undefined);
    getAllCatalogProducts().then(setCatalogProducts).catch(() => setCatalogProducts([]));
  }, [profileId]);
  function resetAnalysis() { setShowRecommendations(false); setAnalysisState({ status: 'idle' }); setLastSuccessfulAnalysis(null); }
  function resetRecommendationPages() { setLastSuccessfulAnalysis((current) => { if (!current) return current; const reset = { ...current, recommendations: [], recommendationReason: 'Actualiza las recomendaciones para aplicar los filtros nuevos.', hasMore: false, remainingCount: 0 }; setAnalysisState(reset); return reset; }); }
  function reconcileStyleCoverage(nextCategory: StyleCategory, nextScope: CatalogRecommendationScope) {
    const availableStyles = stylesWithCoverage(catalogProducts, nextCategory, nextScope);
    const profileField = nextCategory === 'fashion' ? 'fashionStyles' : 'homeStyles';
    const selected = profileDraft[profileField];
    const valid = selected.filter((style) => availableStyles.includes(style));
    const replacement = selected.length > 0 && valid.length === 0 && availableStyles[0] ? [availableStyles[0]] : valid;
    if (replacement.length !== selected.length || replacement.some((style, index) => style !== selected[index])) {
      setProfileDraft({ ...profileDraft, [profileField]: replacement });
      setStyleCoverageMessage('Un estilo seleccionado no tiene suficiente cobertura en el catálogo activo; se actualizó a una opción disponible.');
    } else {
      setStyleCoverageMessage('');
    }
  }
  function changeCategory(next: StyleCategory) { if (next !== category) { setCategory(next); setOccasion(defaultOccasion(next)); reconcileStyleCoverage(next, catalogScope); resetAnalysis(); } }
  function changeOccasion(next: Occasion) { setOccasion(next); resetRecommendationPages(); }
  function changeBudget(next: CatalogBudget) { setBudget(next); resetRecommendationPages(); }
  function changeAudience(next: ProductAudience) { setAudience(next); resetRecommendationPages(); }
  function changeCatalogScope(next: CatalogRecommendationScope) { setCatalogScope(next); reconcileStyleCoverage(category, next); resetRecommendationPages(); }
  function handleImageSelection(file: File) { selectFile(file); resetAnalysis(); }
  function removeImage() { clearImage(); resetAnalysis(); }
  function chooseTestCase(preset: TestCasePreset | null) { setTestCase(preset?.id ?? null); if (!preset) return; const values = initialValuesForPresentationCase(preset); if (values.category !== category) changeCategory(values.category); changeOccasion(values.occasion); changeBudget(values.budget); }
  async function persistProfile(input: TasteProfileInput) { const saved = await saveProfile(profileId, input, profile !== null); setProfile(saved); setProfileDraft({ alias: saved.alias, interestCategory: saved.interestCategory, preferredStyles: saved.preferredStyles, fashionStyles: saved.fashionStyles, homeStyles: saved.homeStyles, favoriteColors: saved.favoriteColors, avoidedColors: saved.avoidedColors, preferredMaterials: saved.preferredMaterials, fashionPriorities: saved.fashionPriorities, fashionCuts: saved.fashionCuts, fashionPatterns: saved.fashionPatterns }); }
  async function eraseProfile() { await removeProfile(profileId); setProfile(null); setProfileDraft(emptyProfile); }
  async function updateFeedback(productId: string, input: { rating?: number | null; isFavorite?: boolean; notInterested?: boolean }) { const result = await saveFeedback(profileId, productId, input); setFeedback(result.items); setInferredPreferences(result.inferredPreferences); const stored = await getProfile(profileId); if (stored) setProfile(stored); }
  async function removeFeedbackItem(productId: string) { await deleteFeedback(profileId, productId); const result = await getFeedback(profileId); setFeedback(result.items); setInferredPreferences(result.inferredPreferences); }
  async function removeAllFeedback() { const result = await clearFeedback(profileId); setFeedback(result.items); setInferredPreferences(result.inferredPreferences); }
  async function showPreview() {
    if (!isImageReady || analyzingRef.current) return; analyzingRef.current = true; setAnalysisState({ status: 'loading' }); setShowRecommendations(false);
    const retryNoticeTimer = demoMode ? undefined : window.setTimeout(() => setAnalysisState((current) => current.status === 'loading' ? { status: 'loading', retrying: true } : current), 1_100);
    try { const mode = demoMode ? 'demo' as const : 'real' as const; const key = analysisCacheKey(category, mode, await imageFingerprint(imageFile!)); const cached = analysisCacheRef.current.get(key); const result = cached ? { ...cached, ...(await refreshRecommendations(cached.analysis, profileId, occasion, budget, catalogScope, audience)) } : await analyzeImage(imageFile!, category, mode, { profileId, occasion, budget, scope: catalogScope, audience }); const successful: SuccessfulAnalysis = cached ? { ...cached, recommendations: result.recommendations, recommendationReason: result.recommendationReason, hasMore: result.hasMore, remainingCount: result.remainingCount, occasion: result.occasion, includeDemo: result.includeDemo, inferredPreferences: result.inferredPreferences } : { status: 'success', ...result }; if (!cached) analysisCacheRef.current.set(key, successful); setAnalysisState(successful); setLastSuccessfulAnalysis(successful); setInferredPreferences(result.inferredPreferences); if (result.analysis.relevant) { setShowRecommendations(true); requestAnimationFrame(() => document.getElementById('recomendaciones')?.scrollIntoView({ behavior: 'smooth', block: 'start' })); } }
    catch (error) { setAnalysisState({ status: 'error', message: error instanceof Error ? error.message : 'No fue posible analizar la fotografía.' }); setShowRecommendations(lastSuccessfulAnalysis?.analysis.relevant ?? false); }
    finally { if (retryNoticeTimer !== undefined) window.clearTimeout(retryNoticeTimer); analyzingRef.current = false; }
  }
  async function updateRecommendations() {
    if (!lastSuccessfulAnalysis) return; setRefreshingRecommendations(true);
    try { const result = await refreshRecommendations(lastSuccessfulAnalysis.analysis, profileId, occasion, budget, catalogScope, audience); const successful: SuccessfulAnalysis = { ...lastSuccessfulAnalysis, recommendations: result.recommendations, recommendationReason: result.recommendationReason, hasMore: result.hasMore, remainingCount: result.remainingCount, occasion: result.occasion, includeDemo: result.includeDemo, inferredPreferences: result.inferredPreferences }; setLastSuccessfulAnalysis(successful); setAnalysisState(successful); setInferredPreferences(result.inferredPreferences); setShowRecommendations(successful.analysis.relevant); }
    catch (error) { setAnalysisState({ status: 'error', message: error instanceof Error ? error.message : 'No fue posible actualizar las recomendaciones.' }); }
    finally { setRefreshingRecommendations(false); }
  }
  async function loadMoreRecommendations() {
    if (!lastSuccessfulAnalysis || !lastSuccessfulAnalysis.hasMore) return; setLoadingMoreRecommendations(true);
    try { const shownIds = lastSuccessfulAnalysis.recommendations.map((item) => item.product.id); const result = await refreshRecommendations(lastSuccessfulAnalysis.analysis, profileId, occasion, budget, catalogScope, audience, shownIds); const successful: SuccessfulAnalysis = { ...lastSuccessfulAnalysis, recommendations: [...lastSuccessfulAnalysis.recommendations, ...result.recommendations], recommendationReason: result.recommendationReason, hasMore: result.hasMore, remainingCount: result.remainingCount, occasion: result.occasion, includeDemo: result.includeDemo, inferredPreferences: result.inferredPreferences }; setLastSuccessfulAnalysis(successful); setAnalysisState(successful); setInferredPreferences(result.inferredPreferences); }
    catch (error) { setAnalysisState({ status: 'error', message: error instanceof Error ? error.message : 'No fue posible buscar más recomendaciones.' }); }
    finally { setLoadingMoreRecommendations(false); }
  }
  const recommendationData = analysisState.status === 'success' ? analysisState : lastSuccessfulAnalysis;
  const feedbackByProduct = Object.fromEntries(feedback.map((item) => [item.productId, item]));
  const availableStyleValues = useMemo(() => stylesWithCoverage(catalogProducts, category, catalogScope), [catalogProducts, category, catalogScope]);
  return <div className="min-h-screen overflow-hidden bg-cream"><Header /><main><HeroSection />
    <section id="subir-foto" className="scroll-mt-24 px-5 pb-8 sm:px-8" aria-label="Subir imagen"><div className="mx-auto max-w-2xl rounded-[2rem] border border-sand bg-white p-5 shadow-[0_18px_60px_rgba(70,48,33,0.08)] sm:p-8">
      <div className="mb-6 flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-terracotta text-sm font-semibold text-white">1</span><div><h2 className="font-display text-xl font-semibold text-ink">Elige tu inspiración</h2><p className="text-sm text-stone-500">Selecciona una categoría, ocasión y agrega una imagen.</p></div></div>
      <CategorySelector value={category} onChange={changeCategory} /><PresentationTestCases value={testCase} onChange={chooseTestCase} />
      <div className="mt-5"><OccasionSelector category={category} value={occasion} onChange={changeOccasion} /></div>
      <div className="mt-5"><BudgetFilter value={budget} onChange={changeBudget} /></div>
      {category === 'fashion' && <div className="mt-5"><AudienceSelector value={audience} onChange={changeAudience} /></div>}
      <div className="mt-5"><CatalogScopeSelector value={catalogScope} onChange={changeCatalogScope} /></div>
      {profileLoaded && <TasteProfileForm value={profileDraft} category={category} saved={profile !== null} availableStyleValues={availableStyleValues} coverageMessage={styleCoverageMessage} onChange={setProfileDraft} onSave={persistProfile} onDelete={eraseProfile} />}
      <div className="mt-5">{previewUrl && imageFile ? <><ImagePreview previewUrl={previewUrl} fileName={imageFile.name} onRemove={removeImage} onReplace={() => uploaderRef.current?.open()} /><ImageUploader ref={uploaderRef} onSelect={handleImageSelection} error={imageError} hidden /></> : <ImageUploader ref={uploaderRef} onSelect={handleImageSelection} error={imageError} />}</div>
      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-cream p-3 text-sm text-stone-600"><input type="checkbox" checked={demoMode} onChange={(event) => setDemoMode(event.target.checked)} className="mt-0.5 size-4 accent-terracotta" /><span><strong className="text-ink">Usar modo DEMO</strong><br />Muestra un resultado ilustrativo y no envía la imagen al servicio de IA.</span></label>
      <button type="button" onClick={showPreview} disabled={!isImageReady || analysisState.status === 'loading'} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-terracotta px-5 py-3.5 font-semibold text-white shadow-[0_8px_18px_rgba(156,80,52,0.25)] transition-all hover:-translate-y-0.5 hover:bg-terracotta-dark disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500">{analysisState.status === 'loading' ? 'Analizando…' : 'Analizar mi estilo'} <span aria-hidden="true">→</span></button>
      <p className="mt-3 text-center text-xs text-stone-400">En modo DEMO, la imagen no se envía a ningún servicio externo. En modo real, se envía temporalmente al backend y al proveedor de IA configurado para analizarla, sin almacenarse permanentemente.</p>
    </div></section>
    <AnalysisStatus state={analysisState} />
    {recommendationData && <RecommendationSection category={category} recommendations={recommendationData.recommendations} visible={showRecommendations} mode={recommendationData.mode} reason={recommendationData.recommendationReason} occasion={recommendationData.occasion} catalogScope={recommendationData.includeDemo} hasMore={recommendationData.hasMore} onLoadMore={loadMoreRecommendations} loadingMore={loadingMoreRecommendations} feedbackByProduct={feedbackByProduct} onFeedbackChange={updateFeedback} onRefresh={updateRecommendations} refreshing={refreshingRecommendations} />}
    <FeedbackHistory feedback={feedback} products={catalogProducts} inferred={inferredPreferences} onRemove={removeFeedbackItem} onClear={removeAllFeedback} onUpdate={updateFeedback} />
  </main><Footer /></div>;
}
