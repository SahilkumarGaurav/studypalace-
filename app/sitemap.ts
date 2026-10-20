import type { MetadataRoute } from 'next';
import { abs } from '@/lib/config';
import { listProducts } from '@/lib/repo';
import { GUIDES } from '@/lib/content';
import { CATEGORIES } from '@/lib/format';

export const dynamic = 'force-dynamic';

/**
 * sitemap.xml — regenerated on every request so new products appear in Google
 * within hours of you uploading them from the admin panel.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: abs('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: abs('/shop'), lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: abs('/guides'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: abs('/my-downloads'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: abs('/refund-policy'), lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: abs('/terms'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: abs('/privacy'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: abs('/contact'), lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: abs(`/c/${c.slug}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // The short keyword URLs rank better for typed queries; the /guides/ version
  // is canonical, so only the short ones go in the sitemap (avoid duplicates).
  const guidePages: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: abs(`/${g.slug}`),
    lastModified: new Date(g.updated),
    changeFrequency: 'monthly',
    priority: 0.9,
  }));

  let productPages: MetadataRoute.Sitemap = [];
  try {
    productPages = listProducts({ activeOnly: true, limit: 2000 }).map((p) => ({
      url: abs(`/p/${p.slug}`),
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.9,
    }));
  } catch (err) {
    console.error('[sitemap] could not list products:', (err as Error).message);
  }

  return [...staticPages, ...categoryPages, ...guidePages, ...productPages];
}
