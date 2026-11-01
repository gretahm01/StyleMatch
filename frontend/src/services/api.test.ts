import { describe, expect, it } from 'vitest';
import { apiUrl } from './api';

describe('apiUrl', () => {
  it('shows an explicit development configuration error when VITE_API_URL is missing', () => {
    expect(() => apiUrl('/api/health')).toThrow('Falta VITE_API_URL en desarrollo');
  });

  it('keeps complete external URLs unchanged', () => {
    expect(apiUrl('https://example.test/images/catalog/item.png')).toBe('https://example.test/images/catalog/item.png');
  });
});
