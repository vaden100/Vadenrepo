/**
 * Security headers (SPEC 3, 14), built per request so the CSP carries a fresh nonce.
 *
 * Scripts: nonce + 'strict-dynamic' only. Never 'unsafe-inline'; 'unsafe-eval' in development
 * only (React dev tooling). Styles: nonce in production, so injected <style> cannot run either.
 * New third parties: add them here, on /legal/subprocessors and in docs/operations.md, together.
 */
export interface CspOptions {
  nonce: string;
  dev: boolean;
}

export function buildCsp({ nonce, dev }: CspOptions): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      "'self'",
      ...(dev ? ["'unsafe-eval'"] : []),
    ],
    // Dev overlay injects styles without a nonce; production does not.
    'style-src': ["'self'", dev ? "'unsafe-inline'" : `'nonce-${nonce}'`],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", ...(dev ? ['ws:'] : [])],
    'media-src': ["'self'"],
    'frame-src': ["'none'"],
    'worker-src': ["'self'"],
    'manifest-src': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'none'"],
    'object-src': ["'none'"],
  };
  const csp = Object.entries(directives)
    .map(([k, v]) => `${k} ${v.join(' ')}`)
    .join('; ');
  return dev ? csp : `${csp}; upgrade-insecure-requests`;
}

export function staticSecurityHeaders(dev: boolean): Record<string, string> {
  return {
    ...(dev ? {} : { 'Strict-Transport-Security': 'max-age=63072000; includeSubDomains' }),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  };
}

/** 128-bit random nonce, base64. */
export function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}
