import type { Metadata } from 'next';
import Link from 'next/link';
import { GUIDES } from '@/lib/content';
import { abs } from '@/lib/config';
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Free NIFT 2027 Preparation Guides — GAT, CAT & Situation Test Syllabus',
  description:
    'Free, complete NIFT preparation guides: topic-wise GAT syllabus, CAT drawing practice plan, Situation Test model-making guide, exam pattern and marks weightage, current affairs and fashion GK topic lists, and how to use previous year question papers.',
  keywords: [
    'NIFT 2027 preparation',
    'NIFT syllabus free',
    'NIFT GAT syllabus',
    'NIFT CAT preparation guide',
    'NIFT situation test guide',
    'NIFT exam pattern',
    'NIFT study plan',
    'how to prepare for NIFT',
  ],
  alternates: { canonical: abs('/guides') },
  openGraph: {
    title: 'Free NIFT 2027 Preparation Guides',
    description: 'Complete topic-wise syllabus and study plans for GAT, CAT and the Situation Test — free to read.',
    url: abs('/guides'),
    type: 'website',
  },
};

export default function GuidesIndex() {
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
          <li className="text-ink-900">Free guides</li>
        </ol>
      </nav>

      <header className="max-w-3xl">
        <span className="badge bg-mint-100 text-mint-700">100% free • no signup</span>
        <h1 className="h-display mt-3 text-3xl leading-tight sm:text-4xl">
          Free NIFT 2027 preparation guides
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-ink-600">
          Everything you need to plan your preparation, written out in full: every GAT topic in the right order, the CAT
          drawing practice plan, the Situation Test write-up format, the marks weightage, and the exact current affairs
          and fashion-GK topics NIFT asks about. Read them free — then buy only the practice files you actually need.
        </p>
      </header>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {GUIDES.map((g, i) => (
          <Link
            key={g.slug}
            href={`/guides/${g.slug}`}
            className="group relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-pop"
          >
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest">
              <span className="badge bg-brand-50 text-brand-700">{g.category}</span>
              <span className="text-ink-400">
                {g.readMinutes} min read • updated {new Date(g.updated).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </span>
            </div>
            <h2 className="mt-3 font-display text-xl font-extrabold leading-snug text-ink-950 group-hover:text-brand-700">
              {g.title}
            </h2>
            <p className="mt-2 text-[14px] leading-7 text-ink-600">{g.hero}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-700">
              Read the free guide
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.8" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-50 opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
            {i === 0 ? <span className="sr-only">Most popular guide</span> : null}
          </Link>
        ))}
      </div>

      <section className="mt-12 rounded-4xl bg-ink-950 p-6 text-white sm:p-10">
        <h2 className="h-display text-white text-2xl sm:text-3xl">Now go practise.</h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-white/75">
          Reading a syllabus is 10% of the work. The other 90% is solving questions and drawing compositions. Our PDFs
          are the practice layer — topic-wise, printable, and downloadable the moment you pay.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/shop" className="btn-gold">
            Browse all PDFs
          </Link>
          <Link href="/c/bundles" className="btn border border-white/25 bg-white/10 text-white hover:bg-white/20">
            See the complete bundle
          </Link>
        </div>
      </section>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbJsonLd([
              { name: 'Home', url: '/' },
              { name: 'Free NIFT guides', url: '/guides' },
            ]),
            {
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              itemListElement: GUIDES.map((g, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: abs(`/guides/${g.slug}`),
                name: g.title,
              })),
            },
          ]),
        }}
      />
    </div>
  );
}
