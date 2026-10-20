import type { Metadata } from 'next';
import Link from 'next/link';
import { abs, config } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'The terms that apply when you buy or download study material from StudyPalace — licence granted, acceptable use, no resale, payments, delivery, disclaimers and governing law.',
  alternates: { canonical: abs('/terms') },
};

const UPDATED = '20 October 2026';

export default function TermsPage() {
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
          <li className="text-ink-900">Terms of Use</li>
        </ol>
      </nav>

      <header className="max-w-3xl">
        <h1 className="h-display text-3xl leading-tight sm:text-4xl">Terms of Use</h1>
        <p className="mt-3 text-[15px] leading-7 text-ink-600">Last updated: {UPDATED}</p>
      </header>

      <div className="prose-store mt-8 max-w-3xl">
        <p>
          These terms govern your use of {config.site.name} ({config.site.url}) and any file you buy or download from
          it. By browsing the site, or by completing a purchase, you agree to them. If you do not agree, do not use the
          site.
        </p>

        <h2>1. Who we are</h2>
        <p>
          {config.site.name} is an independent online store selling downloadable study material for competitive design
          entrance examinations. We are <strong>not affiliated with, endorsed by, or connected to the National Institute
          of Fashion Technology (NIFT)</strong> or to any government body. NIFT™ and related marks are the property of
          their owner and are used here only to describe what the material is for.
        </p>

        <h2>2. What you are buying</h2>
        <p>
          Every product is a <strong>digital file</strong> (PDF, EPUB or ZIP). No physical item is shipped. Prices are in
          Indian Rupees and are inclusive of applicable taxes unless stated otherwise. We may change prices at any time;
          the price you pay is the price shown when you check out.
        </p>

        <h2>3. Licence granted to you</h2>
        <p>
          On successful payment we grant you a personal, non-exclusive, non-transferable, revocable licence to download,
          store, read and print the file <strong>for your own study use</strong>. You do not own the copyright in the
          content.
        </p>

        <h2>4. What you must NOT do</h2>
        <ul>
          <li>Resell, rent, lease or redistribute the file, in whole or in part.</li>
          <li>Upload it to any website, cloud drive with public sharing, Telegram/WhatsApp/Discord group, or file-sharing service.</li>
          <li>Share your download link with anyone else.</li>
          <li>Remove or alter watermarks, order identifiers or copyright notices.</li>
          <li>Claim the material as your own, or use it to build a competing product.</li>
          <li>Use automated tools to scrape the site or bulk-download files.</li>
        </ul>
        <p>
          Breach of this clause results in <strong>immediate permanent revocation of your download access without
          refund</strong>, and may result in legal action under the Copyright Act, 1957 and the Information Technology
          Act, 2000.
        </p>

        <h2>5. Payment</h2>
        <p>
          Payments are processed by <strong>Razorpay</strong>. We never see or store your card number, CVV, netbanking
          password or UPI PIN. By paying you authorise the charge shown at checkout. Failed or abandoned attempts are not
          charged; if your bank has debited you for a failed attempt it is normally auto-reversed within 5–7 working
          days — contact your bank first, then us.
        </p>

        <h2>6. Delivery</h2>
        <p>
          Delivery is electronic and immediate. Your files appear on the confirmation page right after payment, and stay
          available at <Link href="/my-downloads">My Downloads</Link> using your order number and email address. It is
          your responsibility to supply a correct, accessible email address. We are not liable for files not received
          because of a mistyped email address, a full inbox, or a spam filter.
        </p>

        <h2>7. Returns and refunds</h2>
        <p>
          Digital products cannot be returned. <strong>All sales are final and no refunds are issued</strong>, except in
          the narrow cases described in our{' '}
          <Link href="/refund-policy">No-Return &amp; Refund Policy</Link> (payment captured but not delivered, corrupt
          or wrong file within 24 hours, duplicate charge, or a legally compelled reversal).
        </p>

        <h2>8. Accuracy of content</h2>
        <p>
          Our material is prepared in good faith for exam preparation. Examination patterns, syllabi, dates and
          weightages are set by NIFT and change between cycles. <strong>You must verify everything against the official
          NIFT prospectus and website for your admission year.</strong> We do not guarantee any rank, score, shortlist or
          admission, and we are not liable for any outcome of your examination.
        </p>

        <h2>9. Intellectual property</h2>
        <p>
          All content on this site — text, guides, PDFs, layouts, logos, product descriptions and code — is owned by or
          licensed to {config.site.name} and is protected by copyright. The free guides on this site may be quoted with
          attribution and a link back; they may not be republished in full.
        </p>

        <h2>10. Your data</h2>
        <p>
          Our handling of personal data is described in the <Link href="/privacy">Privacy Policy</Link>, which forms part
          of these terms.
        </p>

        <h2>11. Site availability and changes</h2>
        <p>
          We aim for the site to be available at all times but do not guarantee uninterrupted access. We may suspend,
          change or discontinue any part of the service, and may update these terms. The version published on this page
          at the time of your purchase is the one that applies to you.
        </p>

        <h2>12. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, our total liability for any claim relating to your purchase is limited
          to the amount you actually paid us for that order. We are not liable for indirect or consequential loss, lost
          study time, examination outcomes, or loss of data on your device.
        </p>

        <h2>13. Governing law and disputes</h2>
        <p>
          These terms are governed by the laws of India. Courts at our place of operation have exclusive jurisdiction.
          Before any formal proceeding, please email{' '}
          <a href={`mailto:${config.site.supportEmail}`}>{config.site.supportEmail}</a> — most problems are solved in a
          single message.
        </p>

        <h2>14. Contact</h2>
        <p>
          {config.site.name} •{' '}
          <a href={`mailto:${config.site.supportEmail}`}>{config.site.supportEmail}</a>
          {config.site.supportWhatsapp ? ` • WhatsApp +${config.site.supportWhatsapp}` : ''}
        </p>
      </div>
    </div>
  );
}
