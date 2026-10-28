import type { CatalogProduct } from '../types/catalog.js';

export interface CatalogImageTask {
  id: string;
  name: string;
  category: CatalogProduct['category'];
  subcategory: string;
  primaryColor: string;
  material: string | null;
  fallbackImage: string;
  outputBaseName: string;
  prompt: string;
}

const svgImage = (image: string) => /\.svg(?:$|\?)/i.test(image);

/** Builds a generic prompt from local metadata; it never asks for retailer designs. */
export function buildCatalogImagePrompt(product: Pick<CatalogProduct, 'name' | 'category' | 'subcategory' | 'primaryColor' | 'material'>): string {
  const material = product.material ? `The visible material may resemble ${product.material}.` : 'Do not infer a specific material that is not visible.';
  const category = product.category === 'fashion' ? 'fashion accessory or garment' : 'home decoration object';
  return [
    'Create one photorealistic, synthetic catalog photograph for an academic demo.',
    `Subject: a generic ${category}, ${product.subcategory}, named only for internal reference as "${product.name}".`,
    `Show a ${product.primaryColor} item, consistent with that product class. ${material}`,
    'Centered isolated product on a warm neutral beige studio background, soft natural shadow, clean editorial lighting, 4:3 composition.',
    'It must be a new generic illustrative object: no people, no logos, no text, no labels, no watermarks, no retail packaging, no brand identifiers, and no copied or recognizable store design.',
    'This is an illustrative synthetic image, not an official photograph of a commercial product.',
  ].join(' ');
}

export function getPendingCatalogImageTasks(products: CatalogProduct[]): CatalogImageTask[] {
  return products
    .filter((product) => product.activeForRecommendations !== false && svgImage(product.image))
    .map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      subcategory: product.subcategory,
      primaryColor: product.primaryColor,
      material: product.material,
      fallbackImage: product.image,
      outputBaseName: `${product.id}-gemini`,
      prompt: buildCatalogImagePrompt(product),
    }));
}
