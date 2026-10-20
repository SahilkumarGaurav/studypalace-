/**
 * format.ts — pure, dependency-free helpers.
 *
 * NOTHING in this file may import the database, `fs` or anything server-only,
 * because client components ('use client') import from it. Keeping it pure is
 * what stops Next.js from trying to bundle better-sqlite3 into the browser.
 */

import { config, abs } from './config';

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */

/** 19900 -> "₹199" */
export const inr = (paise: number): string => {
  const rupees = (Number(paise) || 0) / 100;
  return `₹${rupees.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

/** Alias used in server code that reads nicer next to DB columns. */
export const money = inr;

export function discountPercent(product: { price_paise: number; mrp_paise?: number | null }): number {
  const mrp = Number(product.mrp_paise || 0);
  const price = Number(product.price_paise || 0);
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(iso);
}

/* ------------------------------------------------------------------ */
/* Text                                                                */
/* ------------------------------------------------------------------ */

/**
 * Split a stored highlights/tags/keywords blob into items.
 * Accepts newline- or comma-separated input, and strips bullet characters.
 */
export function splitList(value?: string | null): string[] {
  return (value || '')
    .split(/\r?\n|,(?![^[]*\])/)
    .map((s) => s.trim().replace(/^[-•*]\s*/, ''))
    .filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Catalogue taxonomy                                                  */
/* ------------------------------------------------------------------ */

export interface CategoryDef {
  slug: string;
  name: string;
  short: string;
  blurb: string;
  keywords: string[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    slug: 'gat',
    name: 'GAT — General Ability Test',
    short: 'GAT',
    blurb: 'Quant, English, Reasoning, GK & Current Affairs practice PDFs.',
    keywords: ['NIFT GAT', 'GAT syllabus', 'GAT question bank', 'NIFT general ability test'],
  },
  {
    slug: 'cat',
    name: 'CAT — Creative Ability Test',
    short: 'CAT',
    blurb: 'Drawing, perspective, human figures, colour theory & design thinking sheets.',
    keywords: ['NIFT CAT', 'creative ability test', 'fashion illustration', 'CAT drawing practice'],
  },
  {
    slug: 'situation-test',
    name: 'Situation Test',
    short: 'Situation Test',
    blurb: '3D model-making ideas, material handling, write-up formats and solved examples.',
    keywords: ['NIFT situation test', '3D model making', 'situation test material'],
  },
  {
    slug: 'previous-year-papers',
    name: 'Previous Year Papers',
    short: 'PYQs',
    blurb: 'NIFT GAT & CAT previous year question papers with answer keys.',
    keywords: ['NIFT previous year papers', 'NIFT PYQ', 'NIFT question papers'],
  },
  {
    slug: 'current-affairs',
    name: 'Current Affairs & Fashion GK',
    short: 'Current Affairs',
    blurb: 'Monthly capsules, fashion industry news, designers, textiles & handlooms.',
    keywords: ['NIFT current affairs', 'fashion GK', 'NIFT general knowledge'],
  },
  {
    slug: 'bundles',
    name: 'Complete Bundles',
    short: 'Bundles',
    blurb: 'Everything for one exam in a single download, at a bundle price.',
    keywords: ['NIFT complete package', 'NIFT study material bundle'],
  },
];

export type CategorySlug = CategoryDef['slug'];

export function categoryName(slug?: string | null): string {
  const found = CATEGORIES.find((c) => c.slug === (slug || '').toLowerCase());
  return found ? found.name : slug || 'Study material';
}

export function categoryShort(slug?: string | null): string {
  const found = CATEGORIES.find((c) => c.slug === (slug || '').toLowerCase());
  return found ? found.short : slug || 'PDF';
}

/* ------------------------------------------------------------------ */
/* Site metadata defaults (pure)                                       */
/* ------------------------------------------------------------------ */

export function siteDefaults() {
  return {
    title: {
      default: `${config.site.name} — NIFT 2027 Preparation PDFs & eBooks | Instant Download`,
      template: `%s | ${config.site.name}`,
    },
    description: config.site.description,
    metadataBase: new URL(abs('/')),
    applicationName: config.site.name,
    keywords: [
      'NIFT 2027',
      'NIFT preparation books PDF',
      'NIFT GAT study material',
      'NIFT CAT drawing practice PDF',
      'NIFT situation test material',
      'NIFT previous year question papers',
      'NIFT B.Des fashion design',
      'buy NIFT ebooks online',
      'NIFT study material download',
      'fashion design entrance preparation',
    ],
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      url: abs('/'),
      siteName: config.site.name,
      title: `${config.site.name} — NIFT 2027 Preparation PDFs | Instant Download`,
      description: config.site.description,
      images: [{ url: abs('/og.png'), width: 1200, height: 630, alt: config.site.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${config.site.name} — NIFT 2027 Preparation PDFs`,
      description: config.site.description,
      images: [abs('/og.png')],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    alternates: { canonical: abs('/') },
  };
}
