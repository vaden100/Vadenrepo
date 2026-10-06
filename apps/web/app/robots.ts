import type { MetadataRoute } from 'next';
import { absoluteUrl, siteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  // Only production should be indexed; previews and staging set NEXT_PUBLIC_ALLOW_INDEXING=false.
  const allow = process.env.NEXT_PUBLIC_ALLOW_INDEXING !== 'false';
  return {
    rules: allow
      ? [
          {
            userAgent: '*',
            allow: '/',
            disallow: [
              '/account',
              '/auth',
              '/onboarding',
              '/api/',
              '/styleguide',
              '/privacy-settings',
              '/lookup?',
            ],
          },
        ]
      : [{ userAgent: '*', disallow: '/' }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: siteUrl,
  };
}
