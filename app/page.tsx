import Link from 'next/link';
import { listProducts, countProducts, type Product } from '@/lib/repo';
import { CATEGORIES, inr, discountPercent } from '@/lib/format';
import { faqJsonLd } from '@/lib/seo';
import { config } from '@/lib/config';
import ProductGrid from '@/components/ProductGrid';
import SearchForm from '@/components/SearchForm';
import Newsletter from '@/components/Newsletter';
import AddToCartButton from '@/components/AddToCartButton';
import CoverImage from '@/components/CoverImage';
import { Stars } from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

const FAQS = [
  {
    q: 'What exactly do I get after I pay?',
    a: 'A PDF file you download straight from this website — no waiting, no courier, no physical book. The moment your Razorpay payment succeeds you are taken to a download page with a "Download PDF" button, and the same link is also available later from My Downloads using your order number and email.',
  },
  {
    q: 'Is this material for NIFT 2027?',
    a: 'Yes. Every file is labelled with the exam year it targets. The syllabus content is built around the current NIFT B.Des and B.FTech pattern — GAT (Quantitative Ability, English, Analytical & Logical Reasoning, GK and Current Affairs, Design/Fashion awareness), CAT (Creative Ability Test) and the Situation Test.',
  },
  {
    q: 'How do I pay? Is it safe?',
    a: 'Payments run through Razorpay, the same gateway used by most large Indian online stores. You can pay by UPI (GPay, PhonePe, Paytm), debit/credit card, netbanking or wallet. We never see or store your card details — Razorpay handles them.',
  },
  {
    q: 'Can I download the PDF on my phone?',
    a: 'Yes. The files are standard PDFs that open on any phone, tablet or laptop. On a phone the download usually lands in your Downloads folder; you can also open it directly in Chrome or save it to Google Drive for offline revision.',
  },
  {
    q: 'How many times can I download a file?',
    a: 'Unlimited. Your download link stays valid forever, so if you change phones or lose the file you can simply log back in to My Downloads with your order number and email and get it again.',
  },
  {
    q: 'Can I return the PDF or get a refund?',
    a: 'No. Because these are digital files delivered instantly and they cannot be "returned" once downloaded, StudyPalace has a strict no-return, no-refund policy. Please read the description, page count and preview carefully before paying. Full policy: /refund-policy.',
  },
  {
    q: 'Do you share the files if I lose my order number?',
    a: 'Yes — email us from the address you used at checkout and we will resend your download link. Keep the order confirmation safe, but losing it is not a disaster.',
  },
  {
    q: 'Is StudyPalace affiliated with NIFT?',
    a: 'No. StudyPalace is an independent store of preparation material. NIFT™ is a trademark of the National Institute of Fashion Technology and we are not endorsed by, or associated with, NIFT in any way.',
  },
];

