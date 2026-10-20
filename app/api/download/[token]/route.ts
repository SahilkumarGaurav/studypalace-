import { NextResponse } from 'next/server';
import { getOrderByToken, logEvent, noteDownload } from '@/lib/repo';
import { findDownloadable } from '@/lib/orders';
import { readStoredFile, resolveStored, publicUrlFor } from '@/lib/files';
import { config } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/download/[token]?product=<productId>
 *
 * The ONLY way a purchased PDF leaves the server.
 *
 *   1. The token belongs to a real order.
 *   2. That order is marked paid (verified against Razorpay earlier).
 *   3. The requested product is one the order actually unlocked.
 *
 * Files live outside public/, so there is no direct URL to guess.
 */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: 'Invalid download link.' }, { status: 400 });
  }

  const order = getOrderByToken(token);
  if (!order) {
    return NextResponse.json({ error: 'This download link is not valid.' }, { status: 404 });
  }
  if (order.payment_status !== 'paid') {
    return NextResponse.json(
      { error: 'This order has not been paid yet. Complete the payment to unlock your download.' },
      { status: 402 },
    );
  }

  const url = new URL(req.url);
  const productId = url.searchParams.get('product') || '';
  const file = findDownloadable(order, productId);

  if (!file) {
    logEvent('download.denied', order.id, productId || undefined, 'product not in order');
    return NextResponse.json({ error: 'That file is not part of this order.' }, { status: 403 });
  }

  // External storage (S3/R2/Cloudinary) — redirect rather than proxy.
  const external = file.file_url || publicUrlFor(file.file_path);
  if (external) {
    noteDownload(order.id);
    logEvent('download.served', order.id, file.product_id, 'redirect');
    return NextResponse.redirect(external, 302);
  }

  const absolute = resolveStored(file.file_path);
  if (!absolute) {
    logEvent('download.missing_file', order.id, file.product_id, 'path invalid');
    return NextResponse.json({ error: 'File is temporarily unavailable. Please contact support.' }, { status: 410 });
  }

  const buffer = readStoredFile(file.file_path);
  if (!buffer) {
    logEvent('download.missing_file', order.id, file.product_id, 'not found on disk');
    return NextResponse.json(
      {
        error: `We could not find "${file.file_name}" on the server. Email ${config.site.supportEmail} with your order number ${order.order_number} and we will send it to you right away.`,
      },
      { status: 410 },
    );
  }

  noteDownload(order.id);
  logEvent('download.served', order.id, file.product_id, file.file_name);

  const filename = safeFilename(file.file_name || `${file.slug}.pdf`);
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': guessMime(filename),
      'Content-Length': String(buffer.byteLength),
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
      'X-Order': order.order_number,
    },
  });
}

function safeFilename(name: string) {
  const clean = name.replace(/[^\w.\- ()]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 90) || 'download.pdf';
  return clean.includes('.') ? clean : `${clean}.pdf`;
}

function guessMime(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'zip':
      return 'application/zip';
    case 'epub':
      return 'application/epub+zip';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'txt':
      return 'text/plain; charset=utf-8';
    default:
      return 'application/pdf';
  }
}
