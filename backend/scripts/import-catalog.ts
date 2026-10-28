import { copyFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalogSchema, type CatalogInput } from '../src/schemas/catalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(root, 'src/data/catalog.json');
const inputPath = process.argv[2];
if (!inputPath) throw new Error('Uso: npm run catalog:import -- <archivo.json|archivo.csv>');

function parseCsvRow(row: string): string[] {
  const cells: string[] = [];
  let value = ''; let quoted = false;
  for (let index = 0; index < row.length; index += 1) {
    const char = row[index];
    if (char === '"' && row[index + 1] === '"') { value += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { cells.push(value.trim()); value = ''; }
    else value += char;
  }
  cells.push(value.trim());
  if (quoted) throw new Error('CSV inválido: comillas sin cerrar.');
  return cells;
}

function asList(value: string | undefined): string[] { return value ? value.split('|').map((item) => item.trim()).filter(Boolean) : []; }
function csvToProducts(text: string): unknown[] {
  const [header, ...rows] = text.split(/\r?\n/).filter(Boolean).map(parseCsvRow);
  return rows.map((row) => Object.fromEntries(header.map((field, index) => [field, row[index] ?? '']))).map((raw) => ({
    ...raw, externalProductId: raw.externalProductId || null, productUrl: raw.productUrl || null, material: raw.material || null,
    price: raw.price ? Number(raw.price) : null, available: raw.available === '' ? null : raw.available === 'true',
    availabilityVerified: raw.availabilityVerified === 'true', secondaryColors: asList(raw.secondaryColors), styles: asList(raw.styles),
    tags: asList(raw.tags), occasions: asList(raw.occasions), genderTarget: raw.genderTarget || null,
    source: { type: raw.sourceType || 'manual_import', url: raw.sourceUrl || null, notes: raw.sourceNotes || undefined },
    lastVerifiedAt: raw.lastVerifiedAt || null, verificationStatus: raw.verificationStatus || 'pending_verification',
  }));
}

const inputText = await readFile(path.resolve(inputPath), 'utf8');
const rawProducts = inputPath.toLowerCase().endsWith('.csv') ? csvToProducts(inputText) : JSON.parse(inputText);
const parsed = catalogSchema.safeParse(rawProducts);
if (!parsed.success) {
  console.error(JSON.stringify(parsed.error.flatten(), null, 2));
  process.exitCode = 1;
} else {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await copyFile(catalogPath, `${catalogPath}.${timestamp}.bak`);
  await writeFile(catalogPath, `${JSON.stringify(parsed.data satisfies CatalogInput[], null, 2)}\n`, 'utf8');
  console.log(`Catálogo importado: ${parsed.data.length} productos. Copia de respaldo creada.`);
}
