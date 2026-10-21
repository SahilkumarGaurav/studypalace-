import { NextResponse, type NextRequest } from 'next/server';
import { hasAdminSession } from '@/lib/edge-crypto';

// NOTE: we deliberately do NOT import `config` from lib/config here — Next.js
// reserves the exported name `config` in middleware.ts for the route matcher,
// so importing another `config` collides with it.
//
// NEXT_PUBLIC_* values are INLINED AT BUILD TIME, so they are useless here if
// the variable is set on the server after the build. CANONICAL_URL is read at
// runtime instead, which is what makes the admin redirect correct in production.
const CANONICAL_URL = (process.env.CANONICAL_URL || '').replace(/\/+$/, '');
const BUILD_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '');

/**
 * middleware.ts — the real guard for /admin.
 *
 * Why middleware instead of just the admin layout?
 * A `redirect()` thrown from a Next.js layout does NOT reliably stop the child
 * page from being rendered, so an unauthenticated visitor could still receive
 * the dashboard HTML. Middleware runs *before* any route rendering, so the
 * redirect is guaranteed. The admin layout keeps its own check as a second line
 * of defence, and every /api/admin/* route verifies the session cookie too.
 *
 * It also marks private/transactional pages as no-store so neither a browser
 * nor a CDN ever caches a paid download page or the admin panel.
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ---- /admin (except the login screen) ----
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const allowed = await hasAdminSession(req);
    const res = allowed ? NextResponse.next() : redirectToLogin(req, pathname, search);
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  // ---- keep the login page out of search engines too ----
  if (pathname.startsWith('/admin/login')) {
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  }

  // ---- private transactional pages ----
  if (pathname.startsWith('/order/') || pathname === '/checkout' || pathname === '/my-downloads') {
    const res = NextResponse.next();
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  }

  return NextResponse.next();
}

/**
 * Redirect an unauthenticated visitor to the admin login screen.
 *
 * The Location must be an ABSOLUTE url — Next.js middleware throws
 * `ERR_INVALID_URL` on a relative one. But we must NOT derive it from
 * `req.nextUrl`, because behind a reverse proxy that reflects the internal
 * origin (it produced https://localhost:3000/admin/login in production).
 *
 * So we use the canonical public origin from NEXT_PUBLIC_SITE_URL, falling
 * back to the forwarded headers, and only then to the raw request URL.
 */
function redirectToLogin(req: NextRequest, pathname: string, search: string) {
  const next = encodeURIComponent(pathname + search);
  return NextResponse.redirect(`${publicOrigin(req)}/admin/login?next=${next}`, 307);
}

function publicOrigin(req: NextRequest): string {
  // 1. the runtime canonical URL (most reliable — set it in .env.local)
  if (/^https?:\/\//i.test(CANONICAL_URL)) return CANONICAL_URL;

  // 2. headers forwarded by the reverse proxy (Caddy sets both automatically)
  const proto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (proto && host && !/^localhost|^127\./.test(host)) return `${proto}://${host}`;

  // 3. the build-time site URL, then the raw request origin
  if (/^https?:\/\//i.test(BUILD_SITE_URL)) return BUILD_SITE_URL;
  return req.nextUrl.origin;
}

/**
 * Only these paths ever enter middleware — everything else (shop, product
 * pages, guides, static assets, API routes) is untouched so it stays fast.
 */
export const config = {
  matcher: ['/admin', '/admin/:path*', '/order/:path*', '/checkout', '/my-downloads'],
};
