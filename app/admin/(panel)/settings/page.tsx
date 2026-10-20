import Link from 'next/link';
import { config, abs } from '@/lib/config';
import { dbInfo } from '@/lib/db';
import { razorpayStatus } from '@/lib/razorpay';
import { diskUsage, humanSize, writableFilesystem } from '@/lib/files';
import { countProducts, countSubscribers, listSubscribers, salesSummary } from '@/lib/repo';
import { adminWarning } from '@/lib/auth';
import { assertProductionSafe } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default function AdminSettingsPage() {
  const db = dbInfo();
  const rp = razorpayStatus();
  const usage = diskUsage();
  const summary = salesSummary();
  const subs = listSubscribers(200);
  const hardProblems = assertProductionSafe();
  const warning = adminWarning();

  const checks: { label: string; ok: boolean; detail: string }[] = [
    {
      label: 'Admin password changed from the default',
      ok: !config.admin.passwordIsDefault,
      detail: config.admin.passwordIsDefault
        ? 'Set ADMIN_PASSWORD in your environment variables. Right now anyone who guesses "changeme123" owns your store.'
        : `Signed in as ${config.admin.email}`,
    },
    {
      label: 'APP_SECRET is set',
      ok: Boolean(process.env.APP_SECRET) || !config.isProd,
      detail: process.env.APP_SECRET
        ? 'Session cookies and download links are signed with your own secret.'
        : 'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    },
    {
      label: 'Razorpay keys configured',
      ok: rp.enabled,
      detail: rp.enabled
        ? `${rp.mode === 'live' ? 'LIVE' : 'TEST'} mode • key ${config.razorpay.keyId.slice(0, 12)}…`
        : 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET. Without them nobody can pay.',
    },
    {
      label: 'Correct Razorpay mode for this environment',
      ok: !config.isProd || rp.mode === 'live',
      detail: config.isProd && rp.mode === 'test'
        ? 'You are LIVE but using a test key — real customers cannot pay.'
        : !config.isProd && rp.mode === 'live'
          ? 'You are in development with a LIVE key. Test purchases will charge real money.'
          : 'Looks right.',
    },
    {
      label: 'Webhook configured (recommended)',
      ok: rp.webhook,
      detail: rp.webhook
        ? 'Payments are confirmed even if the student closes the tab.'
        : `Add a webhook in Razorpay pointing at ${abs('/api/razorpay/webhook')} and set RAZORPAY_WEBHOOK_SECRET.`,
    },
    {
      label: 'Database persists across restarts',
      ok: db.persistent,
      detail: db.persistent
        ? db.backend
        : `${db.backend} — products and orders will vanish on restart. Use a host with a disk, or set DATABASE_URL to Postgres.`,
    },
    {
      label: 'Upload folder is writable',
      ok: writableFilesystem(),
      detail: writableFilesystem()
        ? `${config.storage.uploadDir} • ${usage.files} files • ${humanSize(usage.bytes)}`
        : 'This host has no writable filesystem (typical on Vercel). Move to a VPS/Railway/Render, or use external file URLs.',
    },
    {
      label: 'Site URL is set for SEO',
      ok: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      detail: process.env.NEXT_PUBLIC_SITE_URL
        ? `${config.site.url} — canonicals, sitemap.xml and Open Graph all use this.`
        : `Falling back to ${config.site.url}. Set NEXT_PUBLIC_SITE_URL to your real domain or Google will index the wrong URLs.`,
    },
    {
      label: 'Every live product has a file',
      ok: summary.unitsSold >= 0 && !hardProblems.some((p) => p.includes('no PDF')),
      detail: 'Check the Dashboard for any “live but no PDF attached” warnings.',
    },
  ];

  const failing = checks.filter((c) => !c.ok).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-ink-950 sm:text-3xl">Settings &amp; store health</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-600">
          A live check of everything that has to be right for the store to take money and deliver files.
        </p>
      </header>

      {warning && (
        <div className="rounded-3xl border-2 border-red-300 bg-red-50 p-5 text-[13.5px] font-bold text-red-800">{warning}</div>
      )}

      <div
        className={`rounded-3xl border-2 p-5 ${
          failing === 0 ? 'border-mint-300 bg-mint-50' : failing <= 2 ? 'border-gold-300 bg-gold-50' : 'border-red-300 bg-red-50'
        }`}
      >
        <p className="font-display text-lg font-extrabold text-ink-950">
          {failing === 0 ? '✓ Everything checks out' : `${failing} thing${failing === 1 ? '' : 's'} need attention`}
        </p>
        <p className="mt-1 text-[13.5px] leading-6 text-ink-700">
          {failing === 0
            ? 'Your store can take payments, store files and deliver downloads. Nothing to fix.'
            : 'Work through the red items below. Most are a single environment variable.'}
        </p>
      </div>

      <section className="card divide-y divide-ink-100 overflow-hidden">
        {checks.map((c) => (
          <div key={c.label} className="flex items-start gap-3 px-5 py-4">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${
                c.ok ? 'bg-mint-500' : 'bg-red-500'
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.4" aria-hidden="true">
                {c.ok ? <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />}
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-extrabold text-ink-950">{c.label}</p>
              <p className="mt-0.5 break-words text-[12.5px] leading-5 text-ink-600">{c.detail}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-display text-base font-extrabold text-ink-950">Current configuration</h2>
          <dl className="mt-3 space-y-2 text-[13px]">
            <Row k="Site URL" v={config.site.url} />
            <Row k="Admin email" v={config.admin.email} />
            <Row k="Support email" v={config.site.supportEmail} />
            <Row k="Razorpay key" v={rp.enabled ? `${config.razorpay.keyId} (${rp.mode})` : 'not set'} />
            <Row k="Currency" v={config.razorpay.currency} />
            <Row k="Database" v={db.backend} />
            <Row k="Upload folder" v={`${config.storage.uploadDir} (${usage.files} files, ${humanSize(usage.bytes)})`} />
            <Row k="Max upload size" v={`${Math.round(config.storage.maxUploadBytes / 1024 / 1024)} MB`} />
            <Row k="Environment" v={config.isProd ? 'production' : 'development'} />
            <Row k="Products" v={`${countProducts({})} total, ${countProducts({ activeOnly: true })} live`} />
            <Row k="Newsletter subscribers" v={String(countSubscribers())} />
          </dl>
          <p className="mt-4 text-[12px] leading-5 text-ink-500">
            These come from your <code>.env.local</code> file (locally) or your host’s environment variables
            (deployed). Change them there, then restart the app.
          </p>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-base font-extrabold text-ink-950">Before you go live</h2>
          <ol className="mt-3 space-y-2.5 text-[13.5px] leading-6 text-ink-700">
            {[
              'Set ADMIN_PASSWORD to something long. You are the only person who should reach /admin.',
              'Set APP_SECRET to a random 64-character string.',
              'Swap the Razorpay TEST key for your LIVE key.',
              'Set NEXT_PUBLIC_SITE_URL to your real domain (https://…).',
              'Add the Razorpay webhook at /api/razorpay/webhook.',
              'Upload your PDFs and check one product end-to-end with a ₹1 test purchase.',
              'Submit /sitemap.xml in Google Search Console.',
              'Back up the data/ and uploads/ folders regularly.',
            ].map((s, i) => (
              <li key={s} className="flex gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-extrabold text-brand-700">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/admin/products/new" className="btn-primary btn-sm">
              + Add a product
            </Link>
            <Link href="/shop" target="_blank" className="btn-ghost btn-sm">
              View the shop ↗
            </Link>
          </div>
        </section>
      </div>

      {subs.length > 0 && (
        <section className="card overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-4">
            <h2 className="font-display text-lg font-extrabold text-ink-950">Newsletter subscribers ({countSubscribers()})</h2>
          </div>
          <ul className="max-h-80 divide-y divide-ink-100 overflow-y-auto">
            {subs.map((s) => (
              <li key={s.email} className="flex items-center justify-between gap-3 px-5 py-2.5 text-[13px]">
                <span className="font-semibold text-ink-900">{s.email}</span>
                <span className="shrink-0 text-ink-500">{new Date(s.created_at).toLocaleDateString('en-IN')}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 font-semibold text-ink-500">{k}</dt>
      <dd className="min-w-0 break-all text-right font-bold text-ink-900">{v}</dd>
    </div>
  );
}
