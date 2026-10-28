import { GoogleGenAI } from '@google/genai';
import { ImageAnalysisJsonSchema, ImageAnalysisSchema, type AnalysisCategory, type ImageAnalysis } from '../types/analysis.js';
import { AnalysisProviderError } from './analysisProviderError.js';

interface GeminiClient { models: { generateContent: (request: unknown) => Promise<{ text?: string }> }; }
interface GeminiOptions { apiKey: string; model: string; client?: GeminiClient; sleep?: (milliseconds: number) => Promise<void>; random?: () => number; onRetry?: (attempt: number) => void; }
interface ProviderErrorFacts { statuses: number[]; codes: string[]; messages: string[]; names: string[]; }
export const REQUEST_TIMEOUT_MS = 60_000;
export const MAX_SERVICE_RETRIES = 2;
const retryDelayMs = (retry: number, random: () => number) => Math.round(1_000 * (2 ** (retry - 1)) * (0.85 + random() * 0.3));
const sleep = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function prompt(category: AnalysisCategory) {
  return `Analiza esta fotografía para una aplicación de estilo. La categoría seleccionada es "${category}". Identifica el objeto o espacio, colores, estilo y rasgos visuales. Describe como hechos únicamente lo observable. Los materiales, intención de uso o detalles no visibles deben expresarse como probables y anotarse en possibleMaterials o inferences. Si la foto es irrelevante, ambigua o incompatible con la categoría, usa relevant=false y explica en retryReason cómo tomar una fotografía útil. Responde en español usando exactamente el esquema solicitado.`;
}
function numberFrom(value: unknown): number | undefined { return typeof value === 'number' ? value : typeof value === 'string' && /^\d{3}$/.test(value) ? Number(value) : undefined; }

/** Collects safe classification facts from Gemini SDK error envelopes, including cause.cause. */
function collectProviderErrorFacts(error: unknown): ProviderErrorFacts {
  const facts: ProviderErrorFacts = { statuses: [], codes: [], messages: [], names: [] };
  const visited = new Set<object>();
  const visit = (value: unknown, depth = 0): void => {
    if (!value || typeof value !== 'object' || depth > 8 || visited.has(value)) return;
    visited.add(value);
    const entry = value as Record<string, unknown>;
    const status = numberFrom(entry.status) ?? numberFrom(entry.statusCode);
    if (status !== undefined) facts.statuses.push(status);
    if (typeof entry.code === 'string') facts.codes.push(entry.code);
    if (typeof entry.message === 'string') facts.messages.push(entry.message);
    if (typeof entry.name === 'string') facts.names.push(entry.name);
    for (const key of ['cause', 'response', 'error', 'details'] as const) {
      const nested = entry[key];
      if (Array.isArray(nested)) nested.forEach((item) => visit(item, depth + 1));
      else visit(nested, depth + 1);
    }
  };
  visit(error);
  return facts;
}

export function getGeminiErrorDiagnostic(error: unknown) {
  const facts = collectProviderErrorFacts(error);
  const safeToken = (value: string) => /^[A-Za-z0-9_.:-]{1,80}$/.test(value) ? value : undefined;
  return {
    names: [...new Set(facts.names.map(safeToken).filter((value): value is string => Boolean(value)))],
    codes: [...new Set(facts.codes.map(safeToken).filter((value): value is string => Boolean(value)))],
    httpStatuses: [...new Set(facts.statuses)],
  };
}

