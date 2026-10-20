import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { createCoupon, deleteCoupon, listCoupons, logEvent, updateCoupon } from '@/lib/repo';
import { rupeesToPaise } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/admin/coupons */
export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return NextResponse.json({ ok: true, coupons: listCoupons() });
}

/** POST /api/admin/coupons — create or update */
export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const id = String(body.id || '');
  const code = String(body.code || '').trim().toUpperCase();
  const kind = String(body.kind || 'percent') === 'flat' ? 'flat' : 'percent';
  const value = Number(body.value || 0);

  if (!code) return NextResponse.json({ error: 'A coupon code is required.' }, { status: 400 });
  if (kind === 'percent' && (value <= 0 || value > 100))
    return NextResponse.json({ error: 'Percentage must be between 1 and 100.' }, { status: 400 });
  if (kind === 'flat' && value <= 0) return NextResponse.json({ error: 'Enter the rupee amount to discount.' }, { status: 400 });

  const payload = {
    kind: kind as 'percent' | 'flat',
    value,
    max_off_paise: body.max_off ? rupeesToPaise(body.max_off) : null,
    min_subtotal_paise: body.min_subtotal ? rupeesToPaise(body.min_subtotal) : 0,
    usage_limit: body.usage_limit ? Number(body.usage_limit) : null,
    expires_at: body.expires_at ? new Date(String(body.expires_at)).toISOString() : null,
    active: body.active === false || body.active === 0 || body.active === '0' ? 0 : 1,
  };

  if (id) {
    updateCoupon(id, payload);
    logEvent('coupon.updated', undefined, undefined, code);
    return NextResponse.json({ ok: true, coupons: listCoupons() });
  }

  if (listCoupons().some((c) => c.code === code)) {
    return NextResponse.json({ error: `Coupon ${code} already exists.` }, { status: 409 });
  }
  createCoupon({ code, ...payload });
  logEvent('coupon.created', undefined, undefined, code);
  return NextResponse.json({ ok: true, coupons: listCoupons() });
}

/** DELETE /api/admin/coupons?id=… */
export async function DELETE(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });
  deleteCoupon(id);
  return NextResponse.json({ ok: true, coupons: listCoupons() });
}
