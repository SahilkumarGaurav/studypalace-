import { NextResponse } from 'next/server';
import { getProductById } from '@/lib/repo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cart/sync?ids=id1,id2,…
 *
 * Carts live in each visitor's browser (localStorage), so when a product is
 * deleted or unpublished from the admin panel the stale line stays in old
 * carts. This endpoint lets the client reconcile its basket against the live
 * catalogue:
 *
 *   • products that no longer exist, are unpublished, or have no sellable file
 *     are reported in `removed` so the client drops them from the cart;
 *   • everything else is returned with its CURRENT title, price and cover, so
 *     a price change in the admin is reflected in the cart immediately
 *     (checkout still re-prices server-side — this is display-only).
 *
 * Public and cheap: it only reads products by primary key.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ids = (url.searchParams.get('ids') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 60);

  if (!ids.length) {
    return NextResponse.json({ ok: true, lines: [], removed: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const lines: {
    id: string;
    slug: string;
    title: string;
    price_paise: number;
    mrp_paise: number | null;
    cover_url: string | null;
    cover_path: string | null;
    category: string | null;
  }[] = [];
  const removed: string[] = [];

  for (const id of [...new Set(ids)]) {
    const product = getProductById(id);
    const sellable =
      product &&
      Number(product.is_active) === 1 &&
      (Boolean(product.file_path) || Boolean(product.file_url) || Number(product.is_bundle) === 1);

    if (!sellable) {
      removed.push(id);
      continue;
    }
    lines.push({
      id: product.id,
      slug: product.slug,
      title: product.title,
      price_paise: Number(product.price_paise) || 0,
      mrp_paise: product.mrp_paise === null || product.mrp_paise === undefined ? null : Number(product.mrp_paise),
      cover_url: product.cover_url || null,
      cover_path: product.cover_path || null,
      category: product.category || null,
    });
  }

  return NextResponse.json(
    { ok: true, lines, removed },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
