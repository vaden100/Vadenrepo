import { describe, expect, it } from 'vitest';
import { cssVariables } from './css';
import { colors } from './colors';

describe('cssVariables', () => {
  const css = cssVariables();
  it('exports every palette color', () => {
    for (const hex of Object.values(colors)) expect(css).toContain(hex);
  });
  it('defaults to dark and supports light', () => {
    expect(css).toMatch(/:root \{[^}]*--color-background: #111111;/);
    expect(css).toMatch(/\[data-theme="light"\] \{[^}]*--color-background: #F2EEE6;/);
  });
  it('zeroes motion for reduced-motion users', () => {
    expect(css).toContain('prefers-reduced-motion: reduce');
  });
});
