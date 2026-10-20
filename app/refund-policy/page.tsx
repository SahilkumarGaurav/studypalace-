import type { Metadata } from 'next';
import Link from 'next/link';
import { abs, config } from '@/lib/config';

export const metadata: Metadata = {
  title: 'No-Return & Refund Policy — Digital Products',
  description:
    'StudyPalace sells downloadable PDF eBooks. Because digital files are delivered instantly and cannot be returned, all sales are final — no returns and no refunds. Read exactly what that means, and the narrow exceptions we do honour.',
  alternates: { canonical: abs('/refund-policy') },
  robots: { index: true, follow: true },
};

const UPDATED = '20 October 2026';

export default function RefundPolicyPage() {
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
          <li className="text-ink-900">Refund &amp; Return Policy</li>
        </ol>
      </nav>

      <header className="max-w-3xl">
        <span className="badge bg-gold-100 text-gold-700">All sales final</span>
        <h1 className="h-display mt-3 text-3xl leading-tight sm:text-4xl">No-Return &amp; Refund Policy</h1>
        <p className="mt-3 text-[15px] leading-7 text-ink-600">Last updated: {UPDATED}</p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Big label="Returns" value="Not available" note="Digital files cannot be sent back." tone="bad" />
        <Big label="Refunds" value="Not available" note="Once delivered, the sale is final." tone="bad" />
        <Big label="Re-downloads" value="Unlimited" note="Your link never expires." tone="good" />
      </div>

      <div className="prose-store mt-10 max-w-3xl">
        <h2>1. Why there are no returns</h2>
        <p>
          Every product sold on {config.site.name} is a <strong>digital file</strong> — a PDF or eBook — delivered to you
          electronically the moment your payment is confirmed. There is no physical item, no packaging and no courier.
        </p>
        <p>
          Under Indian consumer-protection rules for digital goods, and under the terms of our payment processor
          Razorpay, a downloaded digital file cannot be “returned”: once the bytes are on your device they cannot be
          taken back. For that reason{' '}
          <strong>
            all sales on {config.site.name} are final. We do not accept returns and we do not issue refunds
          </strong>{' '}
          once a file has been made available for download.
        </p>

        <h2>2. What this means for you as a buyer</h2>
        <p>
          Because we cannot refund you, we are strict about making sure you know exactly what you are buying
          <em> before</em> you pay. On every product page we list:
        </p>
        <ul>
          <li>the full title and subtitle of the file;</li>
          <li>the page count;</li>
          <li>the NIFT section it covers (GAT, CAT, Situation Test, previous year papers, current affairs);</li>
          <li>the exam year it is written for;</li>
          <li>a bullet list of what is inside; and</li>
          <li>a free sample or preview where one is available.</li>
        </ul>
        <p>
          Please read all of that carefully before paying. At checkout you are also asked to tick a box confirming you
          understand that this is a digital product with no returns. <strong>Your purchase confirms your agreement to
          this policy.</strong>
        </p>

        <h2>3. Grounds on which a refund will NOT be given</h2>
        <ul>
          <li>“I changed my mind” or “I bought the wrong PDF”.</li>
          <li>“I expected a physical book.” These are digital PDFs only — this is stated on every product page.</li>
          <li>“The material was easier/harder than I expected.”</li>
          <li>“I did not get a good rank / did not clear the exam.” No study material can guarantee any outcome.</li>
          <li>“I downloaded it and no longer need it.”</li>
          <li>“I could not open the PDF.” PDFs open in every modern browser and free reader; see section 5 first.</li>
          <li>Any request made more than 24 hours after delivery.</li>
        </ul>

        <h2>4. The narrow exceptions we DO honour</h2>
        <p>We are not in the business of taking money for nothing. We will help you in these specific situations:</p>
        <ul>
          <li>
            <strong>Payment captured but no delivery.</strong> If Razorpay confirms your money was captured and our
            system did not unlock your files, we will deliver the files immediately. If we genuinely cannot, we will
            refund in full. This is a fulfilment failure, not a return.
          </li>
          <li>
            <strong>Corrupt or wrong file.</strong> If the file you receive is damaged, will not open at all, or is
            clearly a different product from the one you paid for, email us <strong>within 24 hours</strong> and we will
            replace it with the correct working file. Replacement, not refund.
          </li>
          <li>
            <strong>Duplicate payment.</strong> If you are charged twice for the same order because of a technical
            error, the duplicate charge is refunded automatically or by us on request.
          </li>
          <li>
            <strong>Legally required refunds.</strong> Where a consumer-protection authority or your bank compels a
            reversal through a chargeback, we will comply — but please note that a chargeback on a delivered digital
            product results in your download access being permanently revoked.
          </li>
        </ul>

        <h2>5. Before you ask for help — quick troubleshooting</h2>
        <ul>
          <li>
            <strong>Can’t find the download?</strong> Go to{' '}
            <Link href="/my-downloads">My Downloads</Link> and enter your order number (it looks like SP-XXXXXX) and the
            email you used at checkout. Your links never expire.
          </li>
          <li>
            <strong>PDF won’t open on a phone?</strong> Open it in Chrome, or save it to Google Drive and open it from
            there. iOS users: use the Files app.
          </li>
          <li>
            <strong>Download button does nothing?</strong> Check your connection, disable any download-blocker
            extension, then press “Retry download”.
          </li>
        </ul>

        <h2>6. How to contact us</h2>
        <p>
          Email <a href={`mailto:${config.site.supportEmail}`}>{config.site.supportEmail}</a> from the address you used
          at checkout and include your order number. We reply within one working day. We cannot act on requests from a
          different email address without proof of purchase.
        </p>

        <h2>7. Sharing and resale</h2>
        <p>
          Your purchase covers <strong>one student, personal use only</strong>. You may print the files for yourself.
          You may not upload them anywhere, share them in Telegram or WhatsApp groups, resell them, or distribute them
          in any form. Files are watermarked with your order details where technically possible, and unauthorised
          distribution will result in permanent revocation of your download access and, where warranted, legal action
          under the Copyright Act, 1957 and the Information Technology Act, 2000.
        </p>

        <h2>8. Changes to this policy</h2>
        <p>
          We may update this policy. The version in force is the one published on this page on the date you buy. Check
          the “Last updated” line above.
        </p>

        <blockquote>
          <strong>Summary:</strong> digital product, instant delivery, no returns, no refunds — except where we failed
          to deliver, sent a broken file, or double-charged you. Read before you buy.
        </blockquote>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/shop" className="btn-primary">
          Browse the PDFs
        </Link>
        <Link href="/terms" className="btn-ghost">
          Terms of Use
        </Link>
        <Link href="/privacy" className="btn-ghost">
          Privacy Policy
        </Link>
        <Link href="/contact" className="btn-ghost">
          Contact support
        </Link>
      </div>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MerchantReturnPolicy',
            applicableCountry: 'IN',
            returnPolicyCategory: 'https://schema.org/MerchantReturnNotSupported',
            url: abs('/refund-policy'),
          }),
        }}
      />
    </div>
  );
}

function Big({ label, value, note, tone }: { label: string; value: string; note: string; tone: 'good' | 'bad' }) {
  return (
    <div
      className={`rounded-3xl border p-5 ${
        tone === 'bad' ? 'border-gold-200 bg-gold-50' : 'border-mint-200 bg-mint-50'
      }`}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest text-ink-500">{label}</p>
      <p
        className={`mt-1.5 font-display text-xl font-extrabold ${
          tone === 'bad' ? 'text-gold-700' : 'text-mint-700'
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-[13px] leading-5 text-ink-700">{note}</p>
    </div>
  );
}
