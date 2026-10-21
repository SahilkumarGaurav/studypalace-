'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import DownloadButtons, { type DownloadFile } from './DownloadButtons';
import { formatPaise } from '@/lib/cart';

interface OrderResult {
  orderNumber: string;
  email: string;
  status: string;
  payment_status: string;
  total_paise: number;
  created_at: string;
  paid_at?: string | null;
  items: { title: string | null; slug: string | null }[];
  files: DownloadFile[];
}

function LookupInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<OrderResult[] | null>(null);
  const [support, setSupport] = useState('support@studypalace.in');

  useEffect(() => {
    const e = search.get('email');
    const n = search.get('order');
    if (e) setEmail(e);
    if (n) setOrderNumber(n);
    if (e || n) void run(e || '', n || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(emailValue = email, orderValue = orderNumber) {
    if (!emailValue.trim() && !orderValue.trim()) {
      setError('Enter your email address, your order number, or both.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue.trim(), orderNumber: orderValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setOrders(null);
        setError(data.error || 'We could not find that order.');
        if (data.supportEmail) setSupport(data.supportEmail);
        return;
      }
      setOrders(data.orders as OrderResult[]);
      if (data.supportEmail) setSupport(data.supportEmail);
      // keep the URL shareable but private (no tokens in it)
      const params = new URLSearchParams();
      if (emailValue.trim()) params.set('email', emailValue.trim());
      if (orderValue.trim()) params.set('order', orderValue.trim());
      router.replace(`/my-downloads?${params.toString()}`, { scroll: false });
    } catch {
      setError('Network problem. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
        className="card mx-auto max-w-2xl p-5 sm:p-7"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="dl-email">
              Email used at checkout
            </label>
            <input
              id="dl-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="dl-order">
              Order number <span className="font-normal text-ink-400">(optional — looks like SP-XXXXXX)</span>
            </label>
            <input
              id="dl-order"
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              placeholder="SP-7K3FQ2"
              autoComplete="off"
              className="input uppercase"
            />
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
            {error}{' '}
            <a className="underline" href={`mailto:${support}`}>
              {support}
            </a>
          </p>
        ) : null}

        <button type="submit" disabled={busy} className="btn-primary mt-5 w-full !py-3.5">
          {busy ? (
            <>
              <Spinner /> Finding your orders…
            </>
          ) : (
            <>
              <Key /> Get my download links
            </>
          )}
        </button>

        <p className="mt-3 text-center text-xs leading-5 text-ink-500">
          For your privacy we only ever release files for <strong>paid</strong> orders, and only to the email address
          that placed them.
        </p>
      </form>

      {orders?.length ? (
        <div className="mt-10 space-y-8">
          {orders.map((o) => (
            <section key={o.orderNumber}>
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink-100 pb-3">
                <div>
                  <h2 className="font-display text-xl font-extrabold text-ink-950">
                    Order {o.orderNumber}
                    {o.payment_status === 'paid' ? (
                      <span className="badge ml-2 bg-mint-100 text-mint-700">Paid</span>
                    ) : (
                      <span className="badge ml-2 bg-gold-100 text-gold-700">{o.payment_status}</span>
                    )}
                  </h2>
                  <p className="mt-1 text-[13px] font-semibold text-ink-500">
                    {formatPaise(o.total_paise)} • {o.items.map((i) => i.title).join(', ')}
                  </p>
                </div>
                <p className="text-[13px] font-semibold text-ink-500">
                  {new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="mt-4">
                {o.payment_status === 'paid' ? (
                  <DownloadButtons files={o.files} />
                ) : (
                  <div className="rounded-3xl border border-gold-200 bg-gold-50 p-5">
                    <p className="font-display text-[15px] font-extrabold text-ink-950">This order is not paid yet.</p>
                    <p className="mt-1.5 text-sm leading-6 text-ink-700">
                      Files unlock only after payment succeeds. If you already paid, wait two minutes and refresh.
                    </p>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </>
  );
}

export default function MyDownloads() {
  return (
    <Suspense fallback={<div className="card mx-auto h-64 max-w-2xl animate-pulse" />}>
      <LookupInner />
    </Suspense>
  );
}

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
const Key = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <path d="M15 2a7 7 0 0 0-6.7 9L2 17.3V22h4.7l1.3-1.3v-2h2v-2h2l1.5-1.5A7 7 0 1 0 15 2Zm2.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
  </svg>
);
