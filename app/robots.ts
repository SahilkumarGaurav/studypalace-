import type { MetadataRoute } from 'next';
import { abs } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private / transactional URLs: no SEO value and no reason to crawl.
        disallow: ['/admin', '/api/', '/checkout', '/order/', '/my-downloads'],
      },
    ],
    sitemap: abs('/sitemap.xml'),
    host: abs('/'),
  };
}
