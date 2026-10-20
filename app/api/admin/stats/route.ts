import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { countProducts, countSubscribers, listProducts, recentEvents, salesSummary } from '@/lib/repo';
import { diskUsage, humanSize, writableFilesystem } from '@/lib/files';
import { dbInfo } from '@/lib/db';
import { config } from '@/lib/config';
import { razorpayStatus } from '@/lib/razorpay';
import { adminWarning } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/admin/stats — everything the dashboard tiles need. */
export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const summary = salesSummary();
  const products = listProducts({ activeOnly: false, limit: 500 });
  const usage = diskUsage();

  const problems: string[] = [];
  const warn = adminWarning();
  if (warn) problems.push(warn);
  const rp = razorpayStatus();
  if (!rp.enabled) problems.push(rp.message || 'Razorpay is not configured.');
  if (config.isProd && rp.mode === 'test') problems.push('You are in LIVE mode but using a Razorpay TEST key.');
  if (!dbInfo().persistent)
    problems.push('Database is in-memory — orders and products will vanish when the server restarts. Set DATABASE_URL to a real database.');
  if (!writableFilesystem())
    problems.push('No writable filesystem — PDF uploads will fail on this host. Move to a VPS/Railway/Render, or use external file URLs.');
  if (config.appSecret === 'insecure-dev-secret-change-me' && config.isProd)
    problems.push('APP_SECRET is still the default. Session cookies and download links are forgeable — set a long random value.');
  for (const p of products) {
    if (p.is_active && !p.file_path && !p.file_url && !Number(p.is_bundle))
      problems.push(`“${p.title}” is live but has no PDF attached — buyers would get an error.`);
  }

  return NextResponse.json({
    ok: true,
    revenuePaise: summary.revenuePaise,
    paidOrders: summary.paidOrders,
    pendingOrders: summary.pendingOrders,
    failedOrders: summary.failedOrders,
    unitsSold: summary.unitsSold,
    last7Days: summary.last7Days,
    topProducts: summary.topProducts,
    products: {
      total: products.length,
      live: products.filter((p) => p.is_active).length,
      drafts: products.filter((p) => !p.is_active).length,
      missingFile: products.filter((p) => p.is_active && !p.file_path && !p.file_url && !Number(p.is_bundle)).length,
    },
    subscribers: countSubscribers(),
    storage: { files: usage.files, size: humanSize(usage.bytes), writable: writableFilesystem() },
    database: dbInfo(),
    razorpay: rp,
    problems,
    events: recentEvents(25),
    productCount: countProducts({ activeOnly: false }),
  });
}
