import { describe, expect, it } from 'vitest';
import { analyzeWithGroq, classifyGroqError } from './groqAnalysisService.js';

const validAnalysis = { category: 'fashion', relevant: true, detectedObject: 'Bolso', primaryColors: ['beige'], secondaryColors: [], style: ['minimalista'], possibleMaterials: ['material probable'], visualDescription: 'Bolso beige.', observedFeatures: ['forma estructurada'], inferences: [], confidenceNotes: [], retryReason: null };

describe('Groq analysis service', () => {
  it('sends the image as a data URL and validates the JSON response', async () => {
    let request: unknown;
    const client = { chat: { completions: { create: async (input: unknown) => { request = input; return { choices: [{ message: { content: JSON.stringify(validAnalysis) } }] }; } } } };
    const analysis = await analyzeWithGroq({ buffer: Buffer.from('image-bytes'), mime: 'image/png', category: 'fashion' }, { apiKey: 'test-key', model: 'qwen/qwen3.8-27b', client });
    expect(analysis.detectedObject).toBe('Bolso');
    expect(JSON.stringify(request)).toContain('data:image/png;base64,aW1hZ2UtYnl0ZXM=');
    expect(request).toMatchObject({
      reasoning_effort: 'none',
      reasoning_format: 'hidden',
      response_format: { type: 'json_schema', json_schema: { name: 'style_image_analysis', strict: true } },
    });
  });

  it('rejects a missing key without creating a request', async () => {
    await expect(analyzeWithGroq({ buffer: Buffer.from('x'), mime: 'image/png', category: 'fashion' }, { apiKey: '', model: 'qwen/qwen3.8-27b' })).rejects.toMatchObject({ status: 503, category: 'configuration' });
  });

  it('classifies provider errors with a safe message', () => {
    const error = classifyGroqError({ response: { status: 503 }, message: 'internal provider detail' });
    expect(error).toMatchObject({ status: 503, category: 'service', message: expect.not.stringContaining('internal provider detail') });
  });
});
