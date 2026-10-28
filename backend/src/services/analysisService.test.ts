import { afterEach, describe, expect, it } from 'vitest';
import { env } from '../config/env.js';
import { analyzeImage } from './analysisService.js';

const originalProvider = env.aiProvider;
const originalGroqKey = env.groqApiKey;

afterEach(() => {
  env.aiProvider = originalProvider;
  env.groqApiKey = originalGroqKey;
});

describe('analysis provider selection', () => {
  it('selects Groq exclusively when AI_PROVIDER is groq', async () => {
    env.aiProvider = 'groq';
    env.groqApiKey = '';
    await expect(analyzeImage({ buffer: Buffer.from('x'), mime: 'image/png', category: 'fashion', mode: 'real' })).rejects.toMatchObject({ category: 'configuration', message: expect.stringContaining('Groq') });
  });
});
