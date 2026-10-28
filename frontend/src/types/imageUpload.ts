export type ImageUploadStatus = 'empty' | 'selected' | 'invalid' | 'ready';

export interface ImageUploadState {
  status: ImageUploadStatus;
  file: File | null;
  previewUrl: string | null;
  error: string | null;
}
