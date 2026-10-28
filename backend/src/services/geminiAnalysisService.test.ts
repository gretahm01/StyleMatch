import { describe, expect, it } from 'vitest';
import { analyzeWithGemini, classifyGeminiError, getGeminiErrorDiagnostic, MAX_SERVICE_RETRIES, REQUEST_TIMEOUT_MS } from './geminiAnalysisService.js';
import { AnalysisProviderError } from './analysisProviderError.js';

const validAnalysis = {
  category: 'fashion', relevant: true, detectedObject: 'Vestido', primaryColors: ['beige'], secondaryColors: ['blanco'], style: ['minimalista'], possibleMaterials: ['algodón probable'], visualDescription: 'Vestido beige de líneas simples.', observedFeatures: ['Silueta lisa'], inferences: ['El material es una estimación visual.'], confidenceNotes: [], retryReason: null,
};

function clientReturning(value: string) {
  return { models: { generateContent: async () => ({ text: value }) } };
}

describe('Gemini analysis service', () => {
  it('configures a 60-second provider timeout', () => {
    expect(REQUEST_TIMEOUT_MS).toBe(60_000);
  });

  it('uses an inline base64 image and validates the structured response', async () => {
    let request: unknown;
    const client = { models: { generateContent: async (input: unknown) => { request = input; return { text: JSON.stringify(validAnalysis) }; } } };
    const analysis = await analyzeWithGemini({ buffer: Buffer.from('image-bytes'), mime: 'image/jpeg', category: 'fashion' }, { apiKey: 'test-key', model: 'gemini-2.5-flash', client });
    expect(analysis.detectedObject).toBe('Vestido');
    expect(JSON.stringify(request)).toContain('aW1hZ2UtYnl0ZXM=');
    expect(JSON.stringify(request)).toContain('responseMimeType');
  });

  it('rejects invalid structured JSON after Gemini responds', async () => {
    await expect(analyzeWithGemini({ buffer: Buffer.from('x'), mime: 'image/png', category: 'fashion' }, { apiKey: 'test-key', model: 'gemini-2.5-flash', client: clientReturning('{"category":"fashion"}') })).rejects.toMatchObject({ status: 502 });
  });

  it('returns a recoverable quota error without retrying or changing model', async () => {
    const client = { models: { generateContent: async () => { throw { status: 429, message: 'quota exceeded' }; } } };
    await expect(analyzeWithGemini({ buffer: Buffer.from('x'), mime: 'image/png', category: 'fashion' }, { apiKey: 'test-key', model: 'gemini-2.5-flash', client })).rejects.toMatchObject<AnalysisProviderError>({ status: 429, message: expect.stringContaining('cuota gratuita') });
  });

  it('retries a temporary 503 once and succeeds without changing model', async () => {
    let calls = 0; const delays: number[] = [];
    const client = { models: { generateContent: async () => { calls += 1; if (calls === 1) throw { status: 503 }; return { text: JSON.stringify(validAnalysis) }; } } };
    const result = await analyzeWithGemini({ buffer: Buffer.from('x'), mime: 'image/png', category: 'fashion' }, { apiKey: 'test-key', model: 'gemini-test', client, sleep: async (milliseconds) => { delays.push(milliseconds); }, random: () => 0.5 });
    expect(result.detectedObject).toBe('Vestido');
    expect(calls).toBe(2);
    expect(delays).toEqual([1_000]);
  });

  it('stops after two retries when Gemini keeps returning 503', async () => {
    let calls = 0; const delays: number[] = [];
    const client = { models: { generateContent: async () => { calls += 1; throw { status: 503 }; } } };
    await expect(analyzeWithGemini({ buffer: Buffer.from('x'), mime: 'image/png', category: 'fashion' }, { apiKey: 'test-key', model: 'gemini-test', client, sleep: async (milliseconds) => { delays.push(milliseconds); }, random: () => 0.5 })).rejects.toMatchObject({ category: 'service', status: 503 });
    expect(calls).toBe(MAX_SERVICE_RETRIES + 1);
    expect(delays).toEqual([1_000, 2_000]);
  });

  it('does not retry rejected 400 requests', async () => {
    let calls = 0; const delays: number[] = [];
    const client = { models: { generateContent: async () => { calls += 1; throw { status: 400, code: 'INVALID_ARGUMENT' }; } } };
    await expect(analyzeWithGemini({ buffer: Buffer.from('x'), mime: 'image/png', category: 'fashion' }, { apiKey: 'test-key', model: 'gemini-test', client, sleep: async (milliseconds) => { delays.push(milliseconds); } })).rejects.toMatchObject({ category: 'configuration', status: 502 });
    expect(calls).toBe(1);
    expect(delays).toEqual([]);
  });

  it('reports unavailable models and timeouts with safe recoverable errors', async () => {
    const unavailable = { models: { generateContent: async () => { throw { status: 404, message: 'model not found' }; } } };
    const timedOut = { models: { generateContent: async () => { throw { name: 'TimeoutError', message: 'request timeout' }; } } };
    const input = { buffer: Buffer.from('x'), mime: 'image/png', category: 'home' as const };
    await expect(analyzeWithGemini(input, { apiKey: 'test-key', model: 'gemini-2.5-flash', client: unavailable })).rejects.toMatchObject({ status: 503, message: expect.stringContaining('modelo') });
    await expect(analyzeWithGemini(input, { apiKey: 'test-key', model: 'gemini-2.5-flash', client: timedOut })).rejects.toMatchObject({ status: 504 });
  });

  it('classifies nested SDK statuses without exposing provider details', () => {
    expect(classifyGeminiError({ response: { status: 429 }, message: 'quota exceeded' })).toMatchObject({ status: 429, category: 'quota', message: expect.stringContaining('cuota gratuita') });
    expect(classifyGeminiError({ cause: { code: 'ECONNRESET' } })).toMatchObject({ status: 503, category: 'network' });
    expect(classifyGeminiError({ code: 'RESOURCE_EXHAUSTED' })).toMatchObject({ status: 429, category: 'quota' });
    expect(classifyGeminiError({ code: 'DEADLINE_EXCEEDED' })).toMatchObject({ status: 504, category: 'timeout' });
    expect(classifyGeminiError({ status: 401, message: 'key value should never appear in UI' })).toMatchObject({ status: 503, category: 'authentication', message: expect.not.stringContaining('key value') });
  });

  it('classifies fetch failures with a doubly nested DNS cause as network errors', () => {
    const error = { message: 'fetch failed', cause: { cause: { code: 'ENOTFOUND', message: 'internal DNS detail' } } };
    expect(classifyGeminiError(error)).toMatchObject({ status: 503, category: 'network' });
  });

  it('classifies invalid requests and provider 5xx responses without exposing their details', () => {
    expect(classifyGeminiError({ response: { status: 400 }, code: 'INVALID_ARGUMENT', message: 'raw provider detail' })).toMatchObject({ status: 502, category: 'configuration', message: expect.not.stringContaining('raw provider detail') });
    expect(classifyGeminiError({ details: { status: 422 } })).toMatchObject({ status: 502, category: 'configuration' });
    expect(classifyGeminiError({ details: { response: { status: 503 } } })).toMatchObject({ status: 503, category: 'service' });
  });

  it('creates a safe diagnostic with only names, codes and HTTP statuses', () => {
    const diagnostic = getGeminiErrorDiagnostic({ name: 'FetchError', message: 'do not log this', cause: { details: { code: 'INVALID_ARGUMENT', response: { status: 422 } } } });
    expect(diagnostic).toEqual({ names: ['FetchError'], codes: ['INVALID_ARGUMENT'], httpStatuses: [422] });
    expect(JSON.stringify(diagnostic)).not.toContain('do not log this');
  });

  it('keeps JSON and Zod failures distinct from provider failures', async () => {
    await expect(analyzeWithGemini({ buffer: Buffer.from('x'), mime: 'image/png', category: 'fashion' }, { apiKey: 'test-key', model: 'gemini-test', client: clientReturning('not json') })).rejects.toMatchObject({ status: 502, category: 'json', message: expect.stringContaining('JSON inválido') });
  });

  it('does not create a client when the Gemini key is missing', async () => {
    await expect(analyzeWithGemini({ buffer: Buffer.from('x'), mime: 'image/png', category: 'home' }, { apiKey: '', model: 'gemini-2.5-flash' })).rejects.toMatchObject({ status: 503 });
  });
});
