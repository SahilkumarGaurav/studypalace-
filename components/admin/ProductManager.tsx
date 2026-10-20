'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { AdminProduct } from './ProductForm';
export type { AdminProduct };

const rupees = (paise?: number | null) => `₹${((Number(paise) || 0) / 100).toLocaleString('en-IN')}`;
const humanSize = (b?: number | null) => {
  const n = Number(b || 0);
  if (!n) return '—';
  return n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
};

export default function ProductManager({ products }: { products: AdminProduct[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'live' | 'draft' | 'broken' | 'bundles'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((p) => {
      if (filter === 'live' && !p.is_active) return false;
      if (filter === 'draft' && p.is_active) return false;
      if (filter === 'bundles' && !Number(p.is_bundle)) return false;
      if (filter === 'broken' && !(!p.file_path && !p.file_url && !Number(p.is_bundle))) return false;
      if (!needle) return true;
      return [p.title, p.slug, p.category, p.tags, p.subtitle]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [products, q, filter]);

  async function toggleActive(p: AdminProduct) {
    setBusyId(p.id);
    setMessage('');
    const fd = new FormData();
    fd.append('id', p.id);
    fd.append('title', p.title);
    fd.append('slug', p.slug);
    fd.append('subtitle', p.subtitle || '');
    fd.append('description', p.description || '');
    fd.append('highlights', p.highlights || '');
    fd.append('price', String((Number(p.price_paise) || 0) / 100));
    fd.append('mrp', p.mrp_paise ? String(Number(p.mrp_paise) / 100) : '');
    fd.append('category', p.category || 'gat');
    fd.append('exam', p.exam || 'NIFT');
    fd.append('course', p.course || '');
    fd.append('year', p.year || '');
    fd.append('pages', p.pages ? String(p.pages) : '0');
    fd.append('language', p.language || 'English');
    fd.append('tags', p.tags || '');
    fd.append('file_url', p.file_url || '');
    fd.append('seo_title', p.seo_title || '');
    fd.append('seo_description', p.seo_description || '');
    fd.append('seo_keywords', p.seo_keywords || '');
    fd.append('rating', String(p.rating ?? 4.8));
    fd.append('rating_count', String(p.rating_count ?? 0));
    fd.append('sort_order', String(p.sort_order ?? 0));
    fd.append('is_active', p.is_active ? '0' : '1');
    fd.append('is_featured', p.is_featured ? '1' : '0');
    fd.append('bestseller', p.bestseller ? '1' : '0');
    fd.append('is_bundle', p.is_bundle ? '1' : '0');
    fd.append('bundle_ids', p.bundle_ids || '');

    try {
      const res = await fetch('/api/admin/products', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not update');
      setMessage(data.product.is_active ? `“${data.product.title}” is now LIVE.` : `“${data.product.title}” is now a draft.`);
      router.refresh();
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(p: AdminProduct) {
    const ok = window.confirm(
      `Delete "${p.title}"?\n\nThe uploaded PDF file is deleted too. Past orders keep their record but the file will no longer download.\n\nThis cannot be undone.`,
    );
    if (!ok) return;
    setBusyId(p.id);
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(p.id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not delete');
      setMessage(`Deleted “${p.title}”.`);
      router.refresh();
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-950 sm:text-3xl">Products</h1>
          <p className="mt-1 text-sm text-ink-600">
            {products.length} total • {products.filter((p) => p.is_active).length} live •{' '}
            {products.filter((p) => !p.is_active).length} drafts
          </p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          + Add a product
        </Link>
      </header>

      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your products…"
            className="input flex-1"
            aria-label="Search products"
          />
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {(['all', 'live', 'draft', 'bundles', 'broken'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`chip shrink-0 capitalize ${filter === f ? '!border-brand-600 !bg-brand-600 !text-white' : ''}`}
              >
                {f === 'broken' ? 'missing file' : f}
              </button>
            ))}
          </div>
        </div>
        {message ? (
          <p className="mt-3 rounded-xl bg-ink-50 px-3 py-2 text-[13px] font-bold text-ink-800" role="status">
            {message}
          </p>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-display text-lg font-extrabold text-ink-950">
            {products.length === 0 ? 'No products yet' : 'Nothing matches that filter'}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-600">
            {products.length === 0
              ? 'Add your first NIFT PDF. You need a title, a price and the file — everything else has a sensible default.'
              : 'Try clearing the search box or switching the filter.'}
          </p>
          {products.length === 0 && (
            <Link href="/admin/products/new" className="btn-primary mt-5">
              + Add your first product
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((p) => {
            const broken = !p.file_path && !p.file_url && !Number(p.is_bundle);
            return (
              <li key={p.id} className="card overflow-hidden">
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-ink-900 text-white">
                    {p.cover_path || p.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.cover_url || `/api/cover/${encodeURIComponent(p.slug)}`}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
                        <path d="M6 2h8l4 4v16H6V2Zm7 1.5V7h3.5L13 3.5Z" />
                      </svg>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`badge ${p.is_active ? 'bg-mint-100 text-mint-700' : 'bg-ink-100 text-ink-500'}`}>
                        {p.is_active ? 'Live' : 'Draft'}
                      </span>
                      {Number(p.is_bundle) ? <span className="badge bg-brand-100 text-brand-700">Bundle</span> : null}
                      {p.is_featured ? <span className="badge bg-gold-100 text-gold-700">Featured</span> : null}
                      {broken ? <span className="badge bg-red-100 text-red-700">No file!</span> : null}
                      <span className="badge bg-ink-50 text-ink-500">{p.category || 'uncategorised'}</span>
                    </div>
                    <p className="mt-1.5 truncate font-display text-[15px] font-extrabold text-ink-950">{p.title}</p>
                    <p className="mt-0.5 truncate text-[12.5px] text-ink-500">/p/{p.slug}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] font-semibold text-ink-600">
                      <span className="font-extrabold text-brand-700">{Number(p.price_paise) === 0 ? 'FREE' : rupees(p.price_paise)}</span>
                      {p.mrp_paise ? <span className="text-ink-400 line-through">{rupees(p.mrp_paise)}</span> : null}
                      <span>File: {p.file_name || p.file_url || '—'}</span>
                      <span>{humanSize(p.file_size)}</span>
                      <span>{p.downloads_count} downloads</span>
                      {p.pages ? <span>{p.pages} pages</span> : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link href={`/p/${p.slug}`} target="_blank" className="btn-ghost btn-sm">
                      View ↗
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleActive(p)}
                      disabled={busyId === p.id}
                      className="btn-ghost btn-sm disabled:opacity-50"
                    >
                      {p.is_active ? 'Unpublish' : 'Publish'}
                    </button>
                    <Link href={`/admin/products/${p.id}`} className="btn-dark btn-sm">
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(p)}
                      disabled={busyId === p.id}
                      className="btn btn-sm border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
