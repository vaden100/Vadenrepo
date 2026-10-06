import { describe, expect, it } from 'vitest';
import { cssVariables } from './css';
import { colors } from './colors';

describe('cssVariables', () => {
  const css = cssVariables();
  it('exports every palette color', () => {
    for (const hex of Object.values(colors)) expect(css).toContain(hex);
  });
  it('defaults to dark, follows the OS when unset, and honors an explicit choice', () => {
    expect(css).toMatch(/:root, \[data-theme="dark"\] \{[^}]*--color-background: #111111;/);
    expect(css).toMatch(
      /prefers-color-scheme: light\) \{\s*:root:not\(\[data-theme="dark"\]\) \{[^}]*--color-background: #F2EEE6;/,
    );
    expect(css).toMatch(/\n\[data-theme="light"\] \{[^}]*--color-background: #F2EEE6;/);
    expect(css).toMatch(/color-scheme: light;/);
  });
  it('exposes WBS semantic aliases, motion, z-index and fluid type tokens', () => {
    for (const v of [
      '--color-text-primary',
      '--color-accent',
      '--color-accent-hover',
      '--color-error',
      '--color-success',
      '--color-warning',
      '--color-info',
      '--color-surface-elevated',
      '--duration-fast',
      '--ease-emphasized',
      '--z-modal',
      '--z-toast',
      '--radius-md',
      '--shadow-md: none',
      '--text-fluid-display',
    ]) {
      expect(css).toContain(v);
    }
  });
  it('zeroes motion for reduced-motion users', () => {
    expect(css).toContain('prefers-reduced-motion: reduce');
  });
});
