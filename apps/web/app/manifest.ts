import type { MetadataRoute } from 'next';
import { en } from '@rmmm/ui';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: en.site.name,
    short_name: 'RMMM',
    description: en.site.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#111111',
    theme_color: '#111111',
    icons: [{ src: '/brand/app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
