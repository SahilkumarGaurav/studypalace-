import Link from 'next/link';
import { config, abs } from '@/lib/config';
import { CATEGORIES } from '@/lib/format';

const GUIDES = [
  { href: '/nift-gat-syllabus-pdf', label: 'NIFT GAT Syllabus 2027 (topic-wise)' },
  { href: '/nift-cat-drawing-practice-pdf', label: 'NIFT CAT Drawing Practice Plan' },
  { href: '/nift-situation-test-material', label: 'Situation Test: model-making guide' },
  { href: '/nift-exam-pattern-marks-weightage', label: 'NIFT Exam Pattern & Weightage' },
  { href: '/guides', label: 'All free guides' },
];

const LEGAL = [
  { href: '/refund-policy', label: 'No-Return / Refund Policy' },
  { href: '/terms', label: 'Terms of Use' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/contact', label: 'Contact & Support' },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-ink-100 bg-white">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-ink-900 text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M12 3 2 8l10 5 8-4v6h2V8L12 3Z" />
                <path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5l-6 3-6-3Z" opacity=".75" />
              </svg>
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight text-ink-950">
              Study<span className="text-brand-600">Palace</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-ink-600">
            Downloadable NIFT preparation PDFs and eBooks — GAT question banks, CAT drawing practice,
            Situation Test model-making guides, current affairs capsules and previous year papers.
            Pay securely, download instantly.
          </p>
          <p className="mt-4 text-sm font-semibold text-ink-800">
            <a className="hover:text-brand-700" href={`mailto:${config.site.supportEmail}`}>
              {config.site.supportEmail}
            </a>
          </p>
          {config.site.supportWhatsapp ? (
            <a
              className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-mint-700 hover:text-mint-800"
              href={`https://wa.me/${config.site.supportWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.7-1.2-4.5-4-4.6-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l1-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.2Z" />
              </svg>
              WhatsApp support
            </a>
          ) : null}
        </div>

        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink-400">Shop by section</h3>
          <ul className="mt-4 space-y-2.5">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/c/${c.slug}`} className="text-sm text-ink-700 hover:text-brand-700">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/shop" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                Browse all PDFs →
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink-400">Free NIFT guides (SEO)</h3>
          <ul className="mt-4 space-y-2.5">
            {GUIDES.map((g) => (
              <li key={g.href}>
                <Link href={g.href} className="text-sm text-ink-700 hover:text-brand-700">
                  {g.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink-400">Help & policies</h3>
          <ul className="mt-4 space-y-2.5">
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-ink-700 hover:text-brand-700">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/my-downloads" className="text-sm text-ink-700 hover:text-brand-700">
                Re-download my PDFs
              </Link>
            </li>
            <li>
              <Link href="/track-order" className="text-sm text-ink-700 hover:text-brand-700">
                Track my order
              </Link>
            </li>
          </ul>

          <div className="mt-6 rounded-2xl border border-ink-100 bg-ink-50/60 p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-ink-400">Payments</p>
            <p className="mt-2 text-sm font-semibold text-ink-800">Razorpay</p>
            <p className="text-xs leading-5 text-ink-600">UPI • Cards • Netbanking • Wallets</p>
          </div>
        </div>
      </div>

      <div className="border-t border-ink-100">
        <div className="container-x flex flex-col gap-2 py-6 text-center text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>
            © {year} {config.site.name}. All rights reserved. Digital products —{' '}
            <Link href="/refund-policy" className="font-semibold text-ink-700 underline decoration-ink-200 hover:text-brand-700">
              no returns, no refunds
            </Link>{' '}
            once the file is downloaded.
          </p>
          <p className="text-ink-400">
            Not affiliated with NIFT. NIFT™ is a trademark of the National Institute of Fashion Technology.
          </p>
        </div>
      </div>

      {/* Structured data: sitelinks searchbox + policy */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            url: abs('/'),
            isPartOf: { '@type': 'WebSite', name: config.site.name, url: abs('/') },
          }),
        }}
      />
    </footer>
  );
}
