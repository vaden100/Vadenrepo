import { describe, expect, it } from 'vitest';
import { en, flatten, format, locales, strings } from './index';

describe('i18n', () => {
  it('falls back to English', () => {
    expect(strings('xx')).toBe(en);
  });
  it('formats slots and leaves unknown ones', () => {
    expect(format('{a} and {b}', { a: 1 })).toBe('1 and {b}');
  });
  it('every locale has every key', () => {
    const keys = flatten(en).map(([k]) => k);
    for (const l of locales) expect(flatten(strings(l)).map(([k]) => k)).toEqual(keys);
  });
  it('has no empty strings', () => {
    for (const [k, v] of flatten(en)) expect(v.trim(), k).not.toBe('');
  });
});
