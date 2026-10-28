import { z } from 'zod';

export const catalogProductSchema = z.object({
  id: z.string().min(1),
  externalProductId: z.string().min(1).nullable(),
  name: z.string().min(1),
  description: z.string().min(1),
  store: z.enum(['H&M México', 'Zara México', 'IKEA México', 'Bershka México', 'Liverpool México', 'StyleMatch Demo']),
  productUrl: z.url().nullable(),
  category: z.enum(['fashion', 'home']),
  subcategory: z.string().min(1),
  primaryColor: z.string().min(1),
  secondaryColors: z.array(z.string().min(1)).min(1),
  styles: z.array(z.string().min(1)),
  material: z.string().min(1).nullable(),
  price: z.number().finite().nonnegative().nullable(),
  currency: z.literal('MXN'),
  image: z.string().min(1),
  imageRightsStatus: z.enum(['placeholder_owned', 'authorized', 'external_not_copied', 'generated_owned']),
  imageMetadata: z.object({ kind: z.enum(['exact_product', 'illustrative_photo', 'svg_illustration']), sourceUrl: z.url().nullable(), author: z.string().min(1).nullable(), license: z.string().min(1), attribution: z.string().min(1).nullable(), checkedAt: z.string().datetime({ offset: true }), fallbackImage: z.string().min(1).nullable().optional() }).optional(),
  available: z.boolean().nullable(),
  availabilityVerified: z.boolean(),
  tags: z.array(z.string().min(1)),
  occasions: z.array(z.string().min(1)),
  genderTarget: z.string().min(1).nullable(),
  productAudience: z.enum(['women', 'men', 'unisex', 'unspecified']).optional().default('unspecified'),
  activeForRecommendations: z.boolean().optional().default(true),
  source: z.object({ type: z.enum(['official_product_page', 'manual_import', 'internal_demo']), url: z.url().nullable(), notes: z.string().optional() }),
  lastVerifiedAt: z.string().datetime({ offset: true }).nullable(),
  verificationStatus: z.enum(['verified', 'pending_verification', 'demo']),
}).superRefine((product, context) => {
  if (product.verificationStatus === 'verified' && (!product.productUrl || product.source.type !== 'official_product_page' || !product.source.url || !product.lastVerifiedAt)) {
    context.addIssue({ code: 'custom', message: 'Un producto verificado requiere URL oficial y fecha de verificación.' });
  }
  if (product.verificationStatus === 'demo' && (product.store !== 'StyleMatch Demo' || product.productUrl !== null)) {
    context.addIssue({ code: 'custom', message: 'Los productos DEMO no pueden atribuirse a una tienda externa.' });
  }
  const allowedHost = product.store === 'H&M México' ? 'hm.com' : product.store === 'Zara México' ? 'zara.com' : product.store === 'IKEA México' ? 'ikea.com' : product.store === 'Bershka México' ? 'bershka.com' : product.store === 'Liverpool México' ? 'liverpool.com.mx' : null;
  if (allowedHost && product.source.type === 'official_product_page' && product.source.url) {
    const host = new URL(product.source.url).hostname;
    if (host !== allowedHost && !host.endsWith(`.${allowedHost}`)) context.addIssue({ code: 'custom', path: ['source', 'url'], message: 'La fuente oficial no corresponde a la tienda declarada.' });
  }
});

export const catalogSchema = z.array(catalogProductSchema).superRefine((products, context) => {
  const seen = new Set<string>();
  products.forEach((product, index) => {
    if (seen.has(product.id)) context.addIssue({ code: 'custom', path: [index, 'id'], message: 'ID duplicado.' });
    seen.add(product.id);
  });
});

export type CatalogInput = z.infer<typeof catalogProductSchema>;
