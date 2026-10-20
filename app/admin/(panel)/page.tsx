import Link from 'next/link';
import { countProducts, listProducts, recentEvents, recentOrders, salesSummary } from '@/lib/repo';
import { formatDateTime, inr, timeAgo } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const summary = salesSummary();
  const products = listProducts({ activeOnly: false, limit: 500 });
  const orders = recentOrders(8);
  const events = recentEvents(14);

  const live = products.filter((p) => p.is_active);
  const drafts = products.filter((p) => !p.is_active);
  const broken = products.filter((p) => p.is_active && !p.file_path && !p.file_url && !Number(p.is_bundle));
  const maxDay = Math.max(1, ...summary.last7Days.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-950 sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-600">
            Sales, downloads and everything that needs your attention — all on one screen.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products/new" className="btn-primary btn-sm">
            + Add a product
          </Link>
          <Link href="/admin/orders" className="btn-ghost btn-sm">
            View orders
          </Link>
        </div>
      </header>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Revenue (paid)" value={inr(summary.revenuePaise)} hint={`${summary.paidOrders} paid order${summary.paidOrders === 1 ? '' : 's'}`} tone="brand" />
        <Kpi label="Files sold" value={String(summary.unitsSold)} hint="Units across all orders" tone="mint" />
        <Kpi label="Unpaid / abandoned" value={String(summary.pendingOrders)} hint={`${summary.failedOrders} failed`} tone={summary.pendingOrders ? 'gold' : 'ink'} />
        <Kpi label="Products" value={`${live.length}/${products.length}`} hint={`${drafts.length} draft${drafts.length === 1 ? '' : 's'} • ${countProducts({})} total`} tone="ink" />
      </div>

      {/* alerts */}
      {(broken.length > 0 || products.length === 0) && (
        <div className="space-y-2">
          {products.length === 0 && (
            <div className="rounded-3xl border-2 border-dashed border-brand-300 bg-brand-50 p-6">
              <h2 className="font-display text-lg font-extrabold text-ink-950">Your store is empty 🎉</h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-700">
                Add your first PDF: give it a title, a price, upload the file, and it goes live on the shop page, the
                category pages, the sitemap and Google automatically. Nothing else to configure.
              </p>
              <Link href="/admin/products/new" className="btn-primary mt-4">
                + Add your first product
              </Link>
            </div>
          )}
          {broken.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="flex-1 text-[13.5px] font-bold text-red-800">
                “{p.title}” is live but has no PDF attached — buyers will hit an error at download time.
              </p>
              <Link href={`/admin/products/${p.id}`} className="btn-dark btn-sm">
                Fix it
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* revenue chart */}
          <section className="card p-5 sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-extrabold text-ink-950">Last 7 days</h2>
                <p className="text-[13px] text-ink-500">Revenue from paid orders, in ₹</p>
              </div>
              <p className="font-display text-xl font-extrabold text-brand-700">
                {inr(summary.last7Days.reduce((s, d) => s + d.revenue, 0))}
              </p>
            </div>
            <div className="mt-6 flex h-40 items-end gap-2">
              {summary.last7Days.map((d) => {
                const height = Math.max(3, Math.round((d.revenue / maxDay) * 100));
                return (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-[10.5px] font-bold text-ink-500">
                      {d.revenue ? inr(d.revenue).replace('₹', '') : ''}
                    </span>
                    <div
                      className={`w-full rounded-t-xl transition-all ${d.revenue ? 'bg-brand-500' : 'bg-ink-100'}`}
                      style={{ height: `${height}%` }}
                      title={`${d.date}: ${inr(d.revenue)} from ${d.orders} order(s)`}
                    />
                    <span className="text-[10.5px] font-semibold text-ink-400">
                      {new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* recent orders */}
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
              <h2 className="font-display text-lg font-extrabold text-ink-950">Recent orders</h2>
              <Link href="/admin/orders" className="text-[13px] font-bold text-brand-700 hover:underline">
                View all →
              </Link>
            </div>
            {orders.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-500">No orders yet. Share your store link to get the first one.</p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {orders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <span className={`badge ${statusTone(o.payment_status)}`}>{o.payment_status}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold text-ink-900">
                        {o.order_number} • {o.email}
                      </p>
                      <p className="text-[12px] text-ink-500">{timeAgo(o.created_at)}</p>
                    </div>
                    <span className="font-display text-[15px] font-extrabold text-ink-950">{inr(o.total_paise)}</span>
                    <Link href="/admin/orders" className="btn-ghost btn-sm">
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* top products */}
          {summary.topProducts.length > 0 && (
            <section className="card overflow-hidden">
              <div className="border-b border-ink-100 px-5 py-4">
                <h2 className="font-display text-lg font-extrabold text-ink-950">Best sellers</h2>
              </div>
              <ul className="divide-y divide-ink-100">
                {summary.topProducts.map((p) => (
                  <li key={p.product_title} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-ink-900">{p.product_title}</span>
                    <span className="shrink-0 text-[12.5px] font-semibold text-ink-500">{p.units} sold</span>
                    <span className="shrink-0 font-display text-[14px] font-extrabold text-brand-700">{inr(p.revenue)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* right rail */}
        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="font-display text-base font-extrabold text-ink-950">Quick actions</h2>
            <div className="mt-3 grid gap-2">
              <Link href="/admin/products/new" className="btn-dark w-full">+ New product</Link>
              <Link href="/admin/media" className="btn-ghost w-full">Upload a PDF</Link>
              <Link href="/admin/coupons" className="btn-ghost w-full">Create a coupon</Link>
              <Link href="/admin/settings" className="btn-ghost w-full">Check store health</Link>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-display text-base font-extrabold text-ink-950">Your catalogue</h2>
            <dl className="mt-3 space-y-2 text-[13.5px]">
              <Row label="Live products" value={String(live.length)} />
              <Row label="Drafts" value={String(drafts.length)} />
              <Row label="Featured" value={String(products.filter((p) => p.is_featured).length)} />
              <Row label="Missing file" value={String(broken.length)} danger={broken.length > 0} />
              <Row label="Total downloads" value={String(products.reduce((s, p) => s + Number(p.downloads_count || 0), 0))} />
            </dl>
            <Link href="/admin/products" className="btn-ghost btn-sm mt-4 w-full">
              Manage products
            </Link>
          </section>

          <section className="card p-5">
            <h2 className="font-display text-base font-extrabold text-ink-950">Activity log</h2>
            {events.length === 0 ? (
              <p className="mt-2 text-[13px] text-ink-500">Nothing yet.</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {events.map((e, i) => (
                  <li key={i} className="border-l-2 border-brand-200 pl-3">
                    <p className="text-[12.5px] font-bold text-ink-800">{e.kind}</p>
                    {e.message ? <p className="break-words text-[12px] text-ink-500">{e.message}</p> : null}
                    <p className="text-[11px] text-ink-400" title={formatDateTime(e.created_at)}>
                      {timeAgo(e.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: 'brand' | 'mint' | 'gold' | 'ink' }) {
  const tones: Record<string, string> = {
    brand: 'from-brand-600 to-brand-800 text-white',
    mint: 'from-mint-500 to-mint-700 text-white',
    gold: 'from-gold-400 to-gold-600 text-ink-950',
    ink: 'from-ink-800 to-ink-950 text-white',
  };
  return (
    <div className={`rounded-3xl bg-gradient-to-br p-5 shadow-card ${tones[tone]}`}>
      <p className={`text-[11px] font-bold uppercase tracking-widest ${tone === 'gold' ? 'text-ink-900/60' : 'text-white/60'}`}>
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-extrabold leading-none">{value}</p>
      <p className={`mt-2 text-[12px] font-semibold ${tone === 'gold' ? 'text-ink-900/70' : 'text-white/70'}`}>{hint}</p>
    </div>
  );
}

function Row({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="font-semibold text-ink-600">{label}</dt>
      <dd className={`font-extrabold ${danger ? 'text-red-600' : 'text-ink-950'}`}>{value}</dd>
    </div>
  );
}

function statusTone(status: string) {
  if (status === 'paid') return 'bg-mint-100 text-mint-700';
  if (status === 'failed') return 'bg-red-100 text-red-700';
  if (status === 'refunded') return 'bg-ink-100 text-ink-600';
  return 'bg-gold-100 text-gold-700';
}
