import { fileTypeFromBuffer } from 'file-type';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export async function validateImageBuffer(buffer: Buffer, declaredMime: string): Promise<string> {
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_IMAGE_MIMES.includes(detected.mime as (typeof ALLOWED_IMAGE_MIMES)[number])) {
    throw new Error('El archivo no contiene una imagen JPG, PNG o WebP válida.');
  }
  if (detected.mime !== declaredMime) throw new Error('El tipo real de la imagen no coincide con el archivo enviado.');
  return detected.mime;
}
