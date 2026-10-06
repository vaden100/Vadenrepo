import type { NextConfig } from 'next';

// Security headers (CSP with a per-request nonce, HSTS, frame, referrer, permissions) are set in
// proxy.ts so every response, including 403/429 and static files, gets the same set.
const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@rmmm/ui', '@rmmm/tokens', '@rmmm/api', '@rmmm/search-core'],
  images: { formats: ['image/avif', 'image/webp'] },
};

export default config;
