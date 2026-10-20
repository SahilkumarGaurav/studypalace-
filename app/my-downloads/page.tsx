import type { Metadata } from 'next';
import Link from 'next/link';
import { abs, config } from '@/lib/config';
import DownloadsLookup from '@/components/DownloadsLookup';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Downloads — Re-download Your NIFT PDFs Anytime',
  description:
    'Lost your StudyPalace download link? Enter your order number and the email you used at checkout to re-download every NIFT preparation PDF you bought. Links never expire.',
  alternates: { canonical: abs('/my-downloads') },
};

export default function MyDownloadsPage() {
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
          <li className="text-ink-900">My Downloads</li>
        </ol>
      </nav>

      <header className="mx-auto mb-8 max-w-2xl text-center">
        <span className="badge bg-brand-50 text-brand-700">Lifetime access</span>
        <h1 className="h-display mt-3 text-3xl leading-tight sm:text-4xl">
          Re-download everything you have bought
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-ink-600">
          New phone? Lost the file? No problem. Your download links never expire — enter the email address you used at
          checkout and we will list every PDF you own.
        </p>
      </header>

      <DownloadsLookup />

      <section className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <h2 className="font-display text-[15px] font-extrabold text-ink-950">No order number?</h2>
          <p className="mt-1.5 text-[13px] leading-6 text-ink-600">
            Just the email is enough. We will list every paid order on that address.
          </p>
        </div>
        <div className="card p-5">
          <h2 className="font-display text-[15px] font-extrabold text-ink-950">PDF won’t open?</h2>
          <p className="mt-1.5 text-[13px] leading-6 text-ink-600">
            Try Chrome’s built-in reader or Google Drive. If the file is corrupted, email us within 24 hours and we will
            resend it.
          </p>
        </div>
        <div className="card p-5">
          <h2 className="font-display text-[15px] font-extrabold text-ink-950">Still stuck?</h2>
          <p className="mt-1.5 text-[13px] leading-6 text-ink-600">
            Email{' '}
            <a className="font-bold text-brand-700 underline decoration-brand-200" href={`mailto:${config.site.supportEmail}`}>
              {config.site.supportEmail}
            </a>{' '}
            from the address you paid with and we will sort it the same day.
          </p>
        </div>
      </section>
    </div>
  );
}
