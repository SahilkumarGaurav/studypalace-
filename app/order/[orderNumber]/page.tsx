import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrderByNumber, listOrderItems } from '@/lib/repo';
import { resolveDownloads } from '@/lib/orders';
import { abs, config } from '@/lib/config';
import { inr, formatDateTime } from '@/lib/format';
import DownloadButtons from '@/components/DownloadButtons';
import ProductGrid from '@/components/ProductGrid';
import { listProducts } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order Confirmed — Download Your PDFs',
  description: 'Your StudyPalace order is confirmed. Download your NIFT preparation PDFs right away.',
  robots: { index: false, follow: false },
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = getOrderByNumber(orderNumber);
  if (!order) notFound();

  const paid = order.payment_status === 'paid';
  const files = paid ? resolveDownloads(order) : [];
  const items = listOrderItems(order.id);
  const more = listProducts({ sort: 'popular', limit: 4 }).filter(
    (p) => !items.some((i) => i.product_id === p.id),
  );

  return (
    <div className="container-x py-10 sm:py-14">
      {/* status banner */}
      <div
        className={`rounded-4xl border p-6 sm:p-9 ${
          paid ? 'border-mint-200 bg-mint-50' : 'border-gold-200 bg-gold-50'
        }`}
      >
        <div className="flex items-start gap-4">
          <span
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white ${
              paid ? 'bg-mint-500' : 'bg-gold-500'
            }`}
          >
            {paid ? (
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
                <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" />
              </svg>
            )}
          </span>
          <div className="min-w-0">
            <h1 className="h-display text-2xl leading-tight sm:text-3xl">
              {paid ? 'Payment successful — your PDFs are ready 🎉' : 'We have your order, but payment is not confirmed yet'}
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-7 text-ink-700">
              {paid
                ? 'Thank you for supporting an independent study-material store. Every file below is yours to keep forever — download them now, or come back any time from My Downloads.'
                : 'If money was deducted from your account, the confirmation usually lands within two minutes. Refresh this page, or open My Downloads with your order number and email.'}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Order number" value={order.order_number} strong />
              <Field label="Amount" value={inr(order.total_paise)} />
              <Field label="Payment" value={paid ? 'Paid ✓' : order.payment_status} />
              <Field label="Placed" value={formatDateTime(order.created_at)} />
            </dl>
          </div>
        </div>
      </div>

      {/* downloads */}
      {paid ? (
        <section className="mt-8">
          <h2 className="h-display text-2xl sm:text-3xl">Your downloads</h2>
          <p className="mt-1.5 text-[15px] text-ink-600">
            Tap a button and the PDF saves to your device. On phones it usually lands in the Downloads folder.
          </p>
          <div className="mt-5">
            <DownloadButtons token={order.download_token || ''} files={files} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <InfoCard
              title="Lost the link?"
              body="Your downloads live forever at My Downloads. Enter this order number and your email to get them back on any device."
              href="/my-downloads"
              cta="Open My Downloads"
            />
            <InfoCard
              title="Printing the PDF"
              body="These files are print-friendly. Use A4 at 100% scale for the drawing practice sheets so proportions stay correct."
            />
            <InfoCard
              title="Something wrong with the file?"
              body={`Email ${config.site.supportEmail} with your order number within 24 hours and we will replace the file. (No refunds on digital products.)`}
              href="/contact"
              cta="Contact support"
            />
          </div>
        </section>
      ) : (
        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="card p-6">
            <h2 className="font-display text-lg font-extrabold text-ink-950">Finish your payment</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              Your basket was saved when you started checkout. Go back and pay again — the same files will unlock
              immediately.
            </p>
            <Link href="/shop" className="btn-primary mt-5">
              Back to the shop
            </Link>
          </div>
          <div className="card p-6">
            <h2 className="font-display text-lg font-extrabold text-ink-950">Already paid?</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              Give it two minutes, then refresh this page. If it still shows unpaid, email{' '}
              {config.site.supportEmail} with order {order.order_number} and your payment reference.
            </p>
            <Link href="/my-downloads" className="btn-ghost mt-5">
              Check My Downloads
            </Link>
          </div>
        </section>
      )}

      {/* what they bought */}
      <section className="mt-12">
        <h2 className="h-display text-xl font-extrabold sm:text-2xl">Items in this order</h2>
        <ul className="mt-4 divide-y divide-ink-100 overflow-hidden rounded-3xl border border-ink-100 bg-white">
          {items.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-[14.5px] font-bold text-ink-900">{i.product_title}</p>
                {i.product_slug ? (
                  <Link href={`/p/${i.product_slug}`} className="text-[12.5px] font-semibold text-brand-700 hover:underline">
                    View product page
                  </Link>
                ) : null}
              </div>
              <span className="shrink-0 font-display text-base font-extrabold text-ink-950">{inr(i.total_paise)}</span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-4 bg-ink-50/60 px-5 py-4">
            <span className="text-sm font-bold text-ink-700">
              Total {order.discount_paise ? `(after ${inr(order.discount_paise)} discount)` : ''}
            </span>
            <span className="font-display text-lg font-extrabold text-brand-700">{inr(order.total_paise)}</span>
          </li>
        </ul>
      </section>

      {more.length > 0 && (
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <h2 className="h-display text-2xl sm:text-3xl">Continue your preparation</h2>
            <Link href="/shop" className="btn-ghost btn-sm shrink-0">
              All PDFs →
            </Link>
          </div>
          <div className="mt-6">
            <ProductGrid products={more} />
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', url: abs(`/order/${order.order_number}`), robots: 'noindex' }) }}
      />
    </div>
  );
}

function Field({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/80 px-3 py-2.5">
      <dt className="text-[10.5px] font-bold uppercase tracking-widest text-ink-400">{label}</dt>
      <dd className={`mt-0.5 break-words text-[13.5px] ${strong ? 'font-extrabold text-ink-950' : 'font-bold text-ink-800'}`}>
        {value}
      </dd>
    </div>
  );
}

function InfoCard({ title, body, href, cta }: { title: string; body: string; href?: string; cta?: string }) {
  return (
    <div className="card p-5">
      <h3 className="font-display text-[15px] font-extrabold text-ink-950">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-6 text-ink-600">{body}</p>
      {href && cta ? (
        <Link href={href} className="btn-ghost btn-sm mt-4">
          {cta}
        </Link>
      ) : null}
    </div>
  );
}
