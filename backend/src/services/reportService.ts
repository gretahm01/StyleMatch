import { randomUUID } from 'node:crypto';
import { database } from './database.js';
import type { ReportInput } from '../schemas/report.js';
import type { PresentationReport } from '../types/report.js';
type ReportRow = { id: string; profile_id: string | null; profile_alias: string | null; test_case: PresentationReport['testCase']; category: PresentationReport['category']; occasion: PresentationReport['occasion']; min_price: number | null; max_price: number | null; audience: PresentationReport['audience']; mode: PresentationReport['mode']; analysis_json: string; recommendations_json: string; manual_quality: string | null; created_at: string };
const mapRow = (row: ReportRow): PresentationReport => ({ id: row.id, profileId: row.profile_id, profileAlias: row.profile_alias, testCase: row.test_case, category: row.category, occasion: row.occasion, minPrice: row.min_price, maxPrice: row.max_price, audience: row.audience ?? 'unspecified', mode: row.mode, analysis: JSON.parse(row.analysis_json), recommendations: JSON.parse(row.recommendations_json), manualQuality: row.manual_quality, createdAt: row.created_at });
export function createReport(input: ReportInput): PresentationReport {
  const id = randomUUID(); const now = new Date().toISOString();
  database.prepare('INSERT INTO presentation_reports (id, profile_id, profile_alias, test_case, category, occasion, min_price, max_price, audience, mode, analysis_json, recommendations_json, manual_quality, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, input.profileId ?? null, input.profileAlias ?? null, input.testCase ?? null, input.category, input.occasion, input.minPrice ?? null, input.maxPrice ?? null, input.audience, input.mode, JSON.stringify(input.analysis), JSON.stringify(input.recommendations), input.manualQuality ?? null, now);
  return getReport(id)!;
}
export function getReport(id: string): PresentationReport | undefined { const row = database.prepare('SELECT * FROM presentation_reports WHERE id = ?').get(id) as ReportRow | undefined; return row ? mapRow(row) : undefined; }
export function listReports(profileId?: string): PresentationReport[] { const rows = profileId ? database.prepare('SELECT * FROM presentation_reports WHERE profile_id = ? ORDER BY created_at DESC').all(profileId) : database.prepare('SELECT * FROM presentation_reports ORDER BY created_at DESC').all(); return (rows as ReportRow[]).map(mapRow); }
