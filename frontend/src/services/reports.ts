import type { PresentationReport, PresentationReportInput } from '../types/report';
import { apiUrl } from './api';
const json = { 'Content-Type': 'application/json' };
export async function createPresentationReport(input: PresentationReportInput): Promise<PresentationReport> {
  const response = await fetch(apiUrl('/api/reports'), { method: 'POST', headers: json, body: JSON.stringify(input) });
  if (!response.ok) throw new Error('No fue posible guardar el reporte de presentación.');
  return (await response.json() as { report: PresentationReport }).report;
}
export async function getPresentationReports(profileId: string): Promise<PresentationReport[]> {
  const response = await fetch(apiUrl(`/api/reports?profileId=${encodeURIComponent(profileId)}`));
  if (!response.ok) throw new Error('No fue posible consultar los reportes.');
  return (await response.json() as { reports: PresentationReport[] }).reports;
}
