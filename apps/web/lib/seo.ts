import type { Metadata } from 'next';
import { en } from '@rmmm/ui';
import { absoluteUrl } from './site';

interface PageMeta {
  title: string;
  description: string;
  path: string;
  /** Short label printed above the title on the social card ("Guide", "Legal"...). */
  kind?: string;
  noindex?: boolean;
}

/** Unique title, description, canonical, Open Graph and X card with a per-page image (WBS 26, 27). */
export function pageMetadata({
  title,
  description,
  path,
  kind = 'RUN ME MY MONEY',
  noindex,
}: PageMeta): Metadata {
  const og = `/og?${new URLSearchParams({ title, kind }).toString()}`;
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      type: 'website',
      siteName: en.site.name,
      title,
      description,
      url: absoluteUrl(path),
      images: [{ url: og, width: 1200, height: 630, alt: `${title}. ${en.site.name}` }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [og] },
    robots: noindex ? { index: false, follow: false } : undefined,
  };
}
