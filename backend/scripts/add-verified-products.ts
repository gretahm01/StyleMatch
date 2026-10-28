import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'src', 'data', 'catalog.json');
const checkedAt = '2026-10-27T18:00:00-06:00';
const official = (store: 'Zara México' | 'IKEA México' | 'Bershka México' | 'Liverpool México', id: string, name: string, url: string, category: 'fashion' | 'home', subcategory: string, color: string, price: number, material: string | null, tags: string[], occasions: string[]) => ({
  id, externalProductId: url.match(/-(\d+)\.html|-(\d+)\/$/)?.slice(1).find(Boolean) ?? null, name,
  description: `${name}. Producto real verificado en página oficial; la tarjeta usa una ilustración original, no una fotografía comercial.`,
  store, productUrl: url, category, subcategory, primaryColor: color, secondaryColors: ['sin color secundario verificado'],
  styles: [], material, price, currency: 'MXN', image: `/images/catalog/${id}.svg`, imageRightsStatus: 'placeholder_owned',
  available: true, availabilityVerified: true, tags, occasions, genderTarget: category === 'fashion' ? 'mujer' : null,
  source: { type: 'official_product_page', url, notes: 'Datos factuales consultados en página oficial. Disponibilidad mostrada en catálogo; puede variar por ubicación. Imagen local: ilustración original, no imagen de tienda.' },
  lastVerifiedAt: checkedAt, verificationStatus: 'verified',
});
const verified = [
  official('Zara México', 'zara-16428810', 'BOLSA DE HOMBRO PIEL', 'https://www.zara.com/mx/es/bolsa-de-hombro-piel-p16428810.html', 'fashion', 'bolsos', 'azul', 1699, 'piel', ['bolso', 'hombro', 'piel'], ['daily', 'work', 'date']),
  official('Zara México', 'zara-16483810', 'BOLSO DE MANO SATINADO', 'https://www.zara.com/mx/es/bolso-de-mano-satinado-p16483810.html', 'fashion', 'bolsos', 'verde lima', 1399, null, ['bolso', 'mano', 'satinado'], ['party', 'date']),
  official('Zara México', 'zara-16048810', 'BOLSA DE HOMBRO ESTAMPADO TEXTURA', 'https://www.zara.com/mx/es/bolsa-de-hombro-estampado-textura-p16048810.html', 'fashion', 'bolsos', 'multicolor', 1099, null, ['bolso', 'hombro', 'estampado'], ['casual', 'daily']),
  official('Zara México', 'zara-16869810', 'BOLSA DE HOMBRO ABALORIOS', 'https://www.zara.com/mx/es/bolsa-de-hombro-abalorios-p16869810.html', 'fashion', 'bolsos', 'naranja', 1399, null, ['bolso', 'hombro', 'abalorios'], ['party', 'date']),
  official('Zara México', 'zara-16448810', 'BOLSA BANDOLERA SOLAPA', 'https://www.zara.com/mx/es/bolsa-bandolera-solapa-p16448810.html', 'fashion', 'bolsos', 'negro', 799, null, ['bolso', 'bandolera', 'solapa'], ['casual', 'daily']),
  official('IKEA México', 'ikea-40608529', 'IKEA PS 2026 Lámpara de piso, azul, 182 cm', 'https://www.ikea.com/mx/es/p/ikea-ps-2026-lampara-de-piso-azul-40608529/', 'home', 'lámparas', 'azul', 1499, 'acero con recubrimiento en polvo', ['lámpara', 'piso', 'iluminación'], ['workspace', 'cozy_atmosphere']),
  official('IKEA México', 'ikea-60544051', 'BARLAST Lámpara de piso, negro/blanco, 150 cm', 'https://www.ikea.com/mx/es/p/barlast-lampara-de-piso-negro-blanco-60544051/', 'home', 'lámparas', 'negro', 279, 'acero con recubrimiento en polvo y plástico de polipropileno', ['lámpara', 'piso', 'iluminación'], ['workspace', 'cozy_atmosphere']),
  official('IKEA México', 'ikea-90544399', 'TÄRNABY Lámpara de mesa, atenuable carbón, 25 cm', 'https://www.ikea.com/mx/es/p/taernaby-lampara-de-mesa-atenuable-carbon-90544399/', 'home', 'lámparas', 'carbón', 999, null, ['lámpara', 'mesa', 'atenuable'], ['workspace', 'cozy_atmosphere']),
  official('IKEA México', 'ikea-70544178', 'DEJSA Lámpara de mesa, beige/ópalo vidrio, 28 cm', 'https://www.ikea.com/mx/es/p/dejsa-lampara-de-mesa-beige-opalo-vidrio-70544178/', 'home', 'lámparas', 'beige', 1499, 'vidrio ópalo', ['lámpara', 'mesa', 'iluminación'], ['workspace', 'cozy_atmosphere']),
  official('IKEA México', 'ikea-00563580', 'RÖDFLIK Lámpara de piso, lectura, verde grisáceo', 'https://www.ikea.com/mx/es/p/roedflik-lampara-de-piso-lectura-verde-grisaceo-00563580/', 'home', 'lámparas', 'verde grisáceo', 1299, null, ['lámpara', 'piso', 'lectura'], ['workspace', 'cozy_atmosphere']),
  official('IKEA México', 'ikea-10544421', 'ÅRSTID Lámpara de mesa, latón/blanco', 'https://www.ikea.com/mx/es/p/arstid-lampara-de-mesa-laton-blanco-10544421/', 'home', 'lámparas', 'latón', 799, null, ['lámpara', 'mesa', 'iluminación'], ['workspace', 'cozy_atmosphere']),
  official('IKEA México', 'ikea-90594841', 'STRANDAD Lámpara de piso, blanco/negro', 'https://www.ikea.com/mx/es/p/strandad-lampara-de-piso-blanco-negro-90594841/', 'home', 'lámparas', 'blanco', 399, null, ['lámpara', 'piso', 'iluminación'], ['workspace', 'cozy_atmosphere']),
  official('IKEA México', 'ikea-90589118', 'SPETSBOJ Lámpara de mesa, atenuable/blanco, 22 cm', 'https://www.ikea.com/mx/es/p/spetsboj-lampara-de-mesa-atenuable-blanco-90589118/', 'home', 'lámparas', 'blanco', 399, null, ['lámpara', 'mesa', 'atenuable'], ['workspace', 'cozy_atmosphere']),
  official('IKEA México', 'ikea-60585616', 'BLÅSVERK Lámpara de mesa, rojo, 36 cm', 'https://www.ikea.com/mx/es/p/blasverk-lampara-de-mesa-rojo-60585616/', 'home', 'lámparas', 'rojo', 499, null, ['lámpara', 'mesa', 'iluminación'], ['workspace', 'cozy_atmosphere']),
  official('Bershka México', 'bershka-2439478800', 'Pantalón jogger', 'https://www.bershka.com/mx/pantal%C3%B3n-jogger-c0p238451467.html?colorId=800', 'fashion', 'pantalones', 'negro', 549, null, ['pantalón', 'jogger'], ['casual', 'daily']),
  official('Liverpool México', 'liverpool-1174669813', 'Tenis de mujer', 'https://www.liverpool.com.mx/tienda/pdp/tenis-de-mujer/1174669813', 'fashion', 'tenis', 'negro', 1424.25, null, ['tenis', 'deportivo'], ['casual', 'daily']),
  official('Liverpool México', 'liverpool-1208825000', 'Chamarra para mujer', 'https://www.liverpool.com.mx/tienda/pdp/chamarra-para-mujer/1208825000', 'fashion', 'chamarras', 'negro', 2039.15, null, ['chamarra', 'mujer'], ['casual', 'daily']),
  official('Liverpool México', 'liverpool-1208694282', 'Cinturón para mujer', 'https://www.liverpool.com.mx/tienda/pdp/cintur%C3%B3n-para-mujer/1208694282', 'fashion', 'cinturones', 'negro', 211.65, null, ['cinturón', 'accesorio'], ['casual', 'daily']),
  official('Liverpool México', 'liverpool-1176394218', 'Tenis para mujer', 'https://www.liverpool.com.mx/tienda/pdp/tenis-para-mujer/1176394218', 'fashion', 'tenis', 'negro', 799.2, null, ['tenis', 'casual'], ['casual', 'daily']),
  official('Liverpool México', 'liverpool-1196594556', 'Chamarra para mujer', 'https://www.liverpool.com.mx/tienda/pdp/chamarra-para-mujer/1196594556', 'fashion', 'chamarras', 'negro', 1274.15, null, ['chamarra', 'mujer'], ['casual', 'daily']),
  official('Liverpool México', 'liverpool-1174662665', 'Chamarra para mujer', 'https://www.liverpool.com.mx/tienda/pdp/chamarra-para-mujer/1174662665', 'fashion', 'chamarras', 'negro', 1444.15, null, ['chamarra', 'deportiva'], ['casual', 'daily']),
  official('Liverpool México', 'liverpool-1162531426', 'Tenis para mujer', 'https://www.liverpool.com.mx/tienda/pdp/Tenis-para-mujer/1162531426', 'fashion', 'tenis', 'blanco', 1146.65, null, ['tenis', 'casual'], ['casual', 'daily']),
  official('Liverpool México', 'liverpool-1185410583', 'Bolsa para mujer', 'https://www.liverpool.com.mx/tienda/pdp/Bolsa-para-mujer/1185410583', 'fashion', 'bolsos', 'rosa', 599, null, ['bolso', 'mujer'], ['casual', 'daily']),
  official('Liverpool México', 'liverpool-1130263881', 'Cinturón para mujer', 'https://www.liverpool.com.mx/tienda/pdp/cinturon-para-mujer/1130263881', 'fashion', 'cinturones', 'negro', 296.65, null, ['cinturón', 'accesorio'], ['casual', 'daily']),
];
const existing = JSON.parse(await readFile(catalogPath, 'utf8')) as Array<{ id: string }>;
const retained = existing.filter((product) => !verified.some((entry) => entry.id === product.id));
await writeFile(catalogPath, `${JSON.stringify([...retained, ...verified], null, 2)}\n`, 'utf8');
console.log(`Kept ${retained.length} existing records and added ${verified.length} verified products.`);
