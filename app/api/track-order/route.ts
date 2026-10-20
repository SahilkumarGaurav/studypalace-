import { NextResponse } from 'next/server';
import { findOrdersByEmail, getOrderByNumber, listOrderItems } from '@/lib/repo';
import { isValidEmail, normalizeEmail } from '@/lib/validate';
import { resolveDownloads } from '@/lib/orders';
import { config } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/track-order  { orderNumber?, email? }
 *
 * The student-facing "I lost my download link" recovery flow. Either:
 *   • order number + email  -> that specific order, or
 *   • email alone           -> every paid order on that address
 *
 * The download token is only ever returned for PAID orders.
 */
export async function POST(req: Request) {
  let body: { orderNumber?: string; email?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = normalizeEmail(String(body.email || ''));
  const number = String(body.orderNumber || '').trim();

  if (!number && !email) {
    return NextResponse.json({ error: 'Enter your order number or the email you used at checkout.' }, { status: 400 });
  }
  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: 'That email address does not look right.' }, { status: 400 });
  }

  const shape = (order: ReturnType<typeof getOrderByNumber>) => {
    if (!order) return null;
    const files = resolveDownloads(order);
    return {
      orderNumber: order.order_number,
      email: order.email,
      status: order.status,
      payment_status: order.payment_status,
      total_paise: order.total_paise,
      created_at: order.created_at,
      paid_at: order.paid_at,
      items: listOrderItems(order.id).map((i) => ({ title: i.product_title, slug: i.product_slug })),
      files: files.map((f) => ({
        product_id: f.product_id,
        title: f.title,
        slug: f.slug,
        file_name: f.file_name,
        downloadUrl: `/api/download/${order.download_token}?product=${f.product_id}`,
      })),
    };
  };

  if (number) {
    const order = getOrderByNumber(number);
    if (!order) {
      return NextResponse.json(
        { error: `No order found with number ${number.toUpperCase()}. Check your confirmation email or try searching by email only.` },
        { status: 404 },
      );
    }
    // If they also typed an email, it must match — otherwise anyone who guesses
    // an order number could pull someone else's files.
    if (email && order.email !== email) {
      return NextResponse.json(
        { error: 'That order number does not belong to this email address.' },
        { status: 403 },
      );
    }
    return NextResponse.json({ ok: true, orders: [shape(order)], supportEmail: config.site.supportEmail });
  }

  const orders = findOrdersByEmail(email);
  if (!orders.length) {
    return NextResponse.json(
      {
        error: `No completed purchases found for ${email}. If you paid with a different address, try that one — or email ${config.site.supportEmail} and we will find it.`,
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, orders: orders.map(shape), supportEmail: config.site.supportEmail });
}