export function classifyGeminiError(error: unknown): AnalysisProviderError {
  const facts = collectProviderErrorFacts(error); const status = facts.statuses[0]; const message = facts.messages.join(' '); const code = facts.codes.join(' '); const name = facts.names.join(' '); const hasStatus = (...statuses: number[]) => facts.statuses.some((candidate) => statuses.includes(candidate));
  if (status === 429 || /RESOURCE_EXHAUSTED|QUOTA_EXCEEDED/i.test(code)) return new AnalysisProviderError(429, 'Se alcanzó temporalmente la cuota gratuita de Gemini. Intenta más tarde o activa manualmente el modo DEMO.', 'quota');
  if (status === 401 || status === 403 || /UNAUTHENTICATED|PERMISSION_DENIED/i.test(code) || /api key.*(invalid|not valid)|invalid.*api key|permission denied/i.test(message)) return new AnalysisProviderError(503, 'Gemini rechazó la configuración de acceso del backend. Revisa la clave y los permisos del proyecto.', 'authentication');
  if (status === 404 || /NOT_FOUND|MODEL_NOT_FOUND/i.test(code) || /model.*not found|model.*not available|not supported/i.test(message)) return new AnalysisProviderError(503, 'El modelo Gemini configurado no está disponible para esta clave. No se seleccionó ningún modelo alternativo.', 'model');
  if (hasStatus(400, 422) || /INVALID_ARGUMENT|BAD_REQUEST/i.test(code)) return new AnalysisProviderError(502, 'Gemini rechazó la solicitud del backend. Revisa la configuración, el modelo y el esquema de respuesta.', 'configuration');
  if (facts.statuses.some((candidate) => candidate >= 500 && candidate <= 599)) return new AnalysisProviderError(503, 'Gemini presenta un problema temporal de servicio. Intenta nuevamente más tarde o activa el modo DEMO.', 'service');
  if (/TimeoutError|AbortError/.test(name) || /DEADLINE_EXCEEDED/i.test(code) || /timeout|timed out|deadline exceeded/i.test(message) || /ETIMEDOUT/i.test(code)) return new AnalysisProviderError(504, 'Gemini tardó demasiado en responder. Intenta nuevamente más tarde o activa el modo DEMO.', 'timeout');
  if (/fetch|network|connection|socket|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i.test(`${message} ${code}`)) return new AnalysisProviderError(503, 'No fue posible conectar con Gemini. Verifica la conexión del servidor e inténtalo más tarde.', 'network');
  return new AnalysisProviderError(502, 'Gemini no pudo completar el análisis por un error no clasificado. Intenta más tarde o usa el modo DEMO.', 'unknown');
}

export async function analyzeWithGemini(input: { buffer: Buffer; mime: string; category: AnalysisCategory }, options: GeminiOptions): Promise<ImageAnalysis> {
  if (!options.apiKey) throw new AnalysisProviderError(503, 'El análisis con Gemini no está configurado en el backend. Activa el modo DEMO o configura el proveedor.', 'configuration');
  const client = options.client ?? new GoogleGenAI({ apiKey: options.apiKey, httpOptions: { timeout: REQUEST_TIMEOUT_MS } });
  let retries = 0;
  while (true) {
    try {
      const response = await client.models.generateContent({
        model: options.model,
        contents: [{ role: 'user', parts: [{ text: prompt(input.category) }, { inlineData: { mimeType: input.mime, data: input.buffer.toString('base64') } }] }],
        config: { responseMimeType: 'application/json', responseJsonSchema: ImageAnalysisJsonSchema },
      });
      if (!response.text) throw new AnalysisProviderError(502, 'Gemini devolvió una respuesta vacía. Intenta nuevamente.', 'json');
      let parsed: unknown;
      try { parsed = JSON.parse(response.text); } catch { throw new AnalysisProviderError(502, 'Gemini devolvió JSON inválido. Intenta nuevamente.', 'json'); }
      const analysis = ImageAnalysisSchema.safeParse(parsed);
      if (!analysis.success) throw new AnalysisProviderError(502, 'Gemini devolvió un JSON de análisis incompatible. Intenta nuevamente.', 'json');
      if (analysis.data.category !== input.category) throw new AnalysisProviderError(502, 'Gemini devolvió una categoría incompatible. Intenta nuevamente.', 'json');
      return analysis.data;
    } catch (error) {
      if (error instanceof AnalysisProviderError) throw error;
      const classified = classifyGeminiError(error);
      console.warn(JSON.stringify({ event: 'gemini_provider_error_shape', category: classified.category, ...getGeminiErrorDiagnostic(error) }));
      if (classified.category !== 'service' || retries >= MAX_SERVICE_RETRIES) throw classified;
      retries += 1;
      options.onRetry?.(retries);
      await (options.sleep ?? sleep)(retryDelayMs(retries, options.random ?? Math.random));
    }
  }
}
