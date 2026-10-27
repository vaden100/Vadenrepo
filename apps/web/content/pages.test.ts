import { describe, expect, it } from 'vitest';
import { page, searchPages, sitePages } from './pages';

describe('site pages', () => {
  it('has unique paths, titles and descriptions (SPEC 13)', () => {
    for (const key of ['path', 'title', 'description'] as const) {
      const values = sitePages.map((p) => p[key]);
      expect(new Set(values).size, key).toBe(values.length);
    }
  });
  it('throws on an unknown page', () => {
    expect(() => page('/nope')).toThrow();
  });
  it('finds pages by title and keyword, title first', () => {
    expect(searchPages('give')[0]?.path).toBe('/give');
    expect(searchPages('988').map((p) => p.path)).toContain('/contact');
    expect(searchPages('')).toEqual([]);
    expect(searchPages('zzzz')).toEqual([]);
  });
});
