import type { Metadata } from 'next';
import { strings } from '@ns1/i18n';
import { SITE_URL } from './site';

/** Unique title and description for every page (SPEC 13). */
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  const t = strings();
  const full = path === '/' ? title : `${title} | ${t.site.name}`;
  return {
    title: full,
    description,
    alternates: { canonical: `${SITE_URL}${path}` },
    openGraph: {
      title: full,
      description,
      url: `${SITE_URL}${path}`,
      siteName: t.site.name,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: full, description },
    robots: noindex ? { index: false, follow: false } : undefined,
  };
}
