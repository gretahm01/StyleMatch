import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { catalogSchema } from '../src/schemas/catalog.js';
import { getPendingCatalogImageTasks } from '../src/services/catalogImagePreparation.js';
import type { CatalogProduct } from '../src/types/catalog.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'src', 'data', 'catalog.json');
const outputDir = join(root, 'public', 'images', 'catalog');
const maxRequestsPerExecution = 3;
loadEnv({ path: join(root, '.env') });

const args = process.argv.slice(2);
const execute = args.includes('--execute');
const suppliedLimit = args.find((argument) => argument.startsWith('--limit='));
const requestedLimit = suppliedLimit ? Number(suppliedLimit.slice('--limit='.length)) : undefined;
if (requestedLimit !== undefined && (!Number.isInteger(requestedLimit) || requestedLimit < 1)) throw new Error('El valor de --limit debe ser un entero positivo.');
if (execute && requestedLimit !== undefined && requestedLimit > maxRequestsPerExecution) throw new Error(`Por seguridad, una ejecución admite como máximo ${maxRequestsPerExecution} solicitudes. Ejecuta lotes separados.`);
if (execute && process.env.ALLOW_CATALOG_IMAGE_GENERATION !== 'true') throw new Error('La generación está bloqueada. Define ALLOW_CATALOG_IMAGE_GENERATION=true en backend/.env solo después de autorizarla explícitamente.');
if (execute && (!process.env.GEMINI_API_KEY || !process.env.GEMINI_IMAGE_MODEL)) throw new Error('Falta GEMINI_API_KEY o GEMINI_IMAGE_MODEL en backend/.env. No se realizó ninguna solicitud.');

const rawCatalog = JSON.parse(await readFile(catalogPath, 'utf8')) as CatalogProduct[];
const { getAllProducts } = await import('../src/services/catalogService.js');
const tasks = getPendingCatalogImageTasks(getAllProducts()).filter((task) => !existsSync(join(outputDir, `${task.outputBaseName}.png`)) && !existsSync(join(outputDir, `${task.outputBaseName}.webp`)));
const limit = execute ? requestedLimit ?? 1 : tasks.length;
const selectedTasks = tasks.slice(0, limit);
console.log(`Modo: ${execute ? 'EJECUCIÓN CONTROLADA' : 'SIMULACIÓN (sin solicitudes a Gemini)'}`);
console.log(`Productos activos pendientes con SVG: ${tasks.length}. Lote actual: ${selectedTasks.length}.`);
for (const task of selectedTasks) console.log(`\n[${task.id}] ${task.name}\nPrompt: ${task.prompt}\nFallback SVG: ${task.fallbackImage}`);
if (!execute) {
  console.log('\nDry-run terminado. No se generaron imágenes, no se modificó catalog.json y no se utilizó ninguna API key.');
  process.exit(0);
}

type GeneratedPart = { inlineData?: { data?: string; mimeType?: string } };
type GeneratedResponse = { candidates?: Array<{ content?: { parts?: GeneratedPart[] } }> };
const mimeExtension: Record<string, string> = { 'image/png': 'png', 'image/webp': 'webp' };
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
await mkdir(outputDir, { recursive: true });
for (const task of selectedTasks) {
  const response = await ai.models.generateContent({ model: process.env.GEMINI_IMAGE_MODEL!, contents: [{ role: 'user', parts: [{ text: task.prompt }] }], config: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '4:3', imageSize: '1K' } } }) as unknown as GeneratedResponse;
  const image = response.candidates?.flatMap((candidate) => candidate.content?.parts ?? []).find((part) => part.inlineData?.data)?.inlineData;
  const extension = image?.mimeType ? mimeExtension[image.mimeType] : undefined;
  if (!image?.data || !extension) throw new Error(`Gemini no devolvió una imagen PNG o WebP válida para ${task.id}. El catálogo no fue actualizado para ese producto.`);
  const relativeImage = `/images/catalog/${task.outputBaseName}.${extension}`;
  await writeFile(join(outputDir, `${task.outputBaseName}.${extension}`), Buffer.from(image.data, 'base64'));
  const index = rawCatalog.findIndex((product) => product.id === task.id);
  if (index < 0) throw new Error(`No se encontró ${task.id} al actualizar el catálogo.`);
  rawCatalog[index] = { ...rawCatalog[index], image: relativeImage, imageRightsStatus: 'generated_owned', imageMetadata: { kind: 'illustrative_photo', sourceUrl: null, author: 'StyleMatch AI', license: 'Generada con IA, ilustrativa; no es una fotografía oficial ni corresponde necesariamente al producto comercial enlazado.', attribution: null, checkedAt: new Date().toISOString(), fallbackImage: task.fallbackImage } };
}
catalogSchema.parse(rawCatalog);
await writeFile(catalogPath, `${JSON.stringify(rawCatalog, null, 2)}\n`, 'utf8');
console.log(`\nSe actualizaron ${selectedTasks.length} productos. Se conservaron sus SVG en imageMetadata.fallbackImage.`);
