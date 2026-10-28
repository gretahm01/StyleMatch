import OpenAI from 'openai';
import { ImageAnalysisJsonSchema, ImageAnalysisSchema, type AnalysisCategory, type ImageAnalysis } from '../types/analysis.js';
import { AnalysisProviderError } from './analysisProviderError.js';

export async function analyzeWithOpenAi(input: { buffer: Buffer; mime: string; category: AnalysisCategory }, options: { apiKey: string; model: string }): Promise<ImageAnalysis> {
  if (!options.apiKey) throw new AnalysisProviderError(503, 'El análisis con OpenAI no está configurado. Agrega OPENAI_API_KEY en backend/.env o activa el modo DEMO.');
  try {
    const client = new OpenAI({ apiKey: options.apiKey, timeout: 25_000, maxRetries: 0 });
    const response = await client.responses.create({ model: options.model, input: [{ role: 'user', content: [{ type: 'input_text', text: `Analiza la foto para la categoría ${input.category}. Solo afirma rasgos observables; presenta materiales como probables. Si es irrelevante, relevant=false y explica retryReason. Responde en español.` }, { type: 'input_image', image_url: `data:${input.mime};base64,${input.buffer.toString('base64')}`, detail: 'low' }] }], text: { format: { type: 'json_schema', name: 'style_image_analysis', strict: true, schema: ImageAnalysisJsonSchema } } });
    if (!response.output_text) throw new AnalysisProviderError(502, 'OpenAI devolvió una respuesta vacía.');
    const analysis = ImageAnalysisSchema.safeParse(JSON.parse(response.output_text));
    if (!analysis.success || analysis.data.category !== input.category) throw new AnalysisProviderError(502, 'OpenAI devolvió un análisis no válido.');
    return analysis.data;
  } catch (error) {
    if (error instanceof AnalysisProviderError) throw error;
    throw new AnalysisProviderError(502, 'OpenAI no pudo completar el análisis. Intenta nuevamente o activa el modo DEMO.');
  }
}
