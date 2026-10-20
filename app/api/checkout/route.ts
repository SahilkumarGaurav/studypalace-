import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { clientIp } from '@/lib/auth';
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '@/lib/validate';
import { createRazorpayOrder, describeRazorpayError, razorpayEnabled, razorpayStatus } from '@/lib/razorpay';
import {
  createOrder,
  getProductById,
  listOrderItems,
  logEvent,
  setRazorpayOrderId,
  validateCoupon,
  type Order,
} from '@/lib/repo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface CheckoutLine {
  id: string;
  unit_paise: number;
}

/**
 * POST /api/checkout
 *
 * Body: { items: [{id}], email, name?, phone?, coupon? }
 *
 * The server NEVER trusts client prices — every amount is re-read from the
 * database. If the order is free (0 items priced above zero) it is marked paid
 * immediately so the student gets the download without touching Razorpay.
 */
export async function POST(req: Request) {
  let body: {
    items?: { id?: string }[];
    email?: string;
    name?: string;
    phone?: string;
    coupon?: string;
    notes?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = normalizeEmail(String(body.email || ''));
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: 'Enter a valid email address — your download link is sent there.' },
      { status: 400 },
    );
  }
  const phone = normalizePhone(String(body.phone || ''));
  if (phone && !isValidPhone(phone)) {
    return NextResponse.json({ error: 'That phone number does not look right.' }, { status: 400 });
  }

  const rawIds = (body.items || []).map((i) => String(i?.id || '')).filter(Boolean);
  if (!rawIds.length) {
    return NextResponse.json({ error: 'Your cart is empty. Add a PDF first.' }, { status: 400 });
  }

  // de-duplicate, resolve, and re-price from the DB
  const uniqueIds = [...new Set(rawIds)].slice(0, 25);
  const lines: CheckoutLine[] = [];
  const missing: string[] = [];
  for (const id of uniqueIds) {
    const product = getProductById(id);
    if (!product || !product.is_active) {
      missing.push(id);
      continue;
    }
    lines.push({ id, unit_paise: Number(product.price_paise) || 0 });
  }
  if (missing.length) {
    return NextResponse.json(
      { error: 'One or more items are no longer available. Please refresh the shop and try again.' },
      { status: 409 },
    );
  }
  if (!lines.length) return NextResponse.json({ error: 'Nothing to buy.' }, { status: 400 });

  const subtotal = lines.reduce((s, l) => s + l.unit_paise, 0);

  // coupon
  let discount = 0;
  let couponCode: string | null = null;
  if (config.features.coupons && body.coupon) {
    const check = validateCoupon(String(body.coupon), subtotal);
    if (check.ok) {
      discount = check.discountPaise;
      couponCode = String(body.coupon).trim().toUpperCase();
    }
  }

  const products = lines.map((l) => getProductById(l.id)!);
  const order = createOrder({
    email,
    name: String(body.name || '').slice(0, 120) || undefined,
    phone: phone || undefined,
    coupon_code: couponCode,
    discount_paise: discount,
    ip: clientIp(req),
    user_agent: req.headers.get('user-agent') || undefined,
    notes: String(body.notes || '').slice(0, 500) || undefined,
    items: lines.map((l, i) => ({
      product_id: l.id,
      product_title: products[i].title,
      product_slug: products[i].slug,
      unit_paise: l.unit_paise,
    })),
  });

  const total = order.total_paise;

  // -------- FREE ORDER --------
  if (total <= 0) {
    const { markOrderPaid } = await import('@/lib/repo');
    markOrderPaid(order.id, 'free-order', '');
    logEvent('order.free', order.id, undefined, 'zero-value order completed');
    return NextResponse.json({
      ok: true,
      free: true,
      orderId: order.id,
      orderNumber: order.order_number,
      downloadToken: order.download_token,
    });
  }

  // -------- PAID ORDER: no gateway configured --------
  if (!razorpayEnabled()) {
    return NextResponse.json(
      {
        error: razorpayStatus().message || 'Payments are not configured yet.',
        code: 'GATEWAY_MISSING',
        orderId: order.id,
        orderNumber: order.order_number,
      },
      { status: 503 },
    );
  }

  // -------- PAID ORDER: create the Razorpay order --------
  try {
    const rzp = await createRazorpayOrder({
      amountPaise: total,
      receipt: order.order_number,
      notes: {
        order_id: order.id,
        order_number: order.order_number,
        email,
        name: order.name || '',
        phone: order.phone || '',
        items: products.map((p) => p.title).join(' | ').slice(0, 200),
      },
    });
    if (!rzp) throw new Error('Razorpay returned no order');
    setRazorpayOrderId(order.id, rzp.id);
    logEvent('razorpay.order_created', order.id, undefined, `${rzp.id} for ${total} paise`);

    return NextResponse.json({
      ok: true,
      free: false,
      orderId: order.id,
      orderNumber: order.order_number,
      amount: total,
      currency: rzp.currency,
      razorpayOrderId: rzp.id,
      keyId: config.razorpay.keyId,
      isTest: config.razorpay.isTest,
      prefill: {
        email,
        name: order.name || '',
        contact: phone || '',
      },
      theme: { color: '#7916ff' },
      siteName: config.site.name,
    });
  } catch (err) {
    const detail = describeRazorpayError(err);
    logEvent('razorpay.order_failed', order.id, undefined, detail);
    console.error('[checkout] razorpay order failed:', detail);

    // A 401 from Razorpay means the keys are wrong — that is a configuration
    // problem the owner must fix, not something the student can retry.
    const misconfigured = /401|Authentication failed|API keys/i.test(detail);
    return NextResponse.json(
      {
        error: misconfigured
          ? 'Payments are not set up correctly on this store yet. Please contact the seller — you have NOT been charged.'
          : 'Could not start the payment. Please try again in a minute. You have NOT been charged.',
        code: misconfigured ? 'GATEWAY_MISCONFIGURED' : 'GATEWAY_ERROR',
        // The raw reason is only exposed outside production, for you to debug.
        detail: config.isProd ? undefined : detail,
        orderId: order.id,
        orderNumber: order.order_number,
      },
      { status: misconfigured ? 503 : 502 },
    );
  }
}

/** GET /api/checkout?id=… — re-read an existing order (used by the success page). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id') || '';
  const number = url.searchParams.get('number') || '';
  if (!id && !number) return NextResponse.json({ error: 'Missing order id.' }, { status: 400 });

  const { getOrderById, getOrderByNumber } = await import('@/lib/repo');
  const order: Order | null = id ? getOrderById(id) : getOrderByNumber(number);
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

  const items = listOrderItems(order.id).map((i) => ({
    product_id: i.product_id,
    title: i.product_title,
    slug: i.product_slug,
  }));

  return NextResponse.json({
    orderNumber: order.order_number,
    status: order.status,
    payment_status: order.payment_status,
    total_paise: order.total_paise,
    created_at: order.created_at,
    paid_at: order.paid_at,
    items,
    // The download token is only released for paid orders.
    downloadToken: order.payment_status === 'paid' ? order.download_token : null,
  });
}
