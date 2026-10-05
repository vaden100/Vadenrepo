import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

// SPEC 11: CSP, HSTS, X-Frame-Options, Referrer-Policy. Third-party origins (Supabase,
// Turnstile, Mux, Sentry) get added here as each phase brings them in.
const supabaseOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
      : '';
  } catch {
    return '';
  }
})();
const supabaseConnect = supabaseOrigin
  ? ` ${supabaseOrigin} ${supabaseOrigin.replace(/^http/, 'ws')}`
  : '';
const turnstile = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  ? ' https://challenges.cloudflare.com'
  : '';

const csp = [
  "default-src 'self'",
  // Next.js inline bootstrap scripts need 'unsafe-inline' until we move to nonces.
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}${turnstile}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${supabaseConnect}`,
  "media-src 'self' blob:",
  `frame-src 'self'${turnstile}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=(), interest-cohort=()',
  },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@rmmm/ui', '@rmmm/tokens', '@rmmm/api'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default config;
