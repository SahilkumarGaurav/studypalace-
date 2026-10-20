import type { Metadata } from 'next';
import Link from 'next/link';
import { abs, config } from '@/lib/config';
import { faqJsonLd } from '@/lib/seo';
import ContactForm from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact & Support — Lost Download Link? We Resend It Same Day',
  description:
    'Contact StudyPalace support. Lost your download link, paid but received nothing, or found a broken PDF? Email us with your order number and we will fix it the same working day.',
  alternates: { canonical: abs('/contact') },
};

const FAQS = [
  {
    q: 'I paid but did not get my PDF. What do I do?',
    a: 'Wait two minutes, then open My Downloads and enter your order number (SP-XXXXXX) and the email you paid with. If it still shows unpaid, email us with the order number and your UPI/bank reference — we confirm the payment in the Razorpay dashboard and unlock your files the same working day.',
  },
  {
    q: 'I lost my order number.',
    a: 'No problem. My Downloads works with just your email address — it lists every paid order on that address.',
  },
  {
    q: 'Can I get a refund?',
    a: 'No. These are instantly delivered digital files, so all sales are final. We do replace files that are corrupt or wrong, and we do refund duplicate charges or payments we failed to deliver against.',
  },
  {
    q: 'Do you make custom material or doubt-solving?',
    a: 'We sell prepared PDFs only. We cannot review your drawings or answer subject doubts by email — the free guides cover the syllabus and study plans.',
  },
];

export default function ContactPage() {
  return (
    <div className="container-x py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1.5 text-[12.5px] font-semibold text-ink-500">
          <li>
            <Link href="/" className="hover:text-brand-700">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-900">Contact</li>
        </ol>
      </nav>

      <header className="max-w-3xl">
        <h1 className="h-display text-3xl leading-tight sm:text-4xl">Contact &amp; support</h1>
        <p className="mt-3 text-[15px] leading-7 text-ink-600">
          One person reads these messages — the person who made the material. Include your{' '}
          <strong>order number</strong> and the <strong>email you paid with</strong> and you will get a reply the same
          working day.
        </p>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="card p-5 sm:p-7">
          <h2 className="font-display text-xl font-extrabold text-ink-950">Send a message</h2>
          <p className="mt-1 text-sm text-ink-600">
            This opens a pre-filled email to {config.site.supportEmail} so you always have a copy of what you sent.
          </p>
          <ContactForm supportEmail={config.site.supportEmail} />
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-ink-400">Fastest route</p>
            <a
              href={`mailto:${config.site.supportEmail}?subject=Order%20SP-XXXXXX%20—%20download%20help`}
              className="mt-2 block font-display text-lg font-extrabold break-all text-brand-700 hover:underline"
            >
              {config.site.supportEmail}
            </a>
            {config.site.supportWhatsapp ? (
              <a
                href={`https://wa.me/${config.site.supportWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost btn-sm mt-4 w-full"
              >
                WhatsApp us
              </a>
            ) : null}
          </div>

          <div className="card p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-ink-400">Self-serve first</p>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <Link href="/my-downloads" className="font-bold text-brand-700 hover:underline">
                  My Downloads →
                </Link>{' '}
                <span className="text-ink-600">re-download anything you have bought</span>
              </li>
              <li>
                <Link href="/refund-policy" className="font-bold text-brand-700 hover:underline">
                  Refund policy →
                </Link>{' '}
                <span className="text-ink-600">what we can and cannot do</span>
              </li>
              <li>
                <Link href="/guides" className="font-bold text-brand-700 hover:underline">
                  Free guides →
                </Link>{' '}
                <span className="text-ink-600">full syllabus and study plans</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-gold-200 bg-gold-50 p-5">
            <p className="font-display text-[15px] font-extrabold text-ink-950">Please include</p>
            <ul className="mt-2 space-y-1.5 text-[13px] leading-6 text-ink-700">
              <li>• Your order number (SP-XXXXXX)</li>
              <li>• The email you paid with</li>
              <li>• Payment reference, if money was deducted</li>
              <li>• Your device and browser, if a download failed</li>
            </ul>
          </div>
        </aside>
      </div>

      <section className="mt-12">
        <h2 className="h-display text-2xl sm:text-3xl">Common support questions</h2>
        <div className="mt-5 grid max-w-4xl gap-3 sm:grid-cols-2">
          {FAQS.map((f) => (
            <div key={f.q} className="card p-5">
              <h3 className="font-display text-[15px] font-extrabold text-ink-950">{f.q}</h3>
              <p className="mt-2 text-[13.5px] leading-6 text-ink-600">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS)) }}
      />
    </div>
  );
}
