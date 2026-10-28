import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const defaultPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data/stylematch.db');
const databasePath = process.env.STYLEMATCH_DB_PATH ?? (process.env.NODE_ENV === 'test' ? ':memory:' : defaultPath);
if (databasePath !== ':memory:') mkdirSync(path.dirname(databasePath), { recursive: true });

export const database = new DatabaseSync(databasePath);
database.exec(`
  CREATE TABLE IF NOT EXISTS taste_profiles (
    id TEXT PRIMARY KEY,
    alias TEXT,
    interest_category TEXT NOT NULL,
    preferred_styles TEXT NOT NULL,
    favorite_colors TEXT NOT NULL,
    avoided_colors TEXT NOT NULL,
    preferred_materials TEXT NOT NULL,
    fashion_styles TEXT NOT NULL DEFAULT '[]',
    home_styles TEXT NOT NULL DEFAULT '[]',
    fashion_priorities TEXT NOT NULL DEFAULT '[]',
    fashion_cuts TEXT NOT NULL DEFAULT '[]',
    fashion_patterns TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);
const profileColumns = database.prepare('PRAGMA table_info(taste_profiles)').all() as Array<{ name: string }>;
const addProfileColumn = (name: string) => { if (!profileColumns.some((column) => column.name === name)) database.exec(`ALTER TABLE taste_profiles ADD COLUMN ${name} TEXT NOT NULL DEFAULT '[]'`); };
addProfileColumn('fashion_styles'); addProfileColumn('home_styles'); addProfileColumn('fashion_priorities'); addProfileColumn('fashion_cuts'); addProfileColumn('fashion_patterns');
database.exec(`
  CREATE TABLE IF NOT EXISTS product_feedback (
    profile_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    rating INTEGER,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    not_interested INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (profile_id, product_id),
    CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    CHECK (is_favorite IN (0, 1)),
    CHECK (not_interested IN (0, 1))
  )
`);
database.exec(`
  CREATE TABLE IF NOT EXISTS presentation_reports (
    id TEXT PRIMARY KEY,
    profile_id TEXT,
    test_case TEXT,
    category TEXT NOT NULL,
    occasion TEXT NOT NULL,
    min_price REAL,
    max_price REAL,
    audience TEXT NOT NULL DEFAULT 'unspecified',
    mode TEXT NOT NULL,
    analysis_json TEXT NOT NULL,
    recommendations_json TEXT NOT NULL,
    manual_quality TEXT,
    created_at TEXT NOT NULL
  )
`);
const reportColumns = database.prepare('PRAGMA table_info(presentation_reports)').all() as Array<{ name: string }>;
if (!reportColumns.some((column) => column.name === 'profile_alias')) database.exec('ALTER TABLE presentation_reports ADD COLUMN profile_alias TEXT');
if (!reportColumns.some((column) => column.name === 'audience')) database.exec("ALTER TABLE presentation_reports ADD COLUMN audience TEXT NOT NULL DEFAULT 'unspecified'");
