import type { Metadata } from 'next';
import Link from 'next/link';
import { abs, config } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'What StudyPalace collects when you buy a PDF (name, email, phone, order and payment reference), why we collect it, how long we keep it, and your rights under India’s DPDP Act 2023.',
  alternates: { canonical: abs('/privacy') },
};

const UPDATED = '20 October 2026';

export default function PrivacyPage() {
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
          <li className="text-ink-900">Privacy Policy</li>
        </ol>
      </nav>

      <header className="max-w-3xl">
        <h1 className="h-display text-3xl leading-tight sm:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-[15px] leading-7 text-ink-600">Last updated: {UPDATED}</p>
      </header>

      <div className="prose-store mt-8 max-w-3xl">
        <p>
          We keep this as short and plain as we can. {config.site.name} sells downloadable study material. To deliver a
          file to you and to let you re-download it later, we need a small amount of information. We collect the minimum
          that makes that work, and nothing else.
        </p>

        <h2>1. What we collect</h2>
        <ul>
          <li>
            <strong>You give us:</strong> email address (required), name (optional), mobile number (optional, requested
            by Razorpay for UPI), and any message you send to support.
          </li>
          <li>
            <strong>Created when you buy:</strong> order number, items bought, amounts, coupon used, a payment reference
            from Razorpay, and a private download token.
          </li>
          <li>
            <strong>Collected automatically:</strong> IP address and browser user-agent at checkout (for fraud
            prevention), and basic anonymous analytics if we have enabled them.
          </li>
          <li>
            <strong>Newsletter:</strong> only your email address, if you subscribe.
          </li>
        </ul>

        <h2>2. What we do NOT collect</h2>
        <p>
          We never see or store your card number, CVV, expiry date, netbanking password or UPI PIN. Those are entered
          directly into Razorpay’s own secure checkout and are governed by Razorpay’s privacy policy.
        </p>

        <h2>3. Why we use it</h2>
        <ul>
          <li>To deliver the file you paid for and keep your download link working permanently.</li>
          <li>To verify that a payment was genuinely captured before unlocking a file.</li>
          <li>To answer support emails and resend lost links.</li>
          <li>To detect fraud and abuse (for example, one link being downloaded from hundreds of IPs).</li>
          <li>To send you the free sample or updates you subscribed to — and nothing else, unless you buy again.</li>
          <li>To understand which material students actually want, so we make better PDFs.</li>
        </ul>

        <h2>4. Cookies</h2>
        <p>
          We use a small number of strictly necessary cookies: one to remember your basket on this device, and one
          secure session cookie to keep the shop owner signed in to the admin panel. If analytics are enabled we use the
          provider’s cookies. You can block cookies in your browser; the basket will simply not persist between visits.
        </p>

        <h2>5. Who we share it with</h2>
        <ul>
          <li>
            <strong>Razorpay</strong> — payment processing. They receive your name, email, phone, order amount and
            reference.
          </li>
          <li>
            <strong>Our hosting provider</strong> — the servers this site runs on, which store the database and your
            files.
          </li>
          <li>
            <strong>An analytics provider</strong> — only if enabled, and only aggregated page-view data.
          </li>
          <li>
            <strong>Nobody else.</strong> We do not sell, rent or trade your personal data. Ever.
          </li>
        </ul>
        <p>
          We may disclose data if required by law, a court order, or to prevent fraud or harm.
        </p>

        <h2>6. How long we keep it</h2>
        <p>
          Order records are kept for as long as we operate the store, because they are your proof of purchase and the
          key to your permanent re-download link, and because accounting and tax records must be retained under Indian
          law (generally 8 years). Newsletter addresses are kept until you unsubscribe. Failed and abandoned orders are
          pruned periodically.
        </p>

        <h2>7. How we protect it</h2>
        <ul>
          <li>All traffic is served over HTTPS.</li>
          <li>Purchased PDFs are stored outside the public web root and can only be reached through a verified, paid order.</li>
          <li>The admin panel requires a password and issues a signed, expiring, HTTP-only session cookie.</li>
          <li>Login attempts are rate-limited to slow down guessing.</li>
          <li>Passwords are stored hashed, never in plain text.</li>
        </ul>
        <p>
          No system is perfectly secure. If we become aware of a breach affecting your personal data we will notify you
          and the regulator as required by law.
        </p>

        <h2>8. Your rights (DPDP Act 2023)</h2>
        <p>Under India’s Digital Personal Data Protection Act, 2023 you have the right to:</p>
        <ul>
          <li>get a summary of the personal data we hold about you;</li>
          <li>correct inaccurate or incomplete data;</li>
          <li>erase your data, subject to the retention obligations in section 6;</li>
          <li>withdraw consent (for marketing) at any time, by unsubscribing;</li>
          <li>grievance redressal — email us and we will respond within statutory timelines.</li>
        </ul>
        <p>
          Note that erasing your email address also erases your ability to re-download your files, because the email is
          how we prove the purchase is yours. We will warn you before doing it.
        </p>

        <h2>9. Children</h2>
        <p>
          Our material is aimed at students, many of whom are minors preparing for an entrance examination. We do not
          knowingly process a child’s data beyond the minimum needed to complete a purchase made with parental
          consent. A purchase should be made by, or with the knowledge of, a parent or guardian.
        </p>

        <h2>10. Third-party links</h2>
        <p>
          Our guides link to official sources such as the NIFT website. Those sites have their own privacy policies and
          we are not responsible for them.
        </p>

        <h2>11. Contact / Grievance Officer</h2>
        <p>
          For any privacy question, request or complaint, write to{' '}
          <a href={`mailto:${config.site.supportEmail}`}>{config.site.supportEmail}</a>. Please write from the email
          address associated with your order and include your order number so we can locate your record.
        </p>

        <h2>12. Changes</h2>
        <p>
          We may update this policy. Material changes will be shown at the top of this page with a new date. Continued
          use of the site after a change means you accept the updated policy.
        </p>
      </div>
    </div>
  );
}
