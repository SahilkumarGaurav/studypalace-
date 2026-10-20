'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Item {
  id: string;
  product_id: string;
  product_title: string | null;
  product_slug: string | null;
  unit_paise: number;
  total_paise: number;
}

interface AdminOrder {
  id: string;
  order_number: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  status: string;
  payment_status: string;
  subtotal_paise: number;
  discount_paise: number;
  total_paise: number;
  coupon_code?: string | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  download_token?: string | null;
  notes?: string | null;
  ip?: string | null;
  created_at: string;
  paid_at?: string | null;
  last_download_at?: string | null;
  download_count: number;
  items: Item[];
}

const rupees = (p: number) => `₹${(Number(p || 0) / 100).toLocaleString('en-IN')}`;
const dt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Paid' },
  { id: 'created', label: 'Unpaid' },
  { id: 'failed', label: 'Failed' },
  { id: 'refunded', label: 'Refunded' },
];

export default function OrderManager({ orders, total }: { orders: AdminOrder[]; total: number }) {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const visible = orders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (!q.trim()) return true;
    const needle = q.trim().toLowerCase();
    return [o.order_number, o.email, o.name, o.phone, o.razorpay_payment_id]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(needle));
  });

  async function act(order: AdminOrder, action: string) {
    if (action === 'mark_paid') {
      const ok = window.confirm(
        `Mark ${order.order_number} as PAID?\n\nOnly do this after you have confirmed in your Razorpay dashboard that the money was actually captured. This unlocks the customer's downloads immediately.`,
      );
      if (!ok) return;
    }
    let notes: string | undefined;
    if (action === 'mark_refunded') {
      const n = window.prompt('Reason for the refund (stored on the order):', 'Duplicate charge');
      if (n === null) return;
      notes = n;
    }
    if (action === 'note') {
      const n = window.prompt('Internal note for this order:', order.notes || '');
      if (n === null) return;
      notes = n;
    }

    setBusyId(order.id);
    setMessage('');
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, action, notes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Action failed');
      setMessage(`Order ${order.order_number} updated.`);
      router.refresh();
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-950 sm:text-3xl">Orders</h1>
          <p className="mt-1 text-sm text-ink-600">{total} order{total === 1 ? '' : 's'} in total.</p>
        </div>
      </header>

      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by order number, email, name or payment id…"
            className="input flex-1"
            aria-label="Search orders"
          />
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`chip shrink-0 ${filter === f.id ? '!border-brand-600 !bg-brand-600 !text-white' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {message ? <p className="mt-3 rounded-xl bg-ink-50 px-3 py-2 text-[13px] font-bold text-ink-800">{message}</p> : null}
      </div>

      {visible.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-display text-lg font-extrabold text-ink-950">No orders to show</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-600">
            When a student pays, their order appears here with the payment reference, what they bought and how many
            times they have downloaded it.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((o) => (
            <li key={o.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 p-4">
                <span className={`badge ${tone(o.payment_status)}`}>{o.payment_status}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[15px] font-extrabold text-ink-950">
                    {o.order_number}
                    <span className="ml-2 text-[12.5px] font-semibold text-ink-500">{dt(o.created_at)}</span>
                  </p>
                  <p className="truncate text-[13px] text-ink-600">
                    {o.email}
                    {o.name ? ` • ${o.name}` : ''}
                    {o.phone ? ` • ${o.phone}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-extrabold text-ink-950">{rupees(o.total_paise)}</p>
                  {o.discount_paise ? (
                    <p className="text-[11.5px] font-bold text-mint-700">
                      {o.coupon_code || 'discount'} −{rupees(o.discount_paise)}
                    </p>
                  ) : null}
                  <p className="text-[11.5px] font-semibold text-ink-500">
                    {o.download_count} download{o.download_count === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(open === o.id ? null : o.id)}
                  className="btn-ghost btn-sm"
                  aria-expanded={open === o.id}
                >
                  {open === o.id ? 'Hide' : 'Details'}
                </button>
              </div>

              {open === o.id && (
                <div className="border-t border-ink-100 bg-ink-50/40 p-4">
                  <dl className="grid gap-3 text-[12.5px] sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Items">
                      {o.items.length ? (
                        <ul className="space-y-1">
                          {o.items.map((i) => (
                            <li key={i.id}>
                              <span className="font-bold text-ink-900">{i.product_title}</span>{' '}
                              <span className="text-ink-500">({rupees(i.total_paise)})</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        '—'
                      )}
                    </Field>
                    <Field label="Razorpay order id">{o.razorpay_order_id || '—'}</Field>
                    <Field label="Razorpay payment id">{o.razorpay_payment_id || '—'}</Field>
                    <Field label="Paid at">{dt(o.paid_at)}</Field>
                    <Field label="Last download">{dt(o.last_download_at)}</Field>
                    <Field label="Subtotal">
                      {rupees(o.subtotal_paise)}
                      {o.discount_paise ? ` − ${rupees(o.discount_paise)}` : ''}
                    </Field>
                    <Field label="Customer IP">{o.ip || '—'}</Field>
                    <Field label="Download link">
                      {o.download_token ? (
                        <a className="break-all font-bold text-brand-700 underline" href={`/api/download/${o.download_token}?product=${o.items[0]?.product_id || ''}`}>
                          /api/download/{o.download_token.slice(0, 12)}…
                        </a>
                      ) : (
                        '—'
                      )}
                    </Field>
                    <Field label="Internal notes">{o.notes || '—'}</Field>
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-200 pt-4">
                    {o.payment_status !== 'paid' && (
                      <button type="button" disabled={busyId === o.id} onClick={() => act(o, 'mark_paid')} className="btn-dark btn-sm">
                        Mark as paid (money confirmed in Razorpay)
                      </button>
                    )}
                    {o.payment_status === 'paid' && (
                      <button
                        type="button"
                        disabled={busyId === o.id}
                        onClick={() => act(o, 'mark_refunded')}
                        className="btn btn-sm border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      >
                        Mark refunded &amp; revoke
                      </button>
                    )}
                    <button type="button" disabled={busyId === o.id} onClick={() => act(o, 'note')} className="btn-ghost btn-sm">
                      Add note
                    </button>
                    <a className="btn-ghost btn-sm" href={`mailto:${o.email}?subject=Your%20StudyPalace%20order%20${o.order_number}`}>
                      Email customer
                    </a>
                  </div>

                  <p className="mt-3 text-[11.5px] leading-5 text-ink-500">
                    Marking an order refunded revokes the download link immediately. Use it only for genuine duplicates
                    or a legally required reversal — the no-return policy is on the refund-policy page.
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white px-3 py-2">
      <dt className="text-[10.5px] font-bold uppercase tracking-widest text-ink-400">{label}</dt>
      <dd className="mt-0.5 break-words font-semibold text-ink-800">{children}</dd>
    </div>
  );
}

function tone(status: string) {
  if (status === 'paid') return 'bg-mint-100 text-mint-700';
  if (status === 'failed') return 'bg-red-100 text-red-700';
  if (status === 'refunded') return 'bg-ink-200 text-ink-700';
  return 'bg-gold-100 text-gold-700';
}
