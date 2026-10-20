'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Coupon {
  id: string;
  code: string;
  kind: 'percent' | 'flat';
  value: number;
  max_off_paise?: number | null;
  min_subtotal_paise: number;
  usage_limit?: number | null;
  used_count: number;
  active: number;
  expires_at?: string | null;
  created_at: string;
}

const rupees = (p?: number | null) => `₹${(Number(p || 0) / 100).toLocaleString('en-IN')}`;

const PRESETS = [
  { code: 'NIFT2027', kind: 'percent' as const, value: 10, note: '10% off everything — good launch coupon' },
  { code: 'FIRSTPDF', kind: 'flat' as const, value: 50, note: '₹50 off a first purchase' },
  { code: 'BUNDLE25', kind: 'percent' as const, value: 25, note: '25% off — point students at bundles' },
];

export default function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [kind, setKind] = useState<'percent' | 'flat'>('percent');
  const [value, setValue] = useState('10');
  const [maxOff, setMaxOff] = useState('');
  const [minSubtotal, setMinSubtotal] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [expires, setExpires] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function save(e: React.FormEvent, preset?: (typeof PRESETS)[number]) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    const payload = preset
      ? { code: preset.code, kind: preset.kind, value: preset.value }
      : {
          code: code.trim().toUpperCase(),
          kind,
          value: Number(value),
          max_off: maxOff || undefined,
          min_subtotal: minSubtotal || undefined,
          usage_limit: usageLimit || undefined,
          expires_at: expires || undefined,
        };

    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save the coupon');
      setMessage(`Coupon ${String(payload.code).toUpperCase()} is live. Students can enter it at checkout.`);
      setCode('');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(c: Coupon) {
    setBusy(true);
    try {
      await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, code: c.code, kind: c.kind, value: c.value, active: c.active ? false : true }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: Coupon) {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/coupons?id=${encodeURIComponent(c.id)}`, { method: 'DELETE' });
      setMessage(`Deleted ${c.code}.`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-ink-950 sm:text-3xl">Coupons</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-600">
          Discount codes students type at checkout. Great for launch week, Instagram stories and WhatsApp groups.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="font-display text-lg font-extrabold text-ink-950">Create a coupon</h2>
            <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="c-code">
                  Code
                </label>
                <input
                  id="c-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  placeholder="NIFT2027"
                  className="input font-mono uppercase"
                  maxLength={24}
                />
              </div>
              <div>
                <label className="label" htmlFor="c-kind">
                  Type
                </label>
                <select id="c-kind" value={kind} onChange={(e) => setKind(e.target.value as 'percent' | 'flat')} className="input">
                  <option value="percent">Percentage off</option>
                  <option value="flat">Flat rupees off</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="c-value">
                  {kind === 'percent' ? 'Percent (1–100)' : 'Amount (₹)'}
                </label>
                <input id="c-value" type="number" required min={1} value={value} onChange={(e) => setValue(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="c-max">
                  Max discount (₹, optional)
                </label>
                <input id="c-max" type="number" min={0} value={maxOff} onChange={(e) => setMaxOff(e.target.value)} placeholder="200" className="input" />
              </div>
              <div>
                <label className="label" htmlFor="c-min">
                  Minimum cart value (₹)
                </label>
                <input id="c-min" type="number" min={0} value={minSubtotal} onChange={(e) => setMinSubtotal(e.target.value)} placeholder="0" className="input" />
              </div>
              <div>
                <label className="label" htmlFor="c-limit">
                  Usage limit (blank = unlimited)
                </label>
                <input id="c-limit" type="number" min={1} value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="c-exp">
                  Expires on
                </label>
                <input id="c-exp" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className="input" />
              </div>

              {error ? (
                <p className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-bold text-red-700">
                  {error}
                </p>
              ) : null}
              {message ? (
                <p className="sm:col-span-2 rounded-xl border border-mint-200 bg-mint-50 px-3 py-2.5 text-[13px] font-bold text-mint-800">
                  ✓ {message}
                </p>
              ) : null}

              <div className="sm:col-span-2">
                <button type="submit" disabled={busy} className="btn-primary">
                  {busy ? 'Saving…' : 'Create coupon'}
                </button>
              </div>
            </form>
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-ink-100 px-5 py-4">
              <h2 className="font-display text-lg font-extrabold text-ink-950">Your coupons ({coupons.length})</h2>
            </div>
            {coupons.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-500">None yet.</p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {coupons.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <span className={`badge ${c.active ? 'bg-mint-100 text-mint-700' : 'bg-ink-100 text-ink-500'}`}>
                      {c.active ? 'Active' : 'Off'}
                    </span>
                    <span className="font-mono text-[15px] font-extrabold text-ink-950">{c.code}</span>
                    <span className="text-[13px] font-bold text-brand-700">
                      {c.kind === 'percent' ? `${c.value}% off` : `${rupees(c.value * 100)} off`}
                    </span>
                    <span className="text-[12.5px] text-ink-500">
                      {c.max_off_paise ? `max ${rupees(c.max_off_paise)} • ` : ''}
                      {c.min_subtotal_paise ? `min cart ${rupees(c.min_subtotal_paise)} • ` : ''}
                      {c.usage_limit ? `${c.used_count}/${c.usage_limit} used` : `${c.used_count} used`}
                      {c.expires_at ? ` • until ${new Date(c.expires_at).toLocaleDateString('en-IN')}` : ''}
                    </span>
                    <span className="ml-auto flex gap-2">
                      <button type="button" onClick={() => toggle(c)} disabled={busy} className="btn-ghost btn-sm">
                        {c.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(c)}
                        disabled={busy}
                        className="btn btn-sm border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card p-5">
            <h2 className="font-display text-base font-extrabold text-ink-950">One-click presets</h2>
            <div className="mt-3 space-y-2">
              {PRESETS.map((p) => {
                const exists = coupons.some((c) => c.code === p.code);
                return (
                  <button
                    key={p.code}
                    type="button"
                    disabled={busy || exists}
                    onClick={(e) => save(e as unknown as React.FormEvent, p)}
                    className="w-full rounded-2xl border border-ink-100 bg-ink-50/60 p-3 text-left transition hover:border-brand-200 hover:bg-brand-50 disabled:opacity-50"
                  >
                    <span className="block font-mono text-[14px] font-extrabold text-ink-950">{p.code}</span>
                    <span className="block text-[12.5px] text-ink-600">
                      {exists ? 'Already created' : p.note}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-display text-base font-extrabold text-ink-950">Where students enter it</h2>
            <p className="mt-2 text-[13px] leading-6 text-ink-600">
              On the <strong>checkout page</strong>, under the email field. The discount is re-validated on the server,
              so nobody can fake it by editing the page.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
