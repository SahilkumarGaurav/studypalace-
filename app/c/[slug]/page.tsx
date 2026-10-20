import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { countProducts, listProducts } from '@/lib/repo';
import { CATEGORIES, categoryName } from '@/lib/format';
import { breadcrumbJsonLd } from '@/lib/seo';
import { abs } from '@/lib/config';
import ProductGrid from '@/components/ProductGrid';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = CATEGORIES.find((c) => c.slug === slug);
  if (!cat) return { title: 'Category not found' };
  const count = countProducts({ category: cat.slug });
  return {
    title: `${cat.name} PDFs for NIFT 2027 — Buy & Instant Download`,
    description: `${cat.blurb} Buy downloadable ${cat.name} study material for NIFT 2027 (B.Des & B.FTech). ${count} PDF${count === 1 ? '' : 's'} available with instant download after payment. Keywords: ${cat.keywords.join(', ')}.`,
    keywords: cat.keywords,
    alternates: { canonical: abs(`/c/${slug}`) },
    openGraph: {
      title: `${cat.name} PDFs — NIFT 2027 preparation material`,
      description: cat.blurb,
      url: abs(`/c/${slug}`),
      type: 'website',
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = CATEGORIES.find((c) => c.slug === slug);
  if (!cat) notFound();

  const products = listProducts({ category: slug, sort: 'manual', limit: 96 });
  const others = CATEGORIES.filter((c) => c.slug !== cat.slug);

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
          <li>
            <Link href="/shop" className="hover:text-brand-700">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-900">{cat.short}</li>
        </ol>
      </nav>

      <header className="mb-8 max-w-3xl">
        <span className="badge bg-brand-50 text-brand-700">{cat.keywords[0]}</span>
        <h1 className="h-display mt-3 text-3xl leading-tight sm:text-4xl">{cat.name} — NIFT 2027 PDFs</h1>
        <p className="mt-3 text-[15px] leading-7 text-ink-600">{cat.blurb}</p>
      </header>

      <ProductGrid
        products={products}
        emptyTitle={`No ${cat.short} PDFs uploaded yet`}
        emptyText="This section is being stocked. Meanwhile, read our free guide for this section — it covers the full syllabus and practice plan."
        href={cat.slug === 'gat' ? '/nift-gat-syllabus-pdf' : cat.slug === 'cat' ? '/nift-cat-drawing-practice-pdf' : '/nift-situation-test-material'}
        hrefLabel="Read the free guide"
      />

      <section className="mt-14 rounded-3xl border border-ink-100 bg-white p-6 shadow-card">
        <h2 className="font-display text-lg font-extrabold text-ink-950">Other sections</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {others.map((c) => (
            <Link key={c.slug} href={`/c/${c.slug}`} className="chip">
              {c.name}
            </Link>
          ))}
          <Link href="/shop" className="chip !border-brand-300 !bg-brand-50 !text-brand-700">
            All PDFs →
          </Link>
        </div>
      </section>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Home', url: '/' },
              { name: 'Shop', url: '/shop' },
              { name: cat.name, url: `/c/${cat.slug}` },
            ]),
          ),
        }}
      />
    </div>
  );
}
