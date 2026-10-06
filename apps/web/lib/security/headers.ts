/**
 * Security headers (WBS 34, 35, 91; SPEC 11), built per request so the CSP can carry a nonce.
 *
 * Scripts: nonce + 'strict-dynamic' only. No 'unsafe-inline' and no 'unsafe-eval' in
 * production (React dev tooling needs eval in development only).
 * Styles: 'unsafe-inline' is kept because React `style` attributes cannot carry a nonce.
 * Style injection cannot execute script; documented in docs/website-foundations.md section 17.
 */
export interface CspOptions {
  nonce: string;
  dev: boolean;
  supabaseUrl?: string;
  turnstile?: boolean;
  analyticsHost?: string;
}

function origin(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function buildCsp(o: CspOptions): string {
  const supabase = origin(o.supabaseUrl);
  const analytics = o.analyticsHost ? origin(`https://${o.analyticsHost}`) : null;
  const connect = ["'self'", supabase, supabase?.replace(/^http/, 'ws'), analytics].filter(Boolean);
  const frames = ["'self'", o.turnstile ? 'https://challenges.cloudflare.com' : null].filter(
    Boolean,
  );
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    // 'strict-dynamic': scripts loaded by a trusted (nonce'd) script are trusted; host lists are ignored
    // by modern browsers but kept as a fallback for old ones.
    'script-src': [
      `'nonce-${o.nonce}'`,
      "'strict-dynamic'",
      "'self'",
      ...(o.turnstile ? ['https://challenges.cloudflare.com'] : []),
      ...(analytics ? [analytics] : []),
      ...(o.dev ? ["'unsafe-eval'"] : []),
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'"],
    'connect-src': connect as string[],
    'media-src': ["'self'", 'blob:'],
    'frame-src': frames as string[],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'none'"],
    'object-src': ["'none'"],
  };
  const csp = Object.entries(directives)
    .map(([k, v]) => `${k} ${v.join(' ')}`)
    .join('; ');
  return o.dev ? csp : `${csp}; upgrade-insecure-requests`;
}

/** Headers for every response (documents, API, static files, 403/429). */
export function staticSecurityHeaders(dev: boolean): Record<string, string> {
  return {
    ...(dev ? {} : { 'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload' }),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Microphone is allowed for our own origin only (voice notes, Phase 2). Everything else off.
    'Permissions-Policy':
      'camera=(), microphone=(self), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'X-DNS-Prefetch-Control': 'off',
  };
}

/** 128-bit random nonce, base64. */
export function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

/** Pages that show private data must never be cached by browsers or CDNs (WBS 144). */
export const PRIVATE_PATHS = /^\/(account|onboarding|auth)(\/|$)|^\/api\//;
