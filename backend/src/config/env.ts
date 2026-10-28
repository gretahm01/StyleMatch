import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

export const env = {
  port: Number(process.env.PORT ?? 3001),
  aiProvider: process.env.AI_PROVIDER ?? 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite',
  groqApiKey: process.env.GROQ_API_KEY,
  groqVisionModel: process.env.GROQ_VISION_MODEL ?? 'qwen/qwen3.8-27b',
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiVisionModel: process.env.OPENAI_VISION_MODEL ?? 'gpt-4.1-mini',
  forceDemoMode: process.env.ANALYSIS_DEMO_MODE === 'true',
};
