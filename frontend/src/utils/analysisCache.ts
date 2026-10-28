import type { StyleCategory } from '../types/style';

export async function imageFingerprint(file: Pick<File, 'arrayBuffer'>): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function analysisCacheKey(category: StyleCategory, mode: 'real' | 'demo', fingerprint: string) {
  return `${category}:${mode}:${fingerprint}`;
}
