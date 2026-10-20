import { NextResponse, type NextRequest } from 'next/server';
import { hasAdminSession } from '@/lib/edge-crypto';

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
    const res = allowed ? NextResponse.next() : redirectWithNext(req, pathname, search);
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

function redirectWithNext(req: NextRequest, pathname: string, search: string) {
  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url, 307);
}

/**
 * Only these paths ever enter middleware — everything else (shop, product
 * pages, guides, static assets, API routes) is untouched so it stays fast.
 */
export const config = {
  matcher: ['/admin', '/admin/:path*', '/order/:path*', '/checkout', '/my-downloads'],
};
