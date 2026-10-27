import { NextResponse, type NextRequest } from 'next/server';
import { buildCsp, createNonce, staticSecurityHeaders } from '@/lib/security/headers';

/**
 * Every request: a fresh CSP nonce (Next.js reads it from the request's CSP header and applies
 * it to its own scripts) and the static security headers.
 */
export function proxy(req: NextRequest) {
  const dev = process.env.NODE_ENV !== 'production';
  const nonce = createNonce();
  const csp = buildCsp({ nonce, dev });

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set('content-security-policy', csp);
  for (const [k, v] of Object.entries(staticSecurityHeaders(dev))) res.headers.set(k, v);
  return res;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
