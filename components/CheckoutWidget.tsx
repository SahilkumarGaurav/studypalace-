'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { clearCart, formatPaise, getCart, subscribeToCart, type CartLine } from '@/lib/cart';
import { isValidEmail, isValidPhone, normalizePhone } from '@/lib/validate';
import CoverImage from './CoverImage';
import Link from 'next/link';

type Phase = 'form' | 'processing' | 'razorpay' | 'done';

interface CheckoutResponse {
  ok?: boolean;
  free?: boolean;
  orderId?: string;
  orderNumber?: string;
  amount?: number;
  currency?: string;
  razorpayOrderId?: string;
  keyId?: string;
  isTest?: boolean;
  prefill?: { email: string; name: string; contact: string };
  theme?: { color: string };
  siteName?: string;
  downloadUrl?: string;
  successUrl?: string;
  error?: string;
  code?: string;
}

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export default function CheckoutWidget() {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [phase, setPhase] = useState<Phase>('form');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [scriptFailed, setScriptFailed] = useState(false);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponBusy, setCouponBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const submitted = useRef(false);

  useEffect(() => subscribeToCart((l) => {
    setLines(l);
    setLoaded(true);
  }), []);

  const subtotal = lines.reduce((s, l) => s + Number(l.price_paise || 0), 0);
  const mrpTotal = lines.reduce((s, l) => s + Number(l.mrp_paise || l.price_paise || 0), 0);
  const total = Math.max(0, subtotal - discount);

  /* ---------------- coupon ---------------- */
  async function applyCoupon() {
    const code = coupon.trim();
    if (!code) return;
    setCouponBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotalPaise: subtotal }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setDiscount(0);
        setNotice('');
        setError(data.error || 'That coupon could not be applied.');
        return;
      }
      setDiscount(Number(data.discountPaise || 0));
      setNotice(data.message || 'Coupon applied.');
      setError('');
    } catch {
      setError('Could not reach the server to check that coupon.');
    } finally {
      setCouponBusy(false);
    }
  }

  /* ---------------- pay ---------------- */
  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (submitted.current) return;
    setError('');
    setNotice('');

    if (!lines.length) {
      setError('Your cart is empty. Add a PDF first.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address — your download link goes there.');
      document.getElementById('email')?.focus();
      return;
    }
    if (phone && !isValidPhone(phone)) {
      setError('That phone number does not look right (10 digits).');
      document.getElementById('phone')?.focus();
      return;
    }
    if (!agreed) {
      setError('Please tick the box confirming you understand this is a digital product with no returns.');
      return;
    }

    submitted.current = true;
    setPhase('processing');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map((l) => ({ id: l.id })),
          email: email.trim(),
          name: name.trim(),
          phone: phone.trim() ? normalizePhone(phone.trim()) : '',
          coupon: coupon.trim() || undefined,
        }),
      });
      const data: CheckoutResponse = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        submitted.current = false;
        setPhase('form');
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      window.spTrack?.('purchase_initiated', {
        value: total / 100,
        currency: 'INR',
        transaction_id: data.orderNumber,
      });

      // -------- FREE --------
      if (data.free) {
        clearCart();
        router.push(`/order/${data.orderNumber}?token=${data.downloadUrl ? '' : ''}`);
        return;
      }

      // -------- RAZORPAY --------
      if (scriptFailed) {
        submitted.current = false;
        setPhase('form');
        setError(
          'The Razorpay payment window could not load (check your internet connection or any ad-blocker). Your order is saved — reload the page and try again.',
        );
        return;
      }

      setPhase('razorpay');
      openRazorpay(data);
    } catch (err) {
      submitted.current = false;
      setPhase('form');
      setError(`Network error: ${(err as Error).message}. Please try again.`);
    }
  }

  function openRazorpay(data: CheckoutResponse) {
    const loadScript = (): Promise<void> =>
      new Promise((resolve, reject) => {
        if (typeof window === 'undefined') return reject(new Error('no window'));
        if (window.Razorpay) return resolve();
        const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`) as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => reject(new Error('script load failed')));
          return;
        }
        const s = document.createElement('script');
        s.src = SCRIPT_SRC;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('script load failed'));
        document.body.appendChild(s);
      });

    loadScript()
      .then(() => {
        if (!window.Razorpay) throw new Error('Razorpay not available');

        const rzp = new window.Razorpay({
          key: data.keyId,
          amount: data.amount,
          currency: data.currency || 'INR',
          name: data.siteName || 'StudyPalace',
          description: lines.length === 1 ? lines[0].title : `${lines.length} NIFT preparation PDFs`,
          order_id: data.razorpayOrderId,
          image: '/icon.svg',
          prefill: {
            email: data.prefill?.email || email,
            name: data.prefill?.name || name,
            contact: data.prefill?.contact || phone,
          },
          notes: { orderNumber: data.orderNumber || '' },
          theme: { color: data.theme?.color || '#7916ff' },
          modal: {
            backdropclose: false,
            escape: true,
            handleback: true,
            confirm_close: true,
            ondismiss: () => {
              submitted.current = false;
              setPhase('form');
              setNotice('Payment window closed. Your order is saved — press Pay again whenever you are ready.');
            },
          },
          handler: async (response: Record<string, string>) => {
            setPhase('processing');
            try {
              const verify = await fetch('/api/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(response),
              });
              const result = await verify.json();
              if (!verify.ok || !result.ok) {
                submitted.current = false;
                setPhase('form');
                setError(
                  result.error ||
                    'Payment could not be verified. If money was deducted it will be auto-refunded within 5–7 working days.',
                );
                return;
              }
              window.spTrack?.('purchase', {
                transaction_id: result.orderNumber,
                value: (data.amount || 0) / 100,
                currency: 'INR',
                items: lines.map((l) => ({ item_id: l.slug, item_name: l.title })),
              });
              clearCart();
              setPhase('done');
              router.push(`/order/${result.orderNumber}?paid=1`);
            } catch {
              submitted.current = false;
              setPhase('form');
              setError('We could not confirm the payment. Reload and check My Downloads — it usually succeeds anyway.');
            }
          },
        });

        rzp.on('payment.failed', (raw: Record<string, unknown>) => {
          submitted.current = false;
          setPhase('form');
          const failure = raw?.error as { description?: string } | undefined;
          setError(`Payment failed: ${failure?.description || 'unknown reason'}. You have not been charged.`);
        });

        rzp.open();
      })
      .catch(() => {
        setScriptFailed(true);
        submitted.current = false;
        setPhase('form');
        setError(
          'Could not load the Razorpay checkout script. Check your connection or disable ad-blockers for this page, then try again.',
        );
      });
  }

  /* ---------------- render ---------------- */
  if (!loaded) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="card h-96 animate-pulse" />
        <div className="card h-96 animate-pulse" />
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-600">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6h15l-1.5 9h-12L5 3H2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="20" r="1.6" fill="currentColor" stroke="none" />
            <circle cx="18" cy="20" r="1.6" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <h2 className="mt-5 font-display text-2xl font-extrabold text-ink-950">Your cart is empty</h2>
        <p className="mt-2 text-[15px] leading-7 text-ink-600">
          Add a NIFT preparation PDF and it will show up here for checkout.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/shop" className="btn-primary">
            Browse PDFs
          </Link>
          <Link href="/my-downloads" className="btn-ghost">
            I already bought something
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
      {/* ------- left: details form ------- */}
      <form onSubmit={pay} className="card p-5 sm:p-7" noValidate>
        <h2 className="font-display text-xl font-extrabold text-ink-950">Where should we send your download?</h2>
        <p className="mt-1 text-sm text-ink-600">
          We only need your email. That is how you get the file and how you re-download it later.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="email">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
            />
            <p className="mt-1.5 text-xs text-ink-500">
              Use an email you will still have during your NIFT prep. Double-check the spelling.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ananya Sharma"
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="phone">
              Mobile number
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s-]/g, '').slice(0, 15))}
              placeholder="98765 43210"
              className="input"
            />
            <p className="mt-1.5 text-xs text-ink-500">Needed by Razorpay for UPI collect requests.</p>
          </div>
        </div>

        {/* coupon */}
        <div className="mt-6 rounded-2xl border border-ink-100 bg-ink-50/60 p-4">
          <label className="label" htmlFor="coupon">
            Have a coupon code?
          </label>
          <div className="flex gap-2">
            <input
              id="coupon"
              type="text"
              value={coupon}
              onChange={(e) => {
                setCoupon(e.target.value.toUpperCase());
                setDiscount(0);
              }}
              placeholder="NIFT2027"
              autoComplete="off"
              className="input !py-2.5 uppercase"
            />
            <button type="button" onClick={applyCoupon} disabled={couponBusy || !coupon.trim()} className="btn-ghost shrink-0">
              {couponBusy ? 'Checking…' : 'Apply'}
            </button>
          </div>
        </div>

        {/* policy agreement */}
        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-gold-200 bg-gold-50/70 p-4">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600"
          />
          <span className="text-[13.5px] leading-6 text-ink-800">
            I understand this is a <strong>digital PDF product</strong> delivered instantly, and that{' '}
            <strong>returns and refunds are not available</strong> once the file is downloaded.{' '}
            <Link href="/refund-policy" className="font-bold text-brand-700 underline decoration-brand-200">
              Read the policy
            </Link>
            .
          </span>
        </label>

        {error ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="mt-4 rounded-2xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm font-semibold text-mint-800" role="status">
            {notice}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={phase === 'processing' || phase === 'razorpay'}
          className="btn-primary mt-6 w-full !py-4 text-base"
        >
          {phase === 'processing' ? (
            <>
              <Spinner /> Creating your secure order…
            </>
          ) : phase === 'razorpay' ? (
            <>
              <Spinner /> Waiting for Razorpay…
            </>
          ) : total === 0 ? (
            <>Get my free download</>
          ) : (
            <>
              <Lock /> Pay {formatPaise(total)} securely
            </>
          )}
        </button>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11.5px] font-semibold text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <Lock /> 256-bit encrypted by Razorpay
          </span>
          <span>UPI • Cards • Netbanking • Wallets</span>
          <span>Instant download</span>
        </div>
      </form>

      {/* ------- right: summary ------- */}
      <aside className="card sticky top-24 p-5 sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-ink-950">Order summary</h2>
        <p className="mt-0.5 text-xs font-semibold text-ink-500">{lines.length} item{lines.length === 1 ? '' : 's'} • digital delivery</p>

        <ul className="mt-5 space-y-3">
          {lines.map((l) => (
            <li key={l.id} className="flex gap-3">
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded-xl">
                <CoverImage product={l} className="h-full w-full" sizes="48px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[13.5px] font-bold leading-5 text-ink-900">{l.title}</p>
                <p className="mt-1 text-[13px] font-extrabold text-brand-700">{formatPaise(Number(l.price_paise))}</p>
              </div>
            </li>
          ))}
        </ul>

        <dl className="mt-6 space-y-2.5 border-t border-ink-100 pt-5 text-sm">
          <Row label="Subtotal" value={formatPaise(subtotal)} />
          {mrpTotal > subtotal ? <Row label="MRP savings" value={`− ${formatPaise(mrpTotal - subtotal)}`} accent /> : null}
          {discount > 0 ? <Row label={`Coupon ${coupon.toUpperCase()}`} value={`− ${formatPaise(discount)}`} accent /> : null}
          <Row label="Delivery" value="Instant • Free" />
          <Row label="GST" value="Included" muted />
          <div className="flex items-baseline justify-between border-t border-ink-100 pt-4">
            <dt className="font-display text-base font-extrabold text-ink-950">Total payable</dt>
            <dd className="font-display text-2xl font-extrabold text-brand-700">{formatPaise(total)}</dd>
          </div>
        </dl>

        <div className="mt-5 space-y-2 rounded-2xl bg-ink-50/70 p-4 text-[12.5px] font-semibold text-ink-600">
          <p className="flex items-center gap-2">
            <Tick /> Download unlocks the moment payment succeeds
          </p>
          <p className="flex items-center gap-2">
            <Tick /> Re-download forever from My Downloads
          </p>
          <p className="flex items-center gap-2">
            <Tick /> Works on phone, tablet and laptop
          </p>
        </div>
      </aside>
    </div>
  );
}

/* ---------------- bits ---------------- */

function Row({ label, value, accent, muted }: { label: string; value: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={muted ? 'text-ink-400' : 'font-semibold text-ink-600'}>{label}</dt>
      <dd className={accent ? 'font-bold text-mint-700' : muted ? 'text-ink-400' : 'font-bold text-ink-900'}>{value}</dd>
    </div>
  );
}

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
const Lock = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm3 8H9V7a3 3 0 0 1 6 0v3Z" />
  </svg>
);
const Tick = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-mint-600" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
