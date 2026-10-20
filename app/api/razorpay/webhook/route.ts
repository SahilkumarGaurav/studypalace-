import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { verifyWebhookSignature } from '@/lib/razorpay';
import {
  getOrderByRazorpayOrderId,
  logEvent,
  markOrderFailed,
  markOrderPaid,
  useCoupon,
} from '@/lib/repo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/razorpay/webhook
 *
 * The safety net. If a student closes the tab, loses signal or the browser
 * crashes after paying, the verify call never fires — but Razorpay's webhook
 * does. Register this URL in your Razorpay dashboard:
 *
 *   https://your-domain.com/api/razorpay/webhook
 *   Secret key : the value of RAZORPAY_WEBHOOK_SECRET
 *   Events     : payment.captured , payment.failed , order.paid
 *
 * The raw body must be used for signature verification (never re-stringify a
 * parsed object — that changes byte order and breaks the HMAC).
 */
export async function POST(req: Request) {
  if (!config.razorpay.webhookSecret) {
    // Not configured: accept silently so Razorpay doesn't hammer retries.
    return NextResponse.json({ ok: true, ignored: 'no webhook secret configured' });
  }

  const raw = await req.text();
  const signature = req.headers.get('x-razorpay-signature');

  if (!verifyWebhookSignature(raw, signature)) {
    logEvent('razorpay.webhook_bad_signature', undefined, undefined, 'rejected webhook');
    return NextResponse.json({ ok: false, error: 'Invalid signature.' }, { status: 400 });
  }

  let payload: {
    event?: string;
    payload?: {
      payment?: { entity?: Record<string, unknown> };
      order?: { entity?: Record<string, unknown> };
    };
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: 'Unparseable body.' }, { status: 400 });
  }

  const event = String(payload.event || '');
  const payment = payload.payload?.payment?.entity;
  const rzpOrderId = String(payment?.order_id || payload.payload?.order?.entity?.id || '');
  const paymentId = String(payment?.id || '');

  if (!rzpOrderId) {
    logEvent('razorpay.webhook_no_order', undefined, undefined, event);
    return NextResponse.json({ ok: true, skipped: true });
  }

  const order = getOrderByRazorpayOrderId(rzpOrderId);
  if (!order) {
    logEvent('razorpay.webhook_unknown_order', undefined, undefined, `${event} ${rzpOrderId}`);
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (event === 'payment.captured' || event === 'order.paid') {
    if (order.payment_status !== 'paid') {
      markOrderPaid(order.id, paymentId, String(payment?.signature || ''));
      if (order.coupon_code) useCoupon(order.coupon_code);
      logEvent('razorpay.webhook_captured', order.id, undefined, `${paymentId} via webhook`);
    }
    return NextResponse.json({ ok: true, marked: 'paid' });
  }

  if (event === 'payment.failed') {
    markOrderFailed(order.id, String(payment?.error_description || 'payment.failed webhook'));
    return NextResponse.json({ ok: true, marked: 'failed' });
  }

  return NextResponse.json({ ok: true, ignored: event });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    webhookConfigured: Boolean(config.razorpay.webhookSecret),
    endpoint: '/api/razorpay/webhook',
    events: ['payment.captured', 'payment.failed', 'order.paid'],
  });
}
