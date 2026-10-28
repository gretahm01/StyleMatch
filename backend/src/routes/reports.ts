import { Router } from 'express';
import { z } from 'zod';
import { reportInputSchema } from '../schemas/report.js';
import { createReport, listReports } from '../services/reportService.js';
export const reportsRouter = Router();
reportsRouter.get('/', (request, response) => { const profileId = z.string().uuid().optional().safeParse(request.query.profileId); if (!profileId.success) return response.status(400).json({ message: 'Identificador de perfil no válido.' }); return response.json({ reports: listReports(profileId.data) }); });
reportsRouter.post('/', (request, response) => { const input = reportInputSchema.safeParse(request.body); if (!input.success) return response.status(400).json({ message: 'Datos de reporte no válidos.' }); return response.status(201).json({ report: createReport(input.data) }); });
