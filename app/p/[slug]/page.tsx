import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getProductBySlug,
  listProducts,
  relatedProducts,
  type Product,
} from '@/lib/repo';
import { categoryName, discountPercent, inr, splitList } from '@/lib/format';
import { breadcrumbJsonLd, faqJsonLd, productJsonLd } from '@/lib/seo';
import { abs } from '@/lib/config';
import CoverImage from '@/components/CoverImage';
import ProductGrid from '@/components/ProductGrid';
import { Stars } from '@/components/ProductCard';
import BuyBox from '@/components/BuyBox';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug, true);
  if (!product) return { title: 'Product not found' };

  const title =
    product.seo_title ||
    `${product.title} — ${categoryName(product.category)} PDF for NIFT ${product.year || '2027'} | Instant Download`;
  const description =
    product.seo_description ||
    product.subtitle ||
    (product.description || '').replace(/[#*`>|-]/g, ' ').slice(0, 158) ||
    `Downloadable ${categoryName(product.category)} study material PDF for NIFT preparation. Instant download after payment.`;

  return {
    title,
    description,
    keywords: splitList(product.seo_keywords).length
      ? splitList(product.seo_keywords)
      : [product.title, categoryName(product.category), 'NIFT PDF', 'NIFT preparation', 'NIFT 2027'],
    alternates: { canonical: abs(`/p/${product.slug}`) },
    openGraph: {
      type: 'website',
      url: abs(`/p/${product.slug}`),
      title,
      description,
      images: [{ url: product.cover_url || abs(`/api/cover/${product.slug}.png`), width: 1200, height: 630, alt: product.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [product.cover_url || abs(`/api/cover/${product.slug}.png`)],
    },
    robots: product.is_active
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const related = relatedProducts(product, 4);
  const off = discountPercent(product);
  const free = Number(product.price_paise) === 0;
  const highlights = splitList(product.highlights);
  const tags = splitList(product.tags);

  const faqs = buildFaqs(product, highlights.length);

  return (
    <>
      <div className="container-x pb-28 pt-6 sm:pb-14 sm:pt-10">
        <nav aria-label="Breadcrumb" className="mb-5">
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
            {product.category ? (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href={`/c/${product.category}`} className="hover:text-brand-700">
                    {categoryName(product.category)}
                  </Link>
                </li>
              </>
            ) : null}
            <li aria-hidden="true">/</li>
            <li className="line-clamp-1 text-ink-900">{product.title}</li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-12">
          {/* ---------------- media ---------------- */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative overflow-hidden rounded-4xl border border-ink-100 bg-white shadow-card">
              <CoverImage product={product} className="aspect-[3/4] w-full" sizes="(max-width:1024px) 100vw, 420px" />
              <div className="absolute left-4 top-4 flex flex-col gap-2">
                {off > 0 && !free ? <span className="badge bg-gold-400 text-ink-950 shadow">{off}% OFF</span> : null}
                {free ? <span className="badge bg-mint-500 text-white shadow">FREE</span> : null}
                {product.bestseller ? <span className="badge bg-ink-950 text-white shadow">Bestseller</span> : null}
              </div>
              <div className="absolute bottom-4 left-4 rounded-2xl bg-ink-950/80 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur">
                PDF • instant download
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              <Meta label="Pages" value={product.pages ? String(product.pages) : '—'} />
              <Meta label="Format" value="PDF" />
              <Meta label="Language" value={product.language || 'English'} />
              <Meta label="Exam year" value={product.year || 'NIFT 2027'} />
            </dl>
          </div>

          {/* ---------------- info ---------------- */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-widest">
              {product.category ? (
                <Link href={`/c/${product.category}`} className="badge bg-brand-50 text-brand-700 hover:bg-brand-100">
                  {categoryName(product.category)}
                </Link>
              ) : null}
              {product.course ? <span className="badge bg-ink-50 text-ink-600">{product.course}</span> : null}
              {product.exam ? <span className="badge bg-ink-50 text-ink-600">{product.exam}</span> : null}
            </div>

            <h1 className="h-display mt-3 text-[28px] leading-[1.15] sm:text-[38px]">{product.title}</h1>

            {product.subtitle ? (
              <p className="mt-3 text-[16px] leading-7 text-ink-600">{product.subtitle}</p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="flex items-center gap-1.5 font-bold text-ink-800">
                <Stars value={Number(product.rating || 4.8)} className="h-4 w-4" />
                {Number(product.rating || 4.8).toFixed(1)}
                {product.rating_count ? (
                  <span className="font-semibold text-ink-400">({product.rating_count} reviews)</span>
                ) : (
                  <span className="font-semibold text-ink-400">New</span>
                )}
              </span>
              {product.downloads_count ? (
                <span className="rounded-full bg-ink-50 px-3 py-1 text-[12px] font-bold text-ink-600">
                  {product.downloads_count}+ students downloaded
                </span>
              ) : null}
            </div>

            {/* price + CTA (desktop) */}
            <div className="mt-6 hidden rounded-3xl border border-ink-100 bg-white p-5 shadow-card lg:block">
              <PriceRow product={product} />
              <BuyBox product={product} />
              <ul className="mt-4 grid gap-1.5 text-[13px] font-semibold text-ink-600">
                <li className="flex items-center gap-2">
                  <Tick /> Download link opens immediately after payment
                </li>
                <li className="flex items-center gap-2">
                  <Tick /> Lifetime re-download from My Downloads
                </li>
                <li className="flex items-center gap-2">
                  <Tick /> UPI, cards, netbanking &amp; wallets via Razorpay
                </li>
                <li className="flex items-center gap-2 text-gold-700">
                  <Warn /> Digital file — no returns or refunds
                </li>
              </ul>
            </div>

            {/* highlights */}
            {highlights.length > 0 && (
              <section className="mt-8 rounded-3xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
                <h2 className="font-display text-lg font-extrabold text-ink-950">What’s inside this PDF</h2>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-[14px] leading-6 text-ink-700">
                      <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint-100 text-mint-700">
                        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="4" aria-hidden="true">
                          <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* description */}
            {product.description ? (
              <section className="mt-8">
                <h2 className="font-display text-xl font-extrabold text-ink-950 sm:text-2xl">About this material</h2>
                <div className="prose-store mt-4 whitespace-pre-line">{product.description}</div>
              </section>
            ) : null}

            {/* syllabus cross-links */}
            <section className="mt-8 rounded-3xl border border-brand-100 bg-brand-50/50 p-5 sm:p-6">
              <h2 className="font-display text-base font-extrabold text-ink-950">Read the free syllabus guide first</h2>
              <p className="mt-1.5 text-sm leading-6 text-ink-700">
                Not sure whether this file covers what you need? Our full free guides list every topic NIFT tests.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/nift-gat-syllabus-pdf" className="chip">
                  GAT syllabus (topic-wise)
                </Link>
                <Link href="/nift-cat-drawing-practice-pdf" className="chip">
                  CAT drawing practice plan
                </Link>
                <Link href="/nift-situation-test-material" className="chip">
                  Situation Test guide
                </Link>
                <Link href="/nift-exam-pattern-marks-weightage" className="chip">
                  Exam pattern &amp; weightage
                </Link>
              </div>
            </section>

            {tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Link key={t} href={`/shop?q=${encodeURIComponent(t)}`} className="chip">
                    #{t}
                  </Link>
                ))}
              </div>
            )}

            {/* FAQ */}
            <section className="mt-10">
              <h2 className="font-display text-xl font-extrabold text-ink-950 sm:text-2xl">Questions before you buy</h2>
              <div className="mt-4 divide-y divide-ink-100 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card">
                {faqs.map((f) => (
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
        </div>

        {/* related */}
        <section className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="h-display text-2xl sm:text-3xl">Students also bought</h2>
            <Link href="/shop" className="btn-ghost btn-sm shrink-0">
              All PDFs →
            </Link>
          </div>
          <div className="mt-6">
            <ProductGrid products={related.length ? related : listProducts({ sort: 'popular', limit: 4 })} />
          </div>
        </section>
      </div>

      {/* sticky mobile buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-baseline gap-2">
              <span className="font-display text-xl font-extrabold text-ink-950">
                {free ? 'Free' : inr(Number(product.price_paise))}
              </span>
              {product.mrp_paise && Number(product.mrp_paise) > Number(product.price_paise) ? (
                <span className="text-[12px] font-semibold text-ink-400 line-through">{inr(Number(product.mrp_paise))}</span>
              ) : null}
            </p>
            <p className="truncate text-[11px] font-semibold text-ink-500">
              PDF • instant download • no returns
            </p>
          </div>
          <BuyBox product={product} compact />
        </div>
      </div>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            productJsonLd(product),
            breadcrumbJsonLd([
              { name: 'Home', url: '/' },
              { name: 'Shop', url: '/shop' },
              ...(product.category ? [{ name: categoryName(product.category), url: `/c/${product.category}` }] : []),
              { name: product.title, url: `/p/${product.slug}` },
            ]),
            faqJsonLd(faqs),
          ]),
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */

function PriceRow({ product }: { product: Product }) {
  const off = discountPercent(product);
  const free = Number(product.price_paise) === 0;
  return (
    <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
      <span className={`font-display text-[34px] font-extrabold leading-none ${free ? 'text-mint-600' : 'text-ink-950'}`}>
        {free ? 'Free' : inr(Number(product.price_paise))}
      </span>
      {product.mrp_paise && Number(product.mrp_paise) > Number(product.price_paise) ? (
        <span className="text-base font-semibold text-ink-400 line-through">{inr(Number(product.mrp_paise))}</span>
      ) : null}
      {off > 0 && !free ? <span className="badge bg-gold-100 text-gold-700">You save {off}%</span> : null}
      <span className="ml-auto text-[12px] font-semibold text-ink-500">GST included • one-time payment</span>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white px-3 py-2.5">
      <dt className="text-[10.5px] font-bold uppercase tracking-widest text-ink-400">{label}</dt>
      <dd className="mt-0.5 text-[13.5px] font-extrabold text-ink-900">{value}</dd>
    </div>
  );
}

const Tick = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-mint-600" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Warn = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-gold-600" fill="currentColor" aria-hidden="true">
    <path d="M12 2 1 21h22L12 2Zm1 14h-2v2h2v-2Zm0-7h-2v5h2V9Z" />
  </svg>
);

function buildFaqs(product: Product, hasHighlights: number): { q: string; a: string }[] {
  const price = Number(product.price_paise) === 0 ? 'free' : inr(Number(product.price_paise));
  return [
    {
      q: `How do I download "${product.title}" after paying?`,
      a: `As soon as your Razorpay payment succeeds you are redirected to a download page with a button for this file. The same link is stored permanently under My Downloads — enter your order number and email to reach it again on any device.`,
    },
    {
      q: 'What do I get — a physical book or a file?',
      a: `A downloadable PDF file only. Nothing is shipped. ${hasHighlights ? 'The contents are listed above. ' : ''}Price: ${price}.`,
    },
    {
      q: 'Will this work on my phone?',
      a: 'Yes. It is a standard PDF, so it opens in Chrome, Safari, Google Drive or any PDF reader on a phone, tablet or laptop. You can print it too if you prefer writing on paper.',
    },
    {
      q: 'Can I get a refund if I do not like it?',
      a: 'No. Digital files are delivered instantly and cannot be returned once downloaded, so all sales are final. Please read the description and page count carefully before paying.',
    },
    {
      q: 'Is this updated for NIFT 2027?',
      a: `This file is listed for ${product.year || 'NIFT 2027'} and follows the current GAT / CAT / Situation Test pattern. Always cross-check the official NIFT prospectus for any pattern change in your cycle.`,
    },
  ];
}
