import type { MetadataRoute } from 'next';
import { legalDocs } from '@/content/legal';
import { guides } from '@/content/resources';
import { absoluteUrl } from '@/lib/site';

/** Public, indexable pages only (no account, auth, API, styleguide, search results). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date('2026-10-05');
  const page = (
    path: string,
    priority: number,
    changeFrequency: 'weekly' | 'monthly' | 'yearly' = 'monthly',
  ) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency,
    priority,
  });
  return [
    page('/', 1, 'weekly'),
    page('/lookup', 0.9, 'weekly'),
    page('/resources', 0.8),
    ...guides.map((g) => page(`/resources/${g.slug}`, 0.8)),
    page('/about', 0.6),
    page('/contact', 0.5),
    ...legalDocs.map((d) => page(`/legal/${d.slug}`, 0.3, 'yearly')),
  ];
}
