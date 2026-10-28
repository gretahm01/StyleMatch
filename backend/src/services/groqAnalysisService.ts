import OpenAI from 'openai';
import { ImageAnalysisJsonSchema, ImageAnalysisSchema, type AnalysisCategory, type ImageAnalysis } from '../types/analysis.js';
import { AnalysisProviderError } from './analysisProviderError.js';

interface GroqClient { chat: { completions: { create: (request: unknown) => Promise<{ choices?: Array<{ message?: { content?: string | null } }> }> } }; }
interface GroqOptions { apiKey: string; model: string; client?: GroqClient; }
interface ErrorFacts { statuses: number[]; codes: string[]; names: string[]; messages: string[]; }
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

function collectErrorFacts(error: unknown): ErrorFacts {
  const facts: ErrorFacts = { statuses: [], codes: [], names: [], messages: [] }; const visited = new Set<object>();
  const visit = (value: unknown, depth = 0): void => {
    if (!value || typeof value !== 'object' || depth > 8 || visited.has(value)) return;
    visited.add(value); const entry = value as Record<string, unknown>;
    const statusValue = entry.status ?? entry.statusCode;
    if (typeof statusValue === 'number' || (typeof statusValue === 'string' && /^\d{3}$/.test(statusValue))) facts.statuses.push(Number(statusValue));
    if (typeof entry.code === 'string') facts.codes.push(entry.code);
    if (typeof entry.name === 'string') facts.names.push(entry.name);
    if (typeof entry.message === 'string') facts.messages.push(entry.message);
    for (const key of ['cause', 'response', 'error', 'details'] as const) {
      const nested = entry[key]; if (Array.isArray(nested)) nested.forEach((item) => visit(item, depth + 1)); else visit(nested, depth + 1);
    }
  };
  visit(error); return facts;
}

export function classifyGroqError(error: unknown): AnalysisProviderError {
  const facts = collectErrorFacts(error); const code = facts.codes.join(' '); const message = facts.messages.join(' '); const names = facts.names.join(' '); const hasStatus = (...statuses: number[]) => facts.statuses.some((status) => statuses.includes(status));
  if (hasStatus(429) || /RESOURCE_EXHAUSTED|RATE_LIMIT/i.test(code)) return new AnalysisProviderError(429, 'Se alcanzó temporalmente el límite de Groq. Intenta más tarde o activa manualmente el modo DEMO.', 'quota');
  if (hasStatus(401, 403) || /UNAUTHENTICATED|PERMISSION_DENIED/i.test(code)) return new AnalysisProviderError(503, 'Groq rechazó la configuración de acceso del backend. Revisa la clave y los permisos del proyecto.', 'authentication');
  if (hasStatus(404) || /MODEL_NOT_FOUND|NOT_FOUND/i.test(code)) return new AnalysisProviderError(503, 'El modelo Groq configurado no está disponible para esta clave.', 'model');
  if (hasStatus(400, 422) || /INVALID_ARGUMENT|BAD_REQUEST/i.test(code)) return new AnalysisProviderError(502, 'Groq rechazó la solicitud del backend. Revisa la configuración, el modelo y el formato de respuesta.', 'configuration');
  if (facts.statuses.some((status) => status >= 500 && status <= 599)) return new AnalysisProviderError(503, 'Groq presenta un problema temporal de servicio. Intenta nuevamente más tarde o activa el modo DEMO.', 'service');
  if (/TimeoutError|AbortError/.test(names) || /timeout|timed out|ETIMEDOUT/i.test(`${message} ${code}`)) return new AnalysisProviderError(504, 'Groq tardó demasiado en responder. Intenta nuevamente más tarde o activa el modo DEMO.', 'timeout');
  if (/fetch|network|connection|socket|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i.test(`${message} ${code}`)) return new AnalysisProviderError(503, 'No fue posible conectar con Groq. Verifica la conexión del servidor e inténtalo más tarde.', 'network');
  return new AnalysisProviderError(502, 'Groq no pudo completar el análisis. Intenta nuevamente o activa el modo DEMO.', 'unknown');
}

function analysisPrompt(category: AnalysisCategory) {
  return `Analiza esta fotografía para una aplicación de estilo. La categoría seleccionada es "${category}". Identifica objeto o espacio, colores, estilo y rasgos visuales. Afirma como hechos solo lo observable; materiales e intención deben ser probables. Si es irrelevante o incompatible, usa relevant=false y explica retryReason. Responde únicamente JSON válido en español con los campos: category, relevant, detectedObject, primaryColors, secondaryColors, style, possibleMaterials, visualDescription, observedFeatures, inferences, confidenceNotes, retryReason.`;
}

export async function analyzeWithGroq(input: { buffer: Buffer; mime: string; category: AnalysisCategory }, options: GroqOptions): Promise<ImageAnalysis> {
  if (!options.apiKey) throw new AnalysisProviderError(503, 'El análisis con Groq no está configurado en el backend. Agrega GROQ_API_KEY en backend/.env o activa el modo DEMO.', 'configuration');
  const client: GroqClient = options.client ?? new OpenAI({ apiKey: options.apiKey, baseURL: GROQ_BASE_URL, timeout: 60_000, maxRetries: 0 }) as unknown as GroqClient;
  try {
    const response = await client.chat.completions.create({ model: options.model, temperature: 0, reasoning_effort: 'none', reasoning_format: 'hidden', response_format: { type: 'json_schema', json_schema: { name: 'style_image_analysis', strict: true, schema: ImageAnalysisJsonSchema } }, messages: [{ role: 'user', content: [{ type: 'text', text: analysisPrompt(input.category) }, { type: 'image_url', image_url: { url: `data:${input.mime};base64,${input.buffer.toString('base64')}` } }] }] });
    const content = response.choices?.[0]?.message?.content;
    if (!content) throw new AnalysisProviderError(502, 'Groq devolvió una respuesta vacía. Intenta nuevamente.', 'json');
    let parsed: unknown;
    try { parsed = JSON.parse(content); } catch { throw new AnalysisProviderError(502, 'Groq devolvió JSON inválido. Intenta nuevamente.', 'json'); }
    const analysis = ImageAnalysisSchema.safeParse(parsed);
    if (!analysis.success || analysis.data.category !== input.category) throw new AnalysisProviderError(502, 'Groq devolvió un análisis no válido. Intenta nuevamente.', 'json');
    return analysis.data;
  } catch (error) {
    if (error instanceof AnalysisProviderError) throw error;
    throw classifyGroqError(error);
  }
}
