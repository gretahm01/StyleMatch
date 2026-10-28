import { useCallback, useEffect, useRef, useState } from 'react';
import type { ImageUploadState } from '../types/imageUpload';
import { createInvalidImageState, createReadyImageState, initialImageUploadState, validateImageFile } from '../utils/imageUpload';

export function useImageUpload() {
  const [state, setState] = useState<ImageUploadState>(initialImageUploadState);
  const objectUrlRef = useRef<string | null>(null);
  const revokePreview = useCallback(() => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
  }, []);
  const clear = useCallback(() => { revokePreview(); setState(initialImageUploadState); }, [revokePreview]);
  const selectFile = useCallback((file: File) => {
    revokePreview();
    const error = validateImageFile(file);
    if (error) { setState(createInvalidImageState(error)); return; }
    const previewUrl = URL.createObjectURL(file);
    objectUrlRef.current = previewUrl;
    setState(createReadyImageState(file, previewUrl));
  }, [revokePreview]);
  useEffect(() => revokePreview, [revokePreview]);
  return { ...state, selectFile, clear, isReady: state.status === 'ready' };
}
