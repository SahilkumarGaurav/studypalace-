import { NextResponse } from 'next/server';
import { requireAdmin, readForm, str, int, flag, fileOf } from '@/lib/api-helpers';
import { saveUploadedFile, deleteStoredFile } from '@/lib/files';
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProductBySlug,
  listProducts,
  logEvent,
  slugExists,
  updateProduct,
  type ProductInput,
} from '@/lib/repo';
import { slugify } from '@/lib/crypto';
import { rupeesToPaise } from '@/lib/validate';
import { CATEGORIES } from '@/lib/format';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/admin/products — list everything, including inactive products. */
export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  const products = listProducts({ activeOnly: false, search: q || undefined, limit: 500 });
  return NextResponse.json({
    ok: true,
    count: products.length,
    products,
    categories: CATEGORIES.map((c) => ({ slug: c.slug, name: c.name, short: c.short })),
  });
}

/**
 * POST /api/admin/products — create or update a product.
 *
 * multipart/form-data:
 *   id (optional — if present we update that product)
 *   title, slug, subtitle, description, highlights,
 *   price (rupees), mrp (rupees), category, exam, course, year, pages, language,
 *   tags, is_active, is_featured, bestseller, sort_order,
 *   seo_title, seo_description, seo_keywords,
 *   rating, rating_count,
 *   is_bundle, bundle_ids,
 *   pdf (File), cover (File), preview (File),
 *   remove_pdf, remove_cover, remove_preview ("1" to clear)
 *   file_url (external storage URL, optional)
 */
