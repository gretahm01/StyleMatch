import { describe, expect, it } from 'vitest';
import { MAX_IMAGE_SIZE_BYTES, createInvalidImageState, createReadyImageState, createSelectedImageState, initialImageUploadState, validateImageFile } from './imageUpload';

const image = (type: string, size: number) => ({ type, size }) as File;

describe('image upload validation', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])('accepts %s', (type) => {
    expect(validateImageFile(image(type, 1024))).toBeNull();
  });

  it('rejects unsupported formats', () => {
    expect(validateImageFile(image('image/gif', 1024))).toBe('Selecciona una imagen JPG, PNG o WebP.');
  });

  it('rejects a file larger than 5 MB', () => {
    expect(validateImageFile(image('image/jpeg', MAX_IMAGE_SIZE_BYTES + 1))).toBe('La imagen debe pesar 5 MB o menos.');
  });
});

describe('image upload states', () => {
  it('represents empty, selected, invalid and ready states', () => {
    const file = image('image/png', 100) as File;
    expect(initialImageUploadState.status).toBe('empty');
    expect(createSelectedImageState(file).status).toBe('selected');
    expect(createInvalidImageState('Archivo inválido').status).toBe('invalid');
    expect(createReadyImageState(file, 'blob:preview').status).toBe('ready');
  });

  it('replaces the previous image state with the new valid image', () => {
    const first = image('image/jpeg', 100) as File;
    const replacement = image('image/webp', 200) as File;
    const firstState = createReadyImageState(first, 'blob:first');
    const replacementState = createReadyImageState(replacement, 'blob:replacement');
    expect(firstState.file).toBe(first);
    expect(replacementState.file).toBe(replacement);
    expect(replacementState.previewUrl).toBe('blob:replacement');
  });
});
