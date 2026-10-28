import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalogRouter } from './routes/catalog.js';
import { healthRouter } from './routes/health.js';
import { analyzeRouter } from './routes/analyze.js';
import { profilesRouter } from './routes/profiles.js';
import { feedbackRouter } from './routes/feedback.js';
import { reportsRouter } from './routes/reports.js';
import { recommendationsRouter } from './routes/recommendations.js';
import { env } from './config/env.js';

export const app = express();
const publicDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://gretahm01.github.io',
  ...env.frontendUrl.split(',').map((origin) => origin.trim()).filter(Boolean),
]);

app.use((request, response, next) => {
  const origin = request.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.setHeader('Vary', 'Origin');
  }
  if (request.method === 'OPTIONS') return response.sendStatus(204);
  return next();
});

app.use(express.json({ limit: '100kb' }));
app.use('/images', express.static(path.join(publicDirectory, 'images')));
app.use('/api/health', healthRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/analyze', analyzeRouter);
