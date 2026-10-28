import type { PresentationReport } from '../types/report';
export function serializePresentationReports(reports: PresentationReport[]): string { return JSON.stringify({ exportedAt: new Date().toISOString(), reports }, null, 2); }
export function downloadPresentationReports(reports: PresentationReport[]) {
  const blob = new Blob([serializePresentationReports(reports)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'stylematch-reportes-presentacion.json'; link.click(); URL.revokeObjectURL(url);
}
