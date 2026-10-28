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

export const app = express();
const publicDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');

app.use(express.json({ limit: '100kb' }));
app.use('/images', express.static(path.join(publicDirectory, 'images')));
app.use('/api/health', healthRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/analyze', analyzeRouter);
