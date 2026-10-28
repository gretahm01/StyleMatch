import { env } from '../config/env.js';
import type { AnalysisCategory, ImageAnalysis } from '../types/analysis.js';
import { AnalysisProviderError } from './analysisProviderError.js';
import { analyzeWithGemini } from './geminiAnalysisService.js';
import { analyzeWithGroq } from './groqAnalysisService.js';
import { analyzeWithOpenAi } from './openAiAnalysisService.js';

function demoAnalysis(category: AnalysisCategory): ImageAnalysis {
  return { category, relevant: true, detectedObject: 'Ejemplo de demostración', primaryColors: ['beige'], secondaryColors: ['terracota'], style: ['minimalista'], possibleMaterials: ['No evaluados en modo DEMO'], visualDescription: 'Resultado ilustrativo; no se analizó la fotografía.', observedFeatures: ['Modo DEMO activado'], inferences: [], confidenceNotes: ['Este resultado es de demostración y no fue generado por un proveedor de IA.'], retryReason: null };
}

export async function analyzeImage(input: { buffer: Buffer; mime: string; category: AnalysisCategory; mode: 'real' | 'demo' }): Promise<{ analysis: ImageAnalysis; mode: 'real' | 'demo' }> {
  if (input.mode === 'demo' || env.forceDemoMode) return { analysis: demoAnalysis(input.category), mode: 'demo' };
  if (env.aiProvider === 'gemini') return { analysis: await analyzeWithGemini(input, { apiKey: env.geminiApiKey ?? '', model: env.geminiModel }), mode: 'real' };
  if (env.aiProvider === 'groq') return { analysis: await analyzeWithGroq(input, { apiKey: env.groqApiKey ?? '', model: env.groqVisionModel }), mode: 'real' };
  if (env.aiProvider === 'openai') return { analysis: await analyzeWithOpenAi(input, { apiKey: env.openAiApiKey ?? '', model: env.openAiVisionModel }), mode: 'real' };
  throw new AnalysisProviderError(503, 'AI_PROVIDER debe ser gemini, groq u openai. Usa un proveedor configurado o DEMO para una prueba local.', 'configuration');
}
