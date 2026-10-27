import type { NextConfig } from 'next';

// Security headers (nonce CSP, HSTS, frame, referrer, permissions) are set in proxy.ts so every
// response gets the same set (SPEC 14).
const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@ns1/ui', '@ns1/tokens', '@ns1/i18n'],
  images: { formats: ['image/avif', 'image/webp'] },
};

export default config;
