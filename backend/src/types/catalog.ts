export type ProductCategory = 'fashion' | 'home';
export type CatalogStore = 'H&M México' | 'Zara México' | 'IKEA México' | 'Bershka México' | 'Liverpool México' | 'StyleMatch Demo';
export type VerificationStatus = 'verified' | 'pending_verification' | 'demo';
export type ImageRightsStatus = 'placeholder_owned' | 'authorized' | 'external_not_copied' | 'generated_owned';
export type CatalogImageKind = 'exact_product' | 'illustrative_photo' | 'svg_illustration';
export type ProductAudience = 'women' | 'men' | 'unisex' | 'unspecified';

export interface CatalogSource {
  type: 'official_product_page' | 'manual_import' | 'internal_demo';
  url: string | null;
  notes?: string;
}
export interface CatalogImageMetadata { kind: CatalogImageKind; sourceUrl: string | null; author: string | null; license: string; attribution: string | null; checkedAt: string; fallbackImage?: string | null; }

export interface CatalogProduct {
  id: string;
  externalProductId: string | null;
  name: string;
  description: string;
  store: CatalogStore;
  productUrl: string | null;
  category: ProductCategory;
  subcategory: string;
  primaryColor: string;
  secondaryColors: string[];
  styles: string[];
  material: string | null;
  price: number | null;
  currency: 'MXN';
  image: string;
  imageRightsStatus: ImageRightsStatus;
  imageMetadata?: CatalogImageMetadata;
  available: boolean | null;
  availabilityVerified: boolean;
  tags: string[];
  occasions: string[];
  genderTarget: string | null;
  productAudience: ProductAudience;
  activeForRecommendations?: boolean;
  source: CatalogSource;
  lastVerifiedAt: string | null;
  verificationStatus: VerificationStatus;
}

export interface CatalogFilters {
  category?: ProductCategory;
  color?: string;
  style?: string;
  material?: string;
  available?: boolean;
  minPrice?: number;
  maxPrice?: number;
  audience?: ProductAudience;
}
