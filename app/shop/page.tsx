import type { Metadata } from 'next';
import Link from 'next/link';
import { countProducts, listCategories, listProducts } from '@/lib/repo';
import { CATEGORIES, categoryName } from '@/lib/format';
import { breadcrumbJsonLd } from '@/lib/seo';
import { abs } from '@/lib/config';
import ProductGrid from '@/components/ProductGrid';
import ShopFilters from '@/components/ShopFilters';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Buy NIFT Preparation PDFs & eBooks — GAT, CAT, Situation Test',
  description:
    'Shop downloadable NIFT 2027 preparation PDFs: GAT question banks, CAT drawing and perspective practice sheets, Situation Test model-making guides, previous year papers, current affairs and fashion GK capsules. Instant download after Razorpay payment.',
  keywords: [
    'buy NIFT preparation books PDF',
    'NIFT study material online',
    'NIFT GAT question bank PDF',
    'NIFT CAT practice sheets',
    'NIFT situation test material',
    'NIFT previous year papers PDF',
    'NIFT ebooks download',
  ],
  alternates: { canonical: abs('/shop') },
  openGraph: {
    title: 'NIFT Preparation PDFs — Buy & Download Instantly',
    description:
      'GAT, CAT and Situation Test study material for NIFT 2027. Instant PDF download after payment.',
    url: abs('/shop'),
    type: 'website',
  },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; sort?: string; max?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q || '').trim();
  const cat = (sp.cat || '').trim().toLowerCase();
  const sort = (['newest', 'popular', 'price_asc', 'price_desc', 'title'] as const).includes(sp.sort as never)
    ? (sp.sort as 'newest' | 'popular' | 'price_asc' | 'price_desc' | 'title')
    : 'newest';
  const maxPaise = sp.max && Number(sp.max) > 0 ? Math.round(Number(sp.max) * 100) : null;

  let products = listProducts({ search: q || undefined, category: cat || undefined, sort, limit: 96 });
  if (maxPaise !== null) products = products.filter((p) => Number(p.price_paise) <= maxPaise);

  const counts: Record<string, number> = {};
  for (const c of CATEGORIES) counts[c.slug] = countProducts({ category: c.slug });
  counts.all = countProducts({});

  const activeCategory = CATEGORIES.find((c) => c.slug === cat);
  const title = activeCategory
    ? `${activeCategory.name} PDFs — Buy & Download`
    : q
      ? `Search results for “${q}”`
      : 'All NIFT Preparation PDFs & eBooks';

  return (
    <div className="container-x py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1.5 text-[12.5px] font-semibold text-ink-500">
          <li>
            <Link href="/" className="hover:text-brand-700">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-900">{activeCategory ? activeCategory.short : 'Shop'}</li>
        </ol>
      </nav>

      <header className="mb-6">
        <h1 className="h-display text-3xl leading-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-7 text-ink-600">
          {activeCategory
            ? activeCategory.blurb
            : 'Every file is a downloadable PDF for NIFT 2027 — GAT, CAT, Situation Test, previous year papers and current affairs. Pay once, download instantly, re-download forever.'}
        </p>
        <p className="mt-2 text-sm font-bold text-ink-500">
          {products.length} {products.length === 1 ? 'product' : 'products'}
          {maxPaise !== null ? ` under ₹${sp.max}` : ''}
        </p>
      </header>

      <div className="sticky top-16 z-30 -mx-4 mb-6 border-y border-ink-100 bg-white/95 px-4 py-4 backdrop-blur-xl sm:mx-0 sm:rounded-3xl sm:border sm:px-5">
        <ShopFilters counts={counts} />
      </div>

      <ProductGrid products={products} />

      {products.length > 0 && (
        <div className="mt-12 rounded-3xl border border-ink-100 bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-extrabold text-ink-950">Browse by NIFT section</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/c/${c.slug}`} className="chip">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Home', url: '/' },
              { name: activeCategory ? categoryName(activeCategory.slug) : 'Shop', url: activeCategory ? `/c/${activeCategory.slug}` : '/shop' },
            ]),
          ),
        }}
      />
    </div>
  );
}
