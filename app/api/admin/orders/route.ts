import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import {
  getOrderById,
  getOrderByNumber,
  listOrderItems,
  listOrders,
  logEvent,
  markOrderPaid,
  updateOrder,
} from '@/lib/repo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/admin/orders?status=&q=&limit=&offset= */
export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'all';
  const q = url.searchParams.get('q') || '';
  const limit = Math.min(Number(url.searchParams.get('limit') || 100), 500);
  const offset = Number(url.searchParams.get('offset') || 0);

  const { rows, total } = listOrders({ status, search: q || undefined, limit, offset });
  const withItems = rows.map((o) => ({ ...o, items: listOrderItems(o.id) }));
  return NextResponse.json({ ok: true, total, orders: withItems });
}

/**
 * POST /api/admin/orders
 *   { orderId | orderNumber, action: 'mark_paid' | 'mark_refunded' | 'note', notes?, status? }
 *
 * "Mark as paid" exists for the real-world case where Razorpay captured the
 * money but the browser callback never reached us (lost network, closed tab,
 * webhook not configured). You confirm it in the Razorpay dashboard first.
 */
export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let body: { orderId?: string; orderNumber?: string; action?: string; notes?: string; status?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const order = body.orderId ? getOrderById(body.orderId) : body.orderNumber ? getOrderByNumber(body.orderNumber) : null;
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

  switch (body.action) {
    case 'mark_paid': {
      markOrderPaid(order.id, 'manual', '');
      logEvent('order.marked_paid_manually', order.id, undefined, 'admin action');
      return NextResponse.json({ ok: true, order: getOrderById(order.id) });
    }
    case 'mark_refunded': {
      updateOrder(order.id, { status: 'refunded', payment_status: 'refunded', notes: body.notes || 'Refunded by admin' });
      logEvent('order.refunded', order.id, undefined, body.notes || '');
      return NextResponse.json({ ok: true, order: getOrderById(order.id) });
    }
    case 'note': {
      updateOrder(order.id, { notes: String(body.notes || '').slice(0, 1000) });
      return NextResponse.json({ ok: true, order: getOrderById(order.id) });
    }
    case 'status': {
      const allowed = ['created', 'completed', 'failed', 'refunded', 'cancelled'];
      const next = String(body.status || '');
      if (!allowed.includes(next)) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
      updateOrder(order.id, { status: next });
      return NextResponse.json({ ok: true, order: getOrderById(order.id) });
    }
    default:
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  }
}
