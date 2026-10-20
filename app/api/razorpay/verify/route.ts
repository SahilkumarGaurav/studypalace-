import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { verifyCheckoutSignature } from '@/lib/razorpay';
import {
  getOrderByRazorpayOrderId,
  listOrderItems,
  logEvent,
  markOrderFailed,
  markOrderPaid,
  useCoupon,
} from '@/lib/repo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/razorpay/verify
 *
 * Called by the browser right after the Razorpay modal reports success.
 * We re-verify the signature on the server — the browser is never trusted —
 * and only then flip the order to "paid" and hand back the download token.
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export async function POST(req: Request) {
  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const rzpOrderId = String(body.razorpay_order_id || '');
  const paymentId = String(body.razorpay_payment_id || '');
  const signature = String(body.razorpay_signature || '');

  if (!rzpOrderId || !paymentId || !signature) {
    return NextResponse.json({ ok: false, error: 'Missing payment details.' }, { status: 400 });
  }

  const order = getOrderByRazorpayOrderId(rzpOrderId);
  if (!order) {
    logEvent('razorpay.verify_unknown_order', undefined, undefined, rzpOrderId);
    return NextResponse.json({ ok: false, error: 'We could not find that order.' }, { status: 404 });
  }

  // Already paid (e.g. webhook beat us to it) — just return the success payload.
  if (order.payment_status === 'paid') {
    return successPayload(order.id, order.order_number, order.download_token || null, paymentId, true);
  }

  const valid = verifyCheckoutSignature({
    razorpay_order_id: rzpOrderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  });

  if (!valid) {
    logEvent('razorpay.signature_mismatch', order.id, undefined, paymentId);
    markOrderFailed(order.id, 'signature verification failed');
    return NextResponse.json(
      { ok: false, error: 'Payment could not be verified. If money was deducted, it will be auto-refunded by your bank.' },
      { status: 400 },
    );
  }

  markOrderPaid(order.id, paymentId, signature);
  if (order.coupon_code) useCoupon(order.coupon_code);
  logEvent('razorpay.verified', order.id, undefined, `${paymentId} • ${order.total_paise} paise`);

  return successPayload(order.id, order.order_number, order.download_token || null, paymentId, false);
}

async function successPayload(
  orderId: string,
  orderNumber: string,
  downloadToken: string | null,
  paymentId: string,
  alreadyPaid: boolean,
) {
  const items = listOrderItems(orderId);
  return NextResponse.json({
    ok: true,
    alreadyPaid,
    orderId,
    orderNumber,
    paymentId,
    downloadUrl: downloadToken ? `/api/download/${downloadToken}` : null,
    successUrl: `/order/${orderNumber}`,
    items: items.map((i) => ({ product_id: i.product_id, title: i.product_title, slug: i.product_slug })),
    supportEmail: config.site.supportEmail,
  });
}

/** GET is used by the checkout page to poll status if the tab is reloaded. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const rzpOrderId = url.searchParams.get('order_id') || '';
  if (!rzpOrderId) return NextResponse.json({ ok: false, error: 'Missing order_id.' }, { status: 400 });
  const order = getOrderByRazorpayOrderId(rzpOrderId);
  if (!order) return NextResponse.json({ ok: false, paid: false }, { status: 404 });
  return NextResponse.json({
    ok: true,
    paid: order.payment_status === 'paid',
    status: order.payment_status,
    orderNumber: order.order_number,
  });
}
