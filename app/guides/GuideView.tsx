import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGuide, GUIDES, type Guide } from '@/lib/content';
import { abs } from '@/lib/config';
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/seo';
import { countProducts, listProducts } from '@/lib/repo';
import GuideBody from '@/components/GuideBody';
import ProductGrid from '@/components/ProductGrid';
import Newsletter from '@/components/Newsletter';

/**
 * Shared renderer for every SEO guide, used by both /guides/[slug] and the
 * short top-level URLs (/nift-gat-syllabus-pdf etc.) so the canonical page
 * exists at exactly one address and the others 301 to it.
 */

export function guideMetadata(slug: string): Metadata {
  const guide = getGuide(slug);
  if (!guide) return { title: 'Guide not found' };
  return {
    title: guide.seoTitle,
    description: guide.description,
    keywords: guide.keywords,
    alternates: { canonical: abs(`/guides/${guide.slug}`) },
    openGraph: {
      type: 'article',
      url: abs(`/guides/${guide.slug}`),
      title: guide.seoTitle,
      description: guide.description,
      publishedTime: guide.updated,
      modifiedTime: guide.updated,
      images: [{ url: abs(`/api/cover/${guide.slug}.png`), width: 1200, height: 630, alt: guide.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.seoTitle,
      description: guide.description,
      images: [abs(`/api/cover/${guide.slug}.png`)],
    },
  };
}

export function GuideView({ slug, canonicalPath }: { slug: string; canonicalPath?: string }) {
  const guide = getGuide(slug);
  if (!guide) notFound();

  const products = guide.relatedCategory
    ? listProducts({ category: guide.relatedCategory, sort: 'popular', limit: 4 })
    : [];
  const relatedGuides = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 4);
  const productCount = guide.relatedCategory ? countProducts({ category: guide.relatedCategory }) : 0;

  return (
    <>
      <article className="container-x py-8 sm:py-12">
        <nav aria-label="Breadcrumb" className="mb-5">
          <ol className="flex flex-wrap items-center gap-1.5 text-[12.5px] font-semibold text-ink-500">
            <li>
              <Link href="/" className="hover:text-brand-700">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/guides" className="hover:text-brand-700">
                Guides
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="line-clamp-1 text-ink-900">{guide.category}</li>
          </ol>
        </nav>

        <header className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-brand-50 text-brand-700">{guide.category}</span>
            <span className="badge bg-mint-50 text-mint-700">Free guide</span>
            <span className="text-[12px] font-semibold text-ink-400">
              {guide.readMinutes} min read • updated{' '}
              <time dateTime={guide.updated}>
                {new Date(guide.updated).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </time>
            </span>
          </div>

          <h1 className="h-display mt-4 text-[30px] leading-[1.15] sm:text-[42px]">{guide.title}</h1>
          <p className="mt-4 text-[17px] font-semibold leading-8 text-brand-700">{guide.hero}</p>
          <p className="mt-3 text-[15px] leading-7 text-ink-600">{guide.description}</p>
        </header>

        {/* jump links */}
        <nav aria-label="On this page" className="mt-8 rounded-3xl border border-ink-100 bg-white p-5 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-widest text-ink-400">In this guide</p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {headingsFrom(guide.body).map((h, i) => (
              <li key={h.id} className="flex gap-2 text-[13.5px] font-semibold text-ink-700">
                <span className="text-brand-400">{String(i + 1).padStart(2, '0')}</span>
                <a href={`#${h.id}`} className="hover:text-brand-700 hover:underline">
                  {h.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <GuideBody markdown={guide.body} />

            {/* FAQ */}
            <section className="mt-12" id="faq">
              <h2 className="font-display text-2xl font-extrabold text-ink-950">Frequently asked questions</h2>
              <div className="mt-4 divide-y divide-ink-100 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card">
                {guide.faqs.map((f) => (
                  <details key={f.q} className="group px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[14.5px] font-bold text-ink-950 marker:content-['']">
                      {f.q}
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-50 text-ink-500 transition group-open:rotate-45 group-open:bg-brand-50 group-open:text-brand-600">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                        </svg>
                      </span>
                    </summary>
                    <p className="mt-2.5 text-sm leading-7 text-ink-600">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          {/* sticky rail */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl bg-ink-950 p-5 text-white">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">Get the practice files</p>
              <p className="mt-2 font-display text-lg font-extrabold leading-snug">
                {productCount > 0
                  ? `${productCount} ${guide.category} PDF${productCount === 1 ? '' : 's'} ready to download`
                  : `${guide.category} PDFs — instant download`}
              </p>
              <p className="mt-2 text-[13px] leading-6 text-white/70">
                This guide tells you what to study. The PDFs give you the questions, grids and prompts to actually
                practise it.
              </p>
              <Link
                href={guide.relatedCategory ? `/c/${guide.relatedCategory}` : '/shop'}
                className="btn-gold mt-4 w-full"
              >
                {productCount > 0 ? 'See the PDFs' : 'Browse the shop'}
              </Link>
              <Link href="/shop" className="mt-2 block text-center text-[12.5px] font-bold text-white/60 hover:text-white">
                or view all study material →
              </Link>
            </div>

            <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card">
              <p className="text-[11px] font-bold uppercase tracking-widest text-ink-400">Other free guides</p>
              <ul className="mt-3 space-y-2.5">
                {relatedGuides.map((g) => (
                  <li key={g.slug}>
                    <Link href={`/guides/${g.slug}`} className="block text-[13.5px] font-bold leading-5 text-ink-800 hover:text-brand-700">
                      {g.title.replace(/ — .*/, '')}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-gold-200 bg-gold-50 p-5">
              <p className="font-display text-[15px] font-extrabold text-ink-950">Free GAT sample PDF</p>
              <p className="mt-1.5 text-[13px] leading-6 text-ink-700">
                25 exam-style questions across Quant, English and Reasoning.
              </p>
              <div className="mt-3">
                <Newsletter compact />
              </div>
            </div>
          </aside>
        </div>

        {/* related products */}
        {products.length > 0 && (
          <section className="mt-16 border-t border-ink-100 pt-10">
            <div className="flex items-end justify-between gap-4">
              <h2 className="h-display text-2xl sm:text-3xl">{guide.category} PDFs students are buying</h2>
              <Link href={guide.relatedCategory ? `/c/${guide.relatedCategory}` : '/shop'} className="btn-ghost btn-sm shrink-0">
                See all →
              </Link>
            </div>
            <div className="mt-6">
              <ProductGrid products={products} />
            </div>
          </section>
        )}
      </article>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: guide.title,
              description: guide.description,
              datePublished: guide.updated,
              dateModified: guide.updated,
              author: { '@type': 'Organization', name: 'StudyPalace' },
              publisher: { '@type': 'Organization', name: 'StudyPalace' },
              mainEntityOfPage: abs(canonicalPath || `/guides/${guide.slug}`),
              keywords: guide.keywords.join(', '),
              articleSection: guide.category,
              inLanguage: 'en-IN',
            },
            faqJsonLd(guide.faqs),
            breadcrumbJsonLd([
              { name: 'Home', url: '/' },
              { name: 'Free NIFT guides', url: '/guides' },
              { name: guide.title, url: `/guides/${guide.slug}` },
            ]),
          ]),
        }}
      />
    </>
  );
}

function headingsFrom(body: string): { text: string; id: string }[] {
  const out: { text: string; id: string }[] = [];
  for (const line of body.split('\n')) {
    const m = /^##\s+(.+)$/.exec(line.trim());
    if (!m) continue;
    const text = m[1].replace(/[*`]/g, '').trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    out.push({ text, id });
    if (out.length >= 10) break;
  }
  return out;
}
