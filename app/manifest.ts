import type { MetadataRoute } from 'next';
import { abs, config } from '@/lib/config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${config.site.name} — NIFT Preparation PDFs`,
    short_name: config.site.name,
    description: config.site.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fbfaff',
    theme_color: '#7916ff',
    categories: ['education', 'shopping'],
    icons: [
      { src: abs('/icon.svg'), sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: abs('/icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: abs('/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: abs('/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
