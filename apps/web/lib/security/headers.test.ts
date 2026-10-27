import { describe, expect, it } from 'vitest';
import { buildCsp, createNonce, staticSecurityHeaders } from './headers';

describe('CSP', () => {
  it('never allows inline scripts', () => {
    for (const dev of [true, false]) {
      const csp = buildCsp({ nonce: 'abc', dev });
      const script = csp.split('; ').find((d) => d.startsWith('script-src'))!;
      expect(script).toContain("'nonce-abc'");
      expect(script).not.toContain('unsafe-inline');
    }
  });
  it('drops eval and inline styles in production', () => {
    const csp = buildCsp({ nonce: 'abc', dev: false });
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain('upgrade-insecure-requests');
  });
  it('makes a fresh nonce each time', () => {
    expect(createNonce()).not.toBe(createNonce());
    expect(createNonce()).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  });
  it('sets HSTS only in production', () => {
    expect(staticSecurityHeaders(false)).toHaveProperty('Strict-Transport-Security');
    expect(staticSecurityHeaders(true)).not.toHaveProperty('Strict-Transport-Security');
    expect(staticSecurityHeaders(false)['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });
});
