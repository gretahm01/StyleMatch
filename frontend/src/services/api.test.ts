import { describe, expect, it } from 'vitest';
import { apiUrl } from './api';

describe('apiUrl', () => {
  it('uses the local backend in development when no public API URL is configured', () => {
    expect(apiUrl('/api/health')).toBe('http://localhost:3001/api/health');
  });

  it('keeps complete external URLs unchanged', () => {
    expect(apiUrl('https://example.test/images/catalog/item.png')).toBe('https://example.test/images/catalog/item.png');
  });
});
