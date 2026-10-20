import type { Metadata } from 'next';
import Link from 'next/link';
import { abs } from '@/lib/config';
import CheckoutWidget from '@/components/CheckoutWidget';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Secure Checkout — Pay with UPI, Card or Netbanking',
  description:
    'Complete your StudyPalace purchase securely with Razorpay. Pay by UPI, debit/credit card, netbanking or wallet and download your NIFT preparation PDF instantly.',
  robots: { index: false, follow: true },
  alternates: { canonical: abs('/checkout') },
};

export default function CheckoutPage() {
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
          <li className="text-ink-900">Checkout</li>
        </ol>
      </nav>

      <header className="mb-7 max-w-2xl">
        <h1 className="h-display text-3xl leading-tight sm:text-4xl">Checkout</h1>
        <p className="mt-2 text-[15px] leading-7 text-ink-600">
          One step left. Enter your email, pay through Razorpay, and your PDF unlocks immediately on the next screen.
        </p>
      </header>

      <CheckoutWidget />

      <section className="mx-auto mt-10 max-w-3xl rounded-3xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
        <h2 className="font-display text-base font-extrabold text-ink-950">Payment help</h2>
        <div className="mt-3 grid gap-3 text-sm leading-6 text-ink-600 sm:grid-cols-2">
          <p>
            <strong className="text-ink-900">UPI:</strong> choose UPI in the Razorpay window and approve the collect
            request in GPay, PhonePe or Paytm.
          </p>
          <p>
            <strong className="text-ink-900">Payment failed?</strong> You are not charged for a failed attempt. Reload
            and pay again, or try a different method.
          </p>
          <p>
            <strong className="text-ink-900">Money deducted but no download?</strong> Wait two minutes, then go to{' '}
            <Link href="/my-downloads" className="font-bold text-brand-700 underline decoration-brand-200">
              My Downloads
            </Link>{' '}
            with your order number and email.
          </p>
          <p>
            <strong className="text-ink-900">Still stuck?</strong> Email us with your order number — we resend the link
            the same day.
          </p>
        </div>
      </section>
    </div>
  );
}
