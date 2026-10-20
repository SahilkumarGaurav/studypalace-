import { NextResponse } from 'next/server';
import { getProductBySlug } from '@/lib/repo';
import { readStoredFile } from '@/lib/files';
import { generateCoverSvg, PALETTES, paletteFor } from '@/lib/cover';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cover/[slug]        -> the uploaded cover image, or a generated SVG
 * GET /api/cover/[slug].png    -> a generated PNG for Open Graph cards
 *
 * Covers are stored outside public/ (same protection as the PDFs), so this
 * route is the only way to reach them.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  let { slug } = await params;
  const wantsPng = slug.toLowerCase().endsWith('.png');
  if (wantsPng) slug = slug.slice(0, -4);
  slug = decodeURIComponent(slug);

  const product = getProductBySlug(slug, true);

  if (!wantsPng && product?.cover_path) {
    const buffer = readStoredFile(product.cover_path);
    if (buffer) {
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': guessImageType(product.cover_path),
          'Content-Length': String(buffer.byteLength),
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }
  }

  const title = product?.title || 'StudyPalace';
  const subtitle =
    product?.subtitle ||
    (product?.year ? `NIFT ${product.year} preparation PDF` : 'NIFT preparation PDFs — instant download');
  const palette = paletteFor(slug, PALETTES);

  if (wantsPng) {
    const png = await renderPng({ title, subtitle, palette });
    if (png) {
      return new NextResponse(new Uint8Array(png), {
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
      });
    }
    // No rasterizer available — return the SVG so the page never 404s.
  }

  const svg = generateCoverSvg({ title, subtitle, palette, width: wantsPng ? 1200 : 600, height: wantsPng ? 630 : 800 });
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function guessImageType(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'svg') return 'image/svg+xml';
  return 'image/png';
}

/**
 * Try to rasterize the SVG to a 1200x630 PNG using `sharp` if it happens to be
 * installed. Purely optional — the SVG fallback is perfectly good for browsers.
 */
async function renderPng(input: { title: string; subtitle: string; palette: [string, string, string] }): Promise<Buffer | null> {
  try {
    const sharp = (await import('sharp')).default;
    const svg = generateCoverSvg({ ...input, width: 1200, height: 630, og: true });
    return await sharp(Buffer.from(svg)).resize(1200, 630).png().toBuffer();
  } catch {
    return null;
  }
}
