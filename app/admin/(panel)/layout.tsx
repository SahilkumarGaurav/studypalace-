import { redirect } from 'next/navigation';
import { isAdminLoggedIn, adminWarning } from '@/lib/auth';
import { config } from '@/lib/config';
import { dbInfo } from '@/lib/db';
import { razorpayStatus } from '@/lib/razorpay';
import AdminShell from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

/**
 * Everything under /admin (except /admin/login) renders inside this layout.
 * No valid signed session cookie -> redirected to the login screen.
 * robots.txt also disallows /admin so it never appears in search results.
 */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  // Second line of defence behind middleware.ts (which is the real guard).
  const ok = await isAdminLoggedIn();
  if (!ok) redirect('/admin/login');

  const db = dbInfo();
  const rp = razorpayStatus();
  const notices: { tone: 'danger' | 'warn'; text: string }[] = [];

  const warning = adminWarning();
  if (warning) notices.push({ tone: 'danger', text: warning });

  if (!rp.enabled) {
    notices.push({
      tone: 'danger',
      text: 'Razorpay is not configured — students cannot pay. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, then restart.',
    });
  } else if (config.isProd && rp.mode === 'test') {
    notices.push({
      tone: 'warn',
      text: 'You are serving the LIVE site with a Razorpay TEST key. Real money will not be collected.',
    });
  } else if (!config.isProd && rp.mode === 'live') {
    notices.push({ tone: 'warn', text: 'You are using a LIVE Razorpay key while running in development mode.' });
  }

  if (!rp.webhook) {
    notices.push({
      tone: 'warn',
      text: 'No RAZORPAY_WEBHOOK_SECRET. Payments still work, but if a student closes the tab mid-payment their order may stay "unpaid" until you mark it manually. Add a webhook at /api/razorpay/webhook to fix this.',
    });
  }

  if (!db.persistent) {
    notices.push({
      tone: 'danger',
      text: `Database is ${db.backend}. Products and orders will be LOST when the server restarts. Run on a host with a disk, or set DATABASE_URL to Postgres.`,
    });
  }

  if (config.appSecret === 'insecure-dev-secret-change-me' && config.isProd) {
    notices.push({
      tone: 'danger',
      text: 'APP_SECRET is still the default. Session cookies and download links can be forged. Set a long random string.',
    });
  }

  return <AdminShell notices={notices}>{children}</AdminShell>;
}