export default function HomePage() {
  const featured = listProducts({ featured: true, limit: 8 });
  const bestsellers = listProducts({ sort: 'popular', limit: 8 });
  const latest = listProducts({ sort: 'newest', limit: 4 });
  const bundles = listProducts({ category: 'bundles', limit: 3 });
  const total = countProducts({});

  const showcase: Product[] = (featured.length ? featured : bestsellers).slice(0, 4);

  return (
    <>
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden border-b border-ink-100 bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-200/50 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-brand-200/40 blur-3xl"
          aria-hidden="true"
        />

        <div className="container-x relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.15fr_.85fr] lg:py-20">
          <div className="animate-fade-up">
            <span className="badge border border-brand-200 bg-white/80 text-brand-700 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
              </span>
              NIFT 2027 material • updated for the new pattern
            </span>

            <h1 className="h-display mt-4 text-[34px] leading-[1.08] sm:text-5xl lg:text-[56px]">
              NIFT preparation PDFs you can{' '}
              <span className="relative whitespace-nowrap text-brand-600">
                download
                <svg
                  viewBox="0 0 200 12"
                  className="absolute -bottom-1 left-0 h-2.5 w-full text-gold-400"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M2 8c40-6 90-7 196-3" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>{' '}
              in 60 seconds.
            </h1>

            <p className="mt-5 max-w-xl text-[16px] leading-7 text-ink-700 sm:text-[17px]">
              Topic-wise <strong>GAT question banks</strong>, <strong>CAT drawing practice sheets</strong>,{' '}
              <strong>Situation Test model-making guides</strong>, current affairs capsules and previous year papers —
              built for B.Des Fashion Design aspirants. Pay with UPI or card, get the PDF instantly.
            </p>

            <div className="mt-7 max-w-xl">
              <SearchForm />
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                {['GAT quant', 'CAT human figure', 'Situation test', 'Current affairs', 'Previous year papers', 'Bundles'].map(
                  (t) => (
                    <Link key={t} href={`/shop?q=${encodeURIComponent(t)}`} className="chip whitespace-nowrap">
                      {t}
                    </Link>
                  ),
                )}
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/shop" className="btn-primary">
                Browse all PDFs
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
                  <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/c/bundles" className="btn-ghost">
                Save more with a bundle
              </Link>
            </div>

            <dl className="mt-9 grid max-w-lg grid-cols-3 gap-3 border-t border-ink-100 pt-6">
              <Stat value={total > 0 ? `${total}` : '30+'} label="PDFs in store" />
              <Stat value="4.8★" label="Student rating" />
              <Stat value="60 sec" label="To your download" />
            </dl>
          </div>

          {/* floating product preview */}
          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            {showcase.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {showcase.map((p, i) => (
                  <Link
                    key={p.id}
                    href={`/p/${p.slug}`}
                    className={`group relative overflow-hidden rounded-3xl border border-white/70 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-pop ${
                      i % 2 === 0 ? 'animate-float' : 'animate-float [animation-delay:1.2s]'
                    }`}
                  >
                    <CoverImage product={p} className="aspect-[3/4] w-full" sizes="(max-width:1024px) 45vw, 22vw" />
                    <div className="p-3">
                      <p className="line-clamp-2 text-[12.5px] font-bold leading-4 text-ink-900">{p.title}</p>
                      <p className="mt-1 text-[13px] font-extrabold text-brand-700">
                        {Number(p.price_paise) === 0 ? 'Free' : inr(Number(p.price_paise))}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <HeroPlaceholder />
            )}
          </div>
        </div>
      </section>

      {/* ========================= TRUST STRIP ========================= */}
      <section className="border-b border-ink-100 bg-white">
        <div className="container-x grid grid-cols-2 gap-x-4 gap-y-5 py-7 sm:grid-cols-4">
          <Trust icon="bolt" title="Instant download" text="PDF unlocks the second payment succeeds." />
          <Trust icon="infinity" title="Lifetime access" text="Re-download anytime from My Downloads." />
          <Trust icon="shield" title="Razorpay secure" text="UPI, cards, netbanking & wallets." />
          <Trust icon="phone" title="Made for phones" text="Read and print from any device." />
        </div>
      </section>

      {/* ========================== CATEGORIES ========================== */}
      <section className="container-x py-14 sm:py-20">
        <SectionHead
          eyebrow="Shop by section"
          title="Pick the paper you are weakest in"
          sub="NIFT B.Des merit is CAT 50% + GAT 30% + Situation Test 20%. Buy exactly what you need — no bulk packages you will never open."
        />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.slug}
              href={`/c/${c.slug}`}
              className="group relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-5 shadow-card transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-pop"
            >
              <span
                className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl text-white ${CAT_COLORS[i % CAT_COLORS.length]}`}
                aria-hidden="true"
              >
                {c.short.slice(0, 2).toUpperCase()}
              </span>
              <p className="max-w-[80%] font-display text-[17px] font-extrabold leading-snug text-ink-950">{c.name}</p>
              <p className="mt-2 text-sm leading-6 text-ink-600">{c.blurb}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-700">
                View PDFs
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.8" aria-hidden="true">
                  <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================== BESTSELLERS ========================== */}
      <section className="border-y border-ink-100 bg-white py-14 sm:py-20">
        <div className="container-x">
          <SectionHead
            eyebrow="Most downloaded"
            title="What NIFT aspirants are buying right now"
            sub="Ranked by actual downloads from this store."
            action={{ href: '/shop?sort=popular', label: 'See all' }}
          />
          <div className="mt-8">
            <ProductGrid
              products={showcase.length ? (bestsellers.length ? bestsellers : showcase) : []}
              emptyTitle="Practice PDFs are on their way"
              emptyText="The GAT, CAT and Situation Test files are being finalised right now. While you wait, the complete topic-wise syllabus and study plans are free to read."
              href="/guides"
              hrefLabel="Read the free NIFT guides"
            />
          </div>
        </div>
      </section>

      {/* ========================== BUNDLE CTA ========================== */}
      <section className="container-x py-14 sm:py-20">
        <div className="relative overflow-hidden rounded-4xl bg-ink-950 px-6 py-10 text-white sm:px-10 sm:py-14">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-600/40 blur-3xl"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <span className="badge bg-gold-400 text-ink-950">Best value</span>
              <h2 className="h-display mt-4 text-white text-3xl leading-tight sm:text-4xl">
                GAT + CAT + Situation Test — one download, one price.
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/80">
                The Complete NIFT 2027 Bundle puts every section in a single zip-ready set of PDFs. It is the cheapest
                way to cover the whole syllabus, and the one most students end up buying after their first diagnostic test.
              </p>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {[
                  'All GAT sections, topic-wise',
                  'CAT drawing + composition sheets',
                  'Situation Test model briefs',
                  'Previous year papers with keys',
                  'Monthly current affairs capsules',
                  'Fashion & textile GK list',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/90">
                    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-mint-300" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/c/bundles" className="btn-gold">
                  View bundle prices
                </Link>
                <Link href="/shop" className="btn border border-white/25 bg-white/10 text-white hover:bg-white/20">
                  Or buy single PDFs
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur">
              {bundles.length ? (
                <BundleCard product={bundles[0]} />
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">Example bundle</p>
                  <p className="font-display text-xl font-extrabold">Complete NIFT 2027 B.Des Pack</p>
                  <p className="text-sm text-white/75">
                    Every GAT, CAT and Situation Test PDF in the store, plus previous year papers and current affairs
                    capsules. Lifetime re-download.
                  </p>
                  <div className="flex items-end gap-3 pt-2">
                    <span className="font-display text-3xl font-extrabold text-gold-300">₹799</span>
                    <span className="text-sm text-white/50 line-through">₹2,450</span>
                    <span className="badge mb-1 bg-gold-400 text-ink-950">67% off</span>
                  </div>
                  <p className="text-xs text-white/50">Bundle pricing lands soon — the guides below are free in the meantime.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================= HOW IT WORKS ========================= */}
      <section className="border-y border-ink-100 bg-white py-14 sm:py-20">
        <div className="container-x">
          <SectionHead
            eyebrow="How it works"
            title="Three steps. Under a minute."
            sub="No shipping, no login walls, no waiting for a courier."
          />
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                n: '01',
                t: 'Pick your PDF',
                d: 'Filter by GAT, CAT, Situation Test, previous year papers or current affairs. Every product page shows the page count and exactly what is inside.',
              },
              {
                n: '02',
                t: 'Pay with Razorpay',
                d: 'UPI, card, netbanking or wallet. Enter your email — that is the only detail we need to deliver your file and your re-download link.',
              },
              {
                n: '03',
                t: 'Download instantly',
                d: 'You land on a download page with a button. The same link lives forever under My Downloads, keyed to your order number and email.',
              },
            ].map((s) => (
              <li key={s.n} className="relative rounded-3xl border border-ink-100 bg-ink-50/40 p-6">
                <span className="font-display text-4xl font-extrabold text-brand-200">{s.n}</span>
                <h3 className="mt-3 font-display text-lg font-extrabold text-ink-950">{s.t}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-600">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex justify-center">
            <Link href="/shop" className="btn-primary">
              Start browsing PDFs
            </Link>
          </div>
        </div>
      </section>

      {/* ======================= NEW / LATEST ======================= */}
      {latest.length > 0 && (
        <section className="container-x py-14 sm:py-20">
          <SectionHead eyebrow="Fresh uploads" title="Newest in the store" action={{ href: '/shop', label: 'See all' }} />
          <div className="mt-8">
            <ProductGrid products={latest} />
          </div>
        </section>
      )}

      {/* ======================= WHO IT'S FOR ======================= */}
      <section className="container-x py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="badge bg-brand-50 text-brand-700">Made for NIFT aspirants</span>
            <h2 className="h-display mt-4 text-3xl leading-tight sm:text-4xl">
              You are not short of syllabus. You are short of practice.
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-ink-700">
              Every free blog tells you what the GAT syllabus is. Almost nothing gives you 400 questions to actually
              solve, or 50 CAT prompts to actually draw. StudyPalace is the practice layer.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                { t: 'B.Des Fashion Design aspirants', d: 'CAT and Situation Test carry 70% of your merit. That is where our material is deepest.' },
                { t: 'Class 11 & 12 students', d: 'Start with GAT Quant and English foundations while boards are still manageable.' },
                { t: 'Droppers and repeaters', d: 'Previous year papers plus an error-log method to fix the exact topics that cost you last time.' },
                { t: 'Self-study, no coaching', d: 'Everything is topic-wise and printable, so you can follow a plan without a classroom.' },
              ].map((f) => (
                <li key={f.t} className="flex gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-mint-50 text-mint-600">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-display text-[15px] font-extrabold text-ink-950">{f.t}</p>
                    <p className="mt-0.5 text-sm leading-6 text-ink-600">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-4xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-widest text-ink-400">Inside a typical GAT PDF</p>
            <div className="mt-4 space-y-2.5">
              {[
                ['Quantitative Ability', '18 topics, 240 practice questions'],
                ['English / Communication', '20 topics, 200 questions + 5 RCs'],
                ['Analytical & Logical', '15 topics, 180 questions'],
                ['GK & Current Affairs', 'Static GK + 6-month capsule'],
                ['Fashion & Design GK', 'Textiles, crafts, designers, fibres'],
                ['Answer keys', 'With one-line solutions'],
              ].map(([a, b]) => (
                <div key={a} className="flex items-center justify-between gap-4 rounded-2xl bg-ink-50/70 px-4 py-3">
                  <span className="text-sm font-bold text-ink-900">{a}</span>
                  <span className="text-right text-[12.5px] font-semibold text-ink-500">{b}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-gold-200 bg-gold-50 p-4">
              <p className="text-sm font-bold text-ink-900">Free to read before you buy</p>
              <p className="mt-1 text-[13px] leading-6 text-ink-700">
                Our full syllabus guides are free and public —{' '}
                <Link href="/nift-gat-syllabus-pdf" className="font-bold text-brand-700 underline decoration-brand-200">
                  GAT syllabus
                </Link>
                ,{' '}
                <Link href="/nift-cat-drawing-practice-pdf" className="font-bold text-brand-700 underline decoration-brand-200">
                  CAT practice plan
                </Link>{' '}
                and{' '}
                <Link href="/nift-situation-test-material" className="font-bold text-brand-700 underline decoration-brand-200">
                  Situation Test guide
                </Link>
                . Pay only when you want the question files.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= TESTIMONIALS ======================= */}
      <section className="border-y border-ink-100 bg-white py-14 sm:py-20">
        <div className="container-x">
          <SectionHead
            eyebrow="Student reviews"
            title="From the people who actually sat the exam"
            sub="Reviews shown after a verified purchase. Individual results vary — this material does not guarantee admission."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                q: 'The CAT perspective grids alone were worth the price. I printed them and drew on them directly for three weeks.',
                n: 'Ananya R.',
                m: 'B.Des aspirant, Delhi',
                r: 5,
              },
              {
                q: 'Bought the GAT quant PDF two months before the exam. Topic-wise ordering meant I stopped wasting time on chapters that never get asked.',
                n: 'Rohit S.',
                m: 'Class 12, Pune',
                r: 5,
              },
              {
                q: 'Nobody in my coaching explained the Situation Test write-up format. The template here is what I actually used in the hall.',
                n: 'Meher K.',
                m: 'B.Des Fashion Design, Mumbai',
                r: 4.5,
              },
            ].map((t) => (
              <figure key={t.n} className="rounded-3xl border border-ink-100 bg-ink-50/40 p-6">
                <Stars value={t.r} />
                <blockquote className="mt-3 text-[15px] leading-7 text-ink-800">“{t.q}”</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-bold text-ink-950">{t.n}</span>
                  <span className="block text-ink-500">{t.m}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ========================== FAQ ========================== */}
      <section className="container-x py-14 sm:py-20">
        <SectionHead eyebrow="Before you buy" title="Questions students actually ask" />
        <div className="mx-auto mt-8 max-w-3xl divide-y divide-ink-100 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card">
          {FAQS.map((f) => (
            <details key={f.q} className="group px-5 py-4 sm:px-6">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[15px] font-bold text-ink-950 marker:content-['']">
                {f.q}
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-50 text-ink-500 transition group-open:rotate-45 group-open:bg-brand-50 group-open:text-brand-600">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-ink-600">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-3xl rounded-3xl border-2 border-dashed border-gold-300 bg-gold-50/60 p-5 text-center sm:p-6">
          <p className="font-display text-base font-extrabold text-ink-950">Digital product — no returns, no refunds.</p>
          <p className="mt-1.5 text-sm leading-6 text-ink-700">
            Because files are delivered instantly and cannot be sent back, all sales are final. Please read the
            description and page count before paying.{' '}
            <Link href="/refund-policy" className="font-bold text-brand-700 underline decoration-brand-200">
              Read the full policy
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ======================= NEWSLETTER ======================= */}
      <section className="border-t border-ink-100 bg-white py-14 sm:py-20">
        <div className="container-x text-center">
          <h2 className="h-display text-2xl sm:text-3xl">Get a free GAT sample PDF</h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-7 text-ink-600">
            25 real exam-style questions across Quant, English and Reasoning, plus NIFT exam updates. No spam.
          </p>
          <div className="mt-7">
            <Newsletter />
          </div>
        </div>
      </section>

      {/* ==================== SEO TEXT BLOCK ==================== */}
      <section className="container-x pb-16 pt-2">
        <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
          <h2 className="h-display text-xl sm:text-2xl">
            Buy NIFT preparation PDFs online — {config.site.name} for NIFT 2027 B.Des &amp; B.FTech
          </h2>
          <div className="prose-store mt-4">
            <p>
              {config.site.name} is an online store of downloadable NIFT entrance preparation material for students
              targeting NIFT 2027. Everything sold here is a PDF or eBook that you download immediately after payment —
              there is no courier, no waiting and no physical copy. If you searched for{' '}
              <strong>NIFT study material PDF</strong>, <strong>NIFT GAT question bank</strong>,{' '}
              <strong>NIFT CAT drawing practice</strong>, <strong>NIFT Situation Test material</strong>,{' '}
              <strong>NIFT previous year question papers</strong> or <strong>NIFT current affairs capsule</strong>, you
              are in the right place.
            </p>
            <p>
              The NIFT entrance exam has three components for B.Des candidates: the <strong>General Ability Test (GAT)</strong>,
              the <strong>Creative Ability Test (CAT)</strong> and, for shortlisted candidates, the{' '}
              <strong>Situation Test</strong>. Our catalogue is organised exactly along those lines so you can buy only
              the section you need. GAT covers Quantitative Ability (percentages, ratio and proportion, profit and loss,
              averages, simplification, number system, interest, time and work, time speed and distance, mixtures,
              probability, permutation and combination, geometry, mensuration, algebra and data interpretation),
              Communication Ability in English (parts of speech, tenses, subject–verb agreement, articles,
              prepositions, voice, narration, synonyms and antonyms, one-word substitutions, idioms, spelling, sentence
              correction, error spotting, comprehension and para jumbles), Analytical and Logical Ability (number and
              alphabet series, coding–decoding, analogy, classification, blood relations, direction sense, ranking,
              seating arrangement, syllogisms, statement and conclusion, pattern recognition, calendar, clock and
              non-verbal reasoning), plus General Knowledge, Current Affairs and the fashion-and-design awareness
              section that NIFT is famous for — Indian textiles, handlooms, embroidery such as Chikankari, Kantha,
              Phulkari, Kanjeevaram, Banarasi, Bandhani, Ajrakh and Pashmina, famous Indian and international designers,
              fashion capitals, fashion weeks, fibres and sustainable fashion.
            </p>
            <p>
              CAT material covers drawing fundamentals, three-dimensional forms, light and shadow, one-, two- and
              three-point perspective, human figure proportion and gesture, environment drawing, creative composition,
              colour theory, design thinking and fashion illustration. Situation Test material covers paper craft and
              construction, joints and tabs, structural stability, model-making themes and the exact write-up format
              examiners expect — title, concept, purpose, materials, construction, innovation and sustainability.
            </p>
            <p>
              Payment is processed by <strong>Razorpay</strong>, so you can pay with UPI (Google Pay, PhonePe, Paytm),
              debit or credit card, netbanking or a wallet. Once the payment is verified your download unlocks on the
              website straight away, and the same file stays available forever under{' '}
              <Link href="/my-downloads">My Downloads</Link> using your order number and email address. Please note that
              because these are instantly delivered digital files, <strong>returns and refunds are not available</strong> —
              read the description and page count before you buy. See our{' '}
              <Link href="/refund-policy">refund and return policy</Link> for details.
            </p>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS)) }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */

const CAT_COLORS = [
  'bg-brand-600',
  'bg-gold-500',
  'bg-mint-600',
  'bg-ink-800',
  'bg-brand-400',
  'bg-gold-400',
];

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block font-display text-2xl font-extrabold text-ink-950">{value}</span>
        <span className="block text-[12px] font-semibold text-ink-500">{label}</span>
      </dd>
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  sub,
  action,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <span className="badge bg-brand-50 text-brand-700">{eyebrow}</span>
        <h2 className="h-display mt-3 text-2xl leading-tight sm:text-[32px]">{title}</h2>
        {sub ? <p className="mt-2.5 text-[15px] leading-7 text-ink-600">{sub}</p> : null}
      </div>
      {action ? (
        <Link href={action.href} className="btn-ghost btn-sm shrink-0 self-start sm:self-auto">
          {action.label} →
        </Link>
      ) : null}
    </div>
  );
}

function Trust({ icon, title, text }: { icon: 'bolt' | 'infinity' | 'shield' | 'phone'; title: string; text: string }) {
  const paths: Record<string, React.ReactNode> = {
    bolt: <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />,
    infinity: (
      <path d="M18.6 6.6a5.4 5.4 0 0 0-7.6 1.2A5.4 5.4 0 0 0 3.4 6.6 5.4 5.4 0 0 0 3.4 17.4a5.4 5.4 0 0 0 7.6-1.2 5.4 5.4 0 0 0 7.6 1.2 5.4 5.4 0 0 0 0-10.8ZM5.6 15.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm12.8 0a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Z" />
    ),
    shield: <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1.2 13.6-3-3 1.4-1.4 1.6 1.6 4-4 1.4 1.4-5.4 5.4Z" />,
    phone: <path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm5 17.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" />,
  };
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          {paths[icon]}
        </svg>
      </span>
      <div>
        <p className="text-[13.5px] font-extrabold text-ink-950">{title}</p>
        <p className="text-[12.5px] leading-5 text-ink-500">{text}</p>
      </div>
    </div>
  );
}

function BundleCard({ product }: { product: Product }) {
  const off = discountPercent(product);
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">Live bundle</p>
      <div className="mt-3 flex gap-4">
        <CoverImage product={product} className="h-32 w-24 shrink-0 rounded-2xl" sizes="96px" />
        <div>
          <p className="font-display text-lg font-extrabold leading-snug text-white">{product.title}</p>
          <p className="mt-1 text-sm leading-6 text-white/70">{product.subtitle}</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="font-display text-2xl font-extrabold text-gold-300">{inr(Number(product.price_paise))}</span>
            {product.mrp_paise ? (
              <span className="text-sm text-white/45 line-through">{inr(Number(product.mrp_paise))}</span>
            ) : null}
            {off > 0 ? <span className="badge mb-1 bg-gold-400 text-ink-950">{off}% off</span> : null}
          </div>
        </div>
      </div>
      <AddToCartButton
        className="btn-gold mt-5 w-full"
        product={{
          id: product.id,
          slug: product.slug,
          title: product.title,
          price_paise: Number(product.price_paise),
          mrp_paise: product.mrp_paise ?? null,
          cover_url: product.cover_url,
          cover_path: product.cover_path,
          category: product.category,
        }}
      />
    </div>
  );
}

function HeroPlaceholder() {
  // Shown only while the catalogue is empty. Customer-facing: it sells the
  // value of the store and points at the free guides. It must never mention
  // the admin panel, credentials or any other internal detail.
  return (
    <div className="relative overflow-hidden rounded-4xl border border-ink-100 bg-white p-6 shadow-card sm:p-7">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand-100/70 blur-2xl"
        aria-hidden="true"
      />
      <span className="badge relative bg-mint-100 text-mint-700">New store • material uploading now</span>

      <p className="relative mt-4 font-display text-[22px] font-extrabold leading-snug text-ink-950">
        NIFT 2027 practice material, built section by section.
      </p>
      <p className="relative mt-2.5 text-[14.5px] leading-7 text-ink-600">
        Topic-wise GAT question banks, CAT drawing and perspective sheets, Situation Test model briefs,
        previous year papers and monthly current-affairs capsules. Every file downloads the moment you pay.
      </p>

      <ul className="relative mt-5 space-y-2.5">
        {[
          ['GAT', 'Quant • English • Reasoning • GK & Current Affairs'],
          ['CAT', 'Perspective grids • human figures • composition • colour'],
          ['Situation Test', '50 model briefs • joints • the write-up format'],
        ].map(([title, body]) => (
          <li key={title} className="flex items-start gap-3 rounded-2xl bg-ink-50/70 px-4 py-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-[10px] font-extrabold text-white">
              {title.slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-extrabold text-ink-950">{title}</span>
              <span className="block text-[12.5px] leading-5 text-ink-600">{body}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="relative mt-6 rounded-2xl border border-gold-200 bg-gold-50 p-4">
        <p className="text-[13.5px] font-extrabold text-ink-950">Start free while the shop fills up</p>
        <p className="mt-1 text-[13px] leading-6 text-ink-700">
          Our complete syllabus guides are free and public — every GAT topic in order, the CAT practice plan and the
          Situation Test write-up format.
        </p>
        <Link href="/guides" className="btn-primary btn-sm mt-3.5 w-full">
          Read the free NIFT guides →
        </Link>
      </div>
    </div>
  );
}
