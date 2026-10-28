import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type Product = { id: string; name: string; subcategory: string; primaryColor: string; secondaryColors: string[]; image: string; };
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'src', 'data', 'catalog.json');
const outputDir = join(root, 'public', 'images', 'catalog');
const tones: Record<string, string> = { negro: '#252321', blanco: '#faf8f2', gris: '#8e928e', beige: '#d8b995', arena: '#d7b98d', crema: '#f4e6cc', cafe: '#795548', marron: '#795548', terracota: '#b96749', rojo: '#c94b43', rosa: '#de8fa2', azul: '#5e83a9', verde: '#708665', olivo: '#78804c', morado: '#8c6aa5', amarillo: '#dbad37', naranja: '#dc7d32', vino: '#7f3941', borgona: '#7f3941', oro: '#c59c43' };
const color = (name: string, fallback: string) => tones[name.toLowerCase()] ?? fallback;
const esc = (value: string) => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function fashionShape(subcategory: string, main: string, accent: string) {
  const key = subcategory.toLowerCase();
  if (/bolso|mochila/.test(key)) return `<path d="M78 105h84l-7 75H85z" fill="${main}"/><path d="M101 105c0-31 38-31 38 0" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round"/><circle cx="120" cy="140" r="6" fill="${accent}"/>`;
  if (/tenis|zapat/.test(key)) return `<path d="M57 151c22-2 34-22 45-51l23 13c11 22 31 31 57 36 11 2 17 10 16 22H57z" fill="${main}"/><path d="M105 125l27 8m-34 6 27 8m-33 6 22 8" stroke="${accent}" stroke-width="5" stroke-linecap="round"/><path d="M58 173h140" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>`;
  if (/zapato|botin|mocas/.test(key)) return `<path d="M65 157c28-4 31-36 39-67h24c7 31 20 49 54 59 11 3 16 10 15 24H65z" fill="${main}"/><path d="M83 173h113" stroke="${accent}" stroke-width="8" stroke-linecap="round"/><path d="M108 105h23" stroke="${accent}" stroke-width="5"/>`;
  if (/chamarra|chaqueta|abrigo/.test(key)) return `<path d="M80 72l40 20 40-20 25 43-23 19v57H78v-57l-23-19z" fill="${main}"/><path d="M120 92v99m-22-72 22 22 22-22" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round"/><path d="M78 145h22m42 0h20" stroke="${accent}" stroke-width="6"/>`;
  if (/pantal|jeans/.test(key)) return `<path d="M81 63h78l-8 130h-31l-2-72-9 72H78z" fill="${main}"/><path d="M82 82h76m-38 0v39" stroke="${accent}" stroke-width="6"/>`;
  if (/blusa|camisa|top/.test(key)) return `<path d="M83 79l37 17 37-17 25 35-23 18v60H81v-60l-23-18z" fill="${main}"/><path d="M120 96v48" stroke="${accent}" stroke-width="5"/>`;
  if (/vestido/.test(key)) return `<path d="M103 65h34l12 48 29 78H62l29-78z" fill="${main}"/><path d="M104 65c0 17 32 17 32 0m-34 73h36" fill="none" stroke="${accent}" stroke-width="5"/>`;
  if (/accesor|joyer|cinturon|bufanda/.test(key)) return `<circle cx="93" cy="120" r="25" fill="none" stroke="${main}" stroke-width="11"/><circle cx="147" cy="120" r="25" fill="none" stroke="${main}" stroke-width="11"/><path d="M114 120h12m-46 45 12 16m56-16-12 16" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>`;
  return `<rect x="72" y="80" width="96" height="112" rx="16" fill="${main}"/><path d="M88 110h64" stroke="${accent}" stroke-width="8"/>`;
}
function homeShape(subcategory: string, main: string, accent: string) {
  const key = subcategory.toLowerCase();
  if (/lampara/.test(key)) return `<path d="M91 110h58l-12-47h-34z" fill="${main}"/><path d="M120 110v54m-28 17h56" stroke="${accent}" stroke-width="8" stroke-linecap="round"/><path d="M91 110h58" stroke="${accent}" stroke-width="6"/>`;
  if (/cojin/.test(key)) return `<rect x="65" y="72" width="110" height="110" rx="25" fill="${main}"/><path d="M83 95c30 19 43 19 74 0m-74 64c30-19 43-19 74 0" fill="none" stroke="${accent}" stroke-width="6"/>`;
  if (/alfombra/.test(key)) return `<rect x="49" y="88" width="142" height="83" rx="14" fill="${main}"/><path d="M71 109h98m-98 22h98m-98 22h98" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`;
  if (/mesa/.test(key)) return `<ellipse cx="120" cy="91" rx="62" ry="19" fill="${main}"/><path d="M76 92l10 89m78-89-10 89" stroke="${main}" stroke-width="10" stroke-linecap="round"/><path d="M86 133h68" stroke="${accent}" stroke-width="6"/>`;
  if (/cuadro|lamina/.test(key)) return `<rect x="63" y="57" width="114" height="135" rx="5" fill="${accent}"/><rect x="72" y="66" width="96" height="117" fill="#fffaf0"/><path d="M83 155l24-31 19 18 17-30 15 43z" fill="${main}"/><circle cx="140" cy="95" r="10" fill="${main}"/>`;
  if (/florero|jarron/.test(key)) return `<path d="M101 61h38v34c0 18 20 33 20 60 0 29-17 41-39 41s-39-12-39-41c0-27 20-42 20-60z" fill="${main}"/><path d="M103 94h34" stroke="${accent}" stroke-width="7"/><path d="M120 62c-5-18 4-28 15-38m-7 72c11-17 22-24 38-26" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>`;
  return `<path d="M77 88h86v78H77z" fill="${main}"/><path d="M93 88V68h54v20m-42 78 15-28 15 28" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>`;
}
function svg(product: Product) {
  const main = color(product.primaryColor, '#b96749'); const accent = color(product.secondaryColors[0] ?? 'crema', '#f4e6cc');
  const shape = product.id.startsWith('fashion') ? fashionShape(product.subcategory, main, accent) : homeShape(product.subcategory, main, accent);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-labelledby="title-${product.id} desc-${product.id}"><title id="title-${product.id}">${esc(product.name)}</title><desc id="desc-${product.id}">Ilustración original de ${esc(product.subcategory)} en color ${esc(product.primaryColor)}; no es una fotografía comercial.</desc><rect width="240" height="240" rx="28" fill="#f8f1e5"/><circle cx="120" cy="120" r="92" fill="#efe1cd"/>${shape}<text x="120" y="218" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="#5a4134">STYLEMATCH ILUSTRACIÓN</text></svg>`;
}

const products = JSON.parse(await readFile(catalogPath, 'utf8')) as Product[];
await mkdir(outputDir, { recursive: true });
for (const product of products) {
  const filename = `${product.id}.svg`;
  await writeFile(join(outputDir, filename), svg(product), 'utf8');
  product.image = `/images/catalog/${filename}`;
}
await writeFile(catalogPath, `${JSON.stringify(products, null, 2)}\n`, 'utf8');
console.log(`Generated ${products.length} original catalog illustrations.`);
