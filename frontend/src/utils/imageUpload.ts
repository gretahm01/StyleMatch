import type { ImageUploadState } from '../types/imageUpload';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const initialImageUploadState: ImageUploadState = { status: 'empty', file: null, previewUrl: null, error: null };

export function validateImageFile(file: Pick<File, 'type' | 'size'>): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) return 'Selecciona una imagen JPG, PNG o WebP.';
  if (file.size > MAX_IMAGE_SIZE_BYTES) return 'La imagen debe pesar 5 MB o menos.';
  return null;
}

export function createInvalidImageState(error: string): ImageUploadState {
  return { status: 'invalid', file: null, previewUrl: null, error };
}

export function createSelectedImageState(file: File): ImageUploadState {
  return { status: 'selected', file, previewUrl: null, error: null };
}

export function createReadyImageState(file: File, previewUrl: string): ImageUploadState {
  return { status: 'ready', file, previewUrl, error: null };
}
