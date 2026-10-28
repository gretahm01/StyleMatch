import { database } from './database.js';
import type { TasteProfile } from '../types/profile.js';
import type { ProfileInput } from '../schemas/profile.js';

type ProfileRow = { id: string; alias: string | null; interest_category: TasteProfile['interestCategory']; preferred_styles: string; fashion_styles: string; home_styles: string; favorite_colors: string; avoided_colors: string; preferred_materials: string; fashion_priorities: string; fashion_cuts: string; fashion_patterns: string; created_at: string; updated_at: string };
const parseList = (value: string): string[] => JSON.parse(value) as string[];
const mapRow = (row: ProfileRow): TasteProfile => ({ id: row.id, alias: row.alias, interestCategory: row.interest_category, preferredStyles: parseList(row.preferred_styles), fashionStyles: parseList(row.fashion_styles), homeStyles: parseList(row.home_styles), favoriteColors: parseList(row.favorite_colors), avoidedColors: parseList(row.avoided_colors), preferredMaterials: parseList(row.preferred_materials), fashionPriorities: parseList(row.fashion_priorities), fashionCuts: parseList(row.fashion_cuts), fashionPatterns: parseList(row.fashion_patterns), createdAt: row.created_at, updatedAt: row.updated_at });

export function getProfile(id: string): TasteProfile | undefined {
  const row = database.prepare('SELECT * FROM taste_profiles WHERE id = ?').get(id) as ProfileRow | undefined;
  return row ? mapRow(row) : undefined;
}

export function createProfile(id: string, input: ProfileInput): TasteProfile {
  const now = new Date().toISOString();
  database.prepare('INSERT INTO taste_profiles (id, alias, interest_category, preferred_styles, fashion_styles, home_styles, favorite_colors, avoided_colors, preferred_materials, fashion_priorities, fashion_cuts, fashion_patterns, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, input.alias ?? null, input.interestCategory, JSON.stringify(input.preferredStyles), JSON.stringify(input.fashionStyles ?? []), JSON.stringify(input.homeStyles ?? []), JSON.stringify(input.favoriteColors), JSON.stringify(input.avoidedColors), JSON.stringify(input.preferredMaterials), JSON.stringify(input.fashionPriorities ?? []), JSON.stringify(input.fashionCuts ?? []), JSON.stringify(input.fashionPatterns ?? []), now, now);
  return getProfile(id)!;
}

export function ensureAnonymousProfile(id: string): TasteProfile {
  return getProfile(id) ?? createProfile(id, { alias: null, interestCategory: 'both', preferredStyles: [], fashionStyles: [], homeStyles: [], favoriteColors: [], avoidedColors: [], preferredMaterials: [], fashionPriorities: [], fashionCuts: [], fashionPatterns: [] });
}

export function updateProfile(id: string, input: ProfileInput): TasteProfile | undefined {
  const now = new Date().toISOString();
  const result = database.prepare('UPDATE taste_profiles SET alias = ?, interest_category = ?, preferred_styles = ?, fashion_styles = ?, home_styles = ?, favorite_colors = ?, avoided_colors = ?, preferred_materials = ?, fashion_priorities = ?, fashion_cuts = ?, fashion_patterns = ?, updated_at = ? WHERE id = ?').run(input.alias ?? null, input.interestCategory, JSON.stringify(input.preferredStyles), JSON.stringify(input.fashionStyles ?? []), JSON.stringify(input.homeStyles ?? []), JSON.stringify(input.favoriteColors), JSON.stringify(input.avoidedColors), JSON.stringify(input.preferredMaterials), JSON.stringify(input.fashionPriorities ?? []), JSON.stringify(input.fashionCuts ?? []), JSON.stringify(input.fashionPatterns ?? []), now, id);
  return result.changes ? getProfile(id) : undefined;
}

export function deleteProfile(id: string): boolean { return database.prepare('DELETE FROM taste_profiles WHERE id = ?').run(id).changes > 0; }
