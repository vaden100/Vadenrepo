import { describe, expect, it } from 'vitest';
import { colorTokenNames, contrast, cssVariables, requiredPairs, themes } from './index';

describe('contrast helper', () => {
  it('matches known WCAG values', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrast('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
  });
  it('rejects bad input', () => {
    expect(() => contrast('red', '#fff')).toThrow();
  });
});

for (const [name, palette] of Object.entries(themes)) {
  describe(`theme ${name}`, () => {
    it('defines every token', () => {
      for (const t of colorTokenNames) expect(palette[t], t).toMatch(/^#[0-9A-F]{6}$/);
    });
    for (const [fg, bg, min] of requiredPairs) {
      it(`${fg} on ${bg} >= ${min}:1`, () => {
        expect(contrast(palette[fg], palette[bg])).toBeGreaterThanOrEqual(min);
      });
    }
  });
}

describe('cssVariables', () => {
  it('emits every theme and token', () => {
    const css = cssVariables();
    for (const t of ['--color-background', '--color-on-accent', '--color-focus', '--space-9'])
      expect(css).toContain(t);
    expect(css).toContain('data-contrast="more"');
    expect(css).toContain('prefers-color-scheme: dark');
  });
});
