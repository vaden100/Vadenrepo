import type { MetadataRoute } from 'next';
import { sitePages } from '@/content/pages';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return sitePages
    .filter((p) => p.path !== '/styleguide' && p.path !== '/search')
    .map((p) => ({ url: `${SITE_URL}${p.path === '/' ? '' : p.path}` || SITE_URL }));
}