export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const form = await readForm(req);
  if (!form) return NextResponse.json({ error: 'Expected multipart/form-data.' }, { status: 400 });

  const id = str(form, 'id');
  const existing = id ? getProductById(id) : null;
  if (id && !existing) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

  const title = str(form, 'title');
  if (!title) return NextResponse.json({ error: 'A title is required.' }, { status: 400 });

  // slug
  let slug = slugify(str(form, 'slug') || title);
  if (!slug) slug = `pdf-${Date.now().toString(36)}`;
  if (slugExists(slug, existing?.id)) {
    let n = 2;
    while (slugExists(`${slug}-${n}`, existing?.id)) n++;
    slug = `${slug}-${n}`;
  }

  const pricePaise = rupeesToPaise(str(form, 'price'));
  const mrpRaw = str(form, 'mrp');
  const mrpPaise = mrpRaw ? rupeesToPaise(mrpRaw) : null;

  const patch: ProductInput = {
    slug,
    title,
    subtitle: str(form, 'subtitle') || null,
    description: str(form, 'description') || null,
    highlights: str(form, 'highlights') || null,
    price_paise: Math.max(0, pricePaise),
    mrp_paise: mrpPaise && mrpPaise > pricePaise ? mrpPaise : null,
    category: (str(form, 'category') || 'gat').toLowerCase(),
    exam: str(form, 'exam') || 'NIFT',
    course: str(form, 'course') || null,
    year: str(form, 'year') || '2027',
    pages: int(form, 'pages', 0) || null,
    language: str(form, 'language') || 'English',
    tags: str(form, 'tags') || null,
    seo_title: str(form, 'seo_title') || null,
    seo_description: str(form, 'seo_description') || null,
    seo_keywords: str(form, 'seo_keywords') || null,
    is_active: form.has('is_active') ? flag(form, 'is_active') : 1,
    is_featured: form.has('is_featured') ? flag(form, 'is_featured') : 0,
    bestseller: form.has('bestseller') ? flag(form, 'bestseller') : 0,
    new_arrival: form.has('new_arrival') ? flag(form, 'new_arrival') : 1,
    sort_order: int(form, 'sort_order', 0),
    rating: Number(str(form, 'rating') || 4.8),
    rating_count: int(form, 'rating_count', 0),
    is_bundle: form.has('is_bundle') ? flag(form, 'is_bundle') : 0,
    bundle_ids: str(form, 'bundle_ids') || null,
    file_url: str(form, 'file_url') || null,
  };

  // ---- uploaded files ----
  const pdf = fileOf(form, 'pdf');
  if (pdf) {
    const allowed = ['pdf', 'zip', 'epub'];
    const ext = (pdf.name.split('.').pop() || '').toLowerCase();
    if (!allowed.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type ".${ext}". Allowed: PDF, ZIP, EPUB.` },
        { status: 400 },
      );
    }
    try {
      const saved = await saveUploadedFile(pdf, 'pdf', slug);
      patch.file_path = saved.relativePath;
      patch.file_name = saved.filename;
      patch.file_size = saved.size;
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message || 'Could not save the PDF.' }, { status: 400 });
    }
  } else if (str(form, 'remove_pdf') === '1') {
    if (existing?.file_path) deleteStoredFile(existing.file_path);
    patch.file_path = null;
    patch.file_name = null;
    patch.file_size = 0;
  }

  const cover = fileOf(form, 'cover');
  if (cover) {
    try {
      const saved = await saveUploadedFile(cover, 'cover', slug);
      patch.cover_path = saved.relativePath;
      patch.cover_url = null;
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message || 'Could not save the cover image.' }, { status: 400 });
    }
  } else if (str(form, 'remove_cover') === '1') {
    if (existing?.cover_path) deleteStoredFile(existing.cover_path);
    patch.cover_path = null;
    patch.cover_url = null;
  } else if (str(form, 'cover_url')) {
    patch.cover_url = str(form, 'cover_url');
    patch.cover_path = null;
  }

  const preview = fileOf(form, 'preview');
  if (preview) {
    try {
      const saved = await saveUploadedFile(preview, 'preview', `${slug}-preview`);
      patch.preview_file = saved.relativePath;
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message || 'Could not save the preview file.' }, { status: 400 });
    }
  } else if (str(form, 'remove_preview') === '1') {
    if (existing?.preview_file) deleteStoredFile(existing.preview_file);
    patch.preview_file = null;
  }

  // A product with no file and no bundle children cannot be sold.
  const willHaveFile = Boolean(patch.file_path || patch.file_url || existing?.file_path || existing?.file_url);
  const willBeBundle = Number(patch.is_bundle) === 1 && Boolean(patch.bundle_ids || existing?.bundle_ids);
  if (!willHaveFile && !willBeBundle) {
    return NextResponse.json(
      {
        error:
          'Add the PDF file before saving. A product needs either an uploaded PDF (or a file URL), or to be a bundle with products selected.',
        field: 'pdf',
      },
      { status: 400 },
    );
  }

  const product = existing ? updateProduct(existing.id, patch) : createProduct(patch);
  if (!product) return NextResponse.json({ error: 'Could not save the product.' }, { status: 500 });

  logEvent(existing ? 'product.updated' : 'product.created', undefined, product.id, product.title);

  return NextResponse.json({
    ok: true,
    product,
    url: `/p/${product.slug}`,
    created: !existing,
    warnings: warningsFor(product),
  });
}

/** DELETE /api/admin/products?id=… */
export async function DELETE(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const id = url.searchParams.get('id') || '';
  const product = id ? getProductById(id) : getProductBySlug(url.searchParams.get('slug') || '');
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

  const keepFiles = url.searchParams.get('files') === 'keep';
  if (!keepFiles) {
    deleteStoredFile(product.file_path);
    deleteStoredFile(product.cover_path);
    deleteStoredFile(product.preview_file);
  }
  deleteProduct(product.id);
  logEvent('product.deleted', undefined, product.id, product.title);
  return NextResponse.json({ ok: true, deleted: product.id });
}

function warningsFor(product: { file_path?: string | null; file_url?: string | null; cover_path?: string | null; price_paise: number; description?: string | null }): string[] {
  const w: string[] = [];
  if (!product.file_path && !product.file_url) w.push('No PDF attached yet — buyers would get an error at download time.');
  if (!product.cover_path) w.push('No cover image — the store is showing an auto-generated cover.');
  if (!product.description || product.description.length < 80) w.push('Short description — longer copy ranks better on Google and converts better.');
  if (Number(product.price_paise) === 0) w.push('Price is ₹0, so this product is given away free.');
  return w;
}
