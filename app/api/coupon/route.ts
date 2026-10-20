import { NextResponse } from 'next/server';
import { validateCoupon, type CouponCheck } from '@/lib/repo';
import { money } from '@/lib/repo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/coupon  { code, subtotalPaise }
 * Used by the checkout page to price a discount before payment.
 * The server re-validates the same coupon inside /api/checkout, so a
 * tampered client can never actually pay less.
 */
export async function POST(req: Request) {
  let body: { code?: string; subtotalPaise?: number } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const code = String(body.code || '').trim();
  const subtotal = Math.max(0, Math.round(Number(body.subtotalPaise) || 0));
  if (!code) return NextResponse.json({ ok: false, error: 'Enter a coupon code.', discountPaise: 0 });

  const result: CouponCheck = validateCoupon(code, subtotal);
  return NextResponse.json({
    ok: result.ok,
    error: result.reason,
    discountPaise: result.discountPaise,
    message: result.ok ? `${code.toUpperCase()} applied — you saved ${money(result.discountPaise)}.` : undefined,
  });
}
