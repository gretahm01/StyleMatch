import { database } from './database.js';
import type { FeedbackInput } from '../schemas/feedback.js';
import type { ProductFeedback } from '../types/feedback.js';

type FeedbackRow = { profile_id: string; product_id: string; rating: number | null; is_favorite: number; not_interested: number; created_at: string; updated_at: string };
const mapRow = (row: FeedbackRow): ProductFeedback => ({ profileId: row.profile_id, productId: row.product_id, rating: row.rating, isFavorite: Boolean(row.is_favorite), notInterested: Boolean(row.not_interested), createdAt: row.created_at, updatedAt: row.updated_at });
export function getFeedback(profileId: string, productId: string): ProductFeedback | undefined { const row = database.prepare('SELECT * FROM product_feedback WHERE profile_id = ? AND product_id = ?').get(profileId, productId) as FeedbackRow | undefined; return row ? mapRow(row) : undefined; }
export function listFeedback(profileId: string): ProductFeedback[] { return (database.prepare('SELECT * FROM product_feedback WHERE profile_id = ? ORDER BY updated_at DESC').all(profileId) as FeedbackRow[]).map(mapRow); }
export function saveFeedback(profileId: string, productId: string, input: FeedbackInput): ProductFeedback {
  const current = getFeedback(profileId, productId); const rating = input.rating === undefined ? current?.rating ?? null : input.rating;
  const notInterested = input.notInterested === undefined ? current?.notInterested ?? false : input.notInterested;
  const isFavorite = notInterested ? false : (input.isFavorite === undefined ? current?.isFavorite ?? false : input.isFavorite);
  const now = new Date().toISOString();
  database.prepare('INSERT INTO product_feedback (profile_id, product_id, rating, is_favorite, not_interested, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(profile_id, product_id) DO UPDATE SET rating = excluded.rating, is_favorite = excluded.is_favorite, not_interested = excluded.not_interested, updated_at = excluded.updated_at').run(profileId, productId, rating, Number(isFavorite), Number(notInterested), current?.createdAt ?? now, now);
  return getFeedback(profileId, productId)!;
}
export function deleteFeedback(profileId: string, productId: string): boolean { return database.prepare('DELETE FROM product_feedback WHERE profile_id = ? AND product_id = ?').run(profileId, productId).changes > 0; }
export function clearFeedback(profileId: string): number { return Number(database.prepare('DELETE FROM product_feedback WHERE profile_id = ?').run(profileId).changes); }
