'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface AdminProduct {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  highlights?: string | null;
  price_paise: number;
  mrp_paise?: number | null;
  category?: string | null;
  exam?: string | null;
  course?: string | null;
  year?: string | null;
  pages?: number | null;
  language?: string | null;
  file_name?: string | null;
  file_path?: string | null;
  file_size?: number | null;
  file_url?: string | null;
  preview_file?: string | null;
  cover_path?: string | null;
  cover_url?: string | null;
  tags?: string | null;
  is_active: number;
  is_featured: number;
  is_bundle: number;
  bundle_ids?: string | null;
  bestseller: number;
  new_arrival: number;
  rating: number;
  rating_count: number;
  downloads_count: number;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { slug: 'gat', name: 'GAT — General Ability Test' },
  { slug: 'cat', name: 'CAT — Creative Ability Test' },
  { slug: 'situation-test', name: 'Situation Test' },
  { slug: 'previous-year-papers', name: 'Previous Year Papers' },
  { slug: 'current-affairs', name: 'Current Affairs & Fashion GK' },
  { slug: 'bundles', name: 'Complete Bundles' },
];

const COURSES = ['B.Des', 'B.FTech', 'M.Des', 'Both B.Des & B.FTech'];

const rupees = (paise?: number | null) =>
  paise === null || paise === undefined ? '' : String((Number(paise) || 0) / 100);

const humanSize = (bytes?: number | null) => {
  const b = Number(bytes || 0);
  if (!b) return '';
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

/* ------------------------------------------------------------------ */
/* Product form (create + edit)                                        */
/* ------------------------------------------------------------------ */

export default function ProductForm({ product, allProducts }: { product?: AdminProduct | null; allProducts: AdminProduct[] }) {
  const router = useRouter();
  const editing = Boolean(product?.id);

  const [title, setTitle] = useState(product?.title || '');
  const [slug, setSlug] = useState(product?.slug || '');
  const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug));
  const [subtitle, setSubtitle] = useState(product?.subtitle || '');
  const [description, setDescription] = useState(product?.description || '');
  const [highlights, setHighlights] = useState(product?.highlights || '');
  const [price, setPrice] = useState(rupees(product?.price_paise) || '199');
  const [mrp, setMrp] = useState(rupees(product?.mrp_paise) || '');
  const [category, setCategory] = useState(product?.category || 'gat');
  const [exam, setExam] = useState(product?.exam || 'NIFT');
  const [course, setCourse] = useState(product?.course || 'Both B.Des & B.FTech');
  const [year, setYear] = useState(product?.year || String(new Date().getFullYear() + 1));
  const [pages, setPages] = useState(product?.pages ? String(product.pages) : '');
  const [language, setLanguage] = useState(product?.language || 'English');
  const [tags, setTags] = useState(product?.tags || '');
  const [fileUrl, setFileUrl] = useState(product?.file_url || '');
  const [seoTitle, setSeoTitle] = useState(product?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(product?.seo_description || '');
  const [seoKeywords, setSeoKeywords] = useState(product?.seo_keywords || '');
  const [rating, setRating] = useState(String(product?.rating ?? 4.8));
  const [ratingCount, setRatingCount] = useState(String(product?.rating_count ?? 0));
  const [sortOrder, setSortOrder] = useState(String(product?.sort_order ?? 0));

  const [isActive, setIsActive] = useState(product ? Boolean(product.is_active) : true);
  const [isFeatured, setIsFeatured] = useState(Boolean(product?.is_featured));
  const [isBestseller, setIsBestseller] = useState(Boolean(product?.bestseller));
  const [isBundle, setIsBundle] = useState(Boolean(product?.is_bundle));
  const [bundleIds, setBundleIds] = useState<string[]>(
    product?.bundle_ids ? product.bundle_ids.split(',').map((s) => s.trim()).filter(Boolean) : [],
  );

  const [pdf, setPdf] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [preview, setPreview] = useState<File | null>(null);
  const [removePdf, setRemovePdf] = useState(false);
  const [removeCover, setRemoveCover] = useState(false);
  const [removePreview, setRemovePreview] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // auto-slug from title until the admin edits it by hand
  useEffect(() => {
    if (!slugTouched) {
      setSlug(
        title
          .toLowerCase()
          .normalize('NFKD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 70),
      );
    }
  }, [title, slugTouched]);

  const suggestedTags = useMemo(() => {
    const base = ['NIFT 2027', 'NIFT PDF', category === 'gat' ? 'GAT' : category === 'cat' ? 'CAT' : 'NIFT'];
    return base;
  }, [category]);

  const pricePaise = Math.round((Number(price) || 0) * 100);
  const mrpPaise = mrp ? Math.round((Number(mrp) || 0) * 100) : 0;
  const hasFile = Boolean(pdf) || (!removePdf && Boolean(product?.file_path)) || Boolean(fileUrl);
  const bundleOk = !isBundle || bundleIds.length > 0;
  const canSave = Boolean(title.trim()) && (hasFile || bundleOk);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');
    setSaved('');

    if (!title.trim()) return setError('Give the product a title.');
    if (!hasFile && !isBundle) return setError('Attach the PDF file (or a file URL) before saving.');
    if (isBundle && !bundleIds.length) return setError('A bundle needs at least one product inside it.');
    if (pricePaise < 0) return setError('Price cannot be negative.');

    setBusy(true);
    try {
      const fd = new FormData();
      if (product?.id) fd.append('id', product.id);
      fd.append('title', title.trim());
      fd.append('slug', slug.trim() || title.trim());
      fd.append('subtitle', subtitle.trim());
      fd.append('description', description);
      fd.append('highlights', highlights);
      fd.append('price', String(price || 0));
      fd.append('mrp', mrp || '');
      fd.append('category', category);
      fd.append('exam', exam.trim() || 'NIFT');
      fd.append('course', course);
      fd.append('year', year.trim());
      fd.append('pages', pages || '0');
      fd.append('language', language.trim() || 'English');
      fd.append('tags', tags.trim());
      fd.append('file_url', fileUrl.trim());
      fd.append('seo_title', seoTitle.trim());
      fd.append('seo_description', seoDescription.trim());
      fd.append('seo_keywords', seoKeywords.trim());
      fd.append('rating', rating || '4.8');
      fd.append('rating_count', ratingCount || '0');
      fd.append('sort_order', sortOrder || '0');
      fd.append('is_active', isActive ? '1' : '0');
      fd.append('is_featured', isFeatured ? '1' : '0');
      fd.append('bestseller', isBestseller ? '1' : '0');
      fd.append('is_bundle', isBundle ? '1' : '0');
      fd.append('bundle_ids', bundleIds.join(','));

      if (pdf) fd.append('pdf', pdf);
      if (cover) fd.append('cover', cover);
      if (preview) fd.append('preview', preview);
      if (removePdf) fd.append('remove_pdf', '1');
      if (removeCover) fd.append('remove_cover', '1');
      if (removePreview) fd.append('remove_preview', '1');

      const res = await fetch('/api/admin/products', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setError(data.error || 'Could not save the product.');
        setBusy(false);
        return;
      }

      setSaved(
        data.created
          ? `Created. It is live at /p/${data.product.slug}`
          : `Saved. Live at /p/${data.product.slug}`,
      );
      window.spTrack?.('admin_product_saved', { slug: data.product.slug });
      setBusy(false);

      if (data.warnings?.length) setError(`Saved, but: ${data.warnings.join(' ')}`);
      router.refresh();
      setTimeout(() => router.push('/admin/products'), 1200);
    } catch (err) {
      setError(`Network error: ${(err as Error).message}`);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {/* -------- the file -------- */}
        <section className="card border-2 border-brand-200 p-5 sm:p-6">
          <h2 className="font-display text-lg font-extrabold text-ink-950">
            1. The file you are selling <span className="text-red-500">*</span>
          </h2>
          <p className="mt-1 text-[13px] leading-6 text-ink-600">
            This is what the student downloads after paying. It is stored outside the public web folder, so nobody can
            reach it without a verified paid order.
          </p>

          <label className="mt-4 block">
            <span className="label">PDF (or ZIP / EPUB) file</span>
            <input
              type="file"
              accept=".pdf,.zip,.epub,application/pdf,application/zip,application/epub+zip"
              onChange={(e) => {
                setPdf(e.target.files?.[0] || null);
                setRemovePdf(false);
              }}
              className="block w-full cursor-pointer rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/50 p-4 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:border-brand-300"
            />
          </label>
          {pdf ? (
            <p className="mt-2 text-[13px] font-bold text-mint-700">
              ✓ {pdf.name} ({humanSize(pdf.size)}) will be uploaded
            </p>
          ) : product?.file_path ? (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink-600">
              Current file: <span className="font-bold text-ink-900">{product.file_name || product.file_path}</span>
              {product.file_size ? `(${humanSize(product.file_size)})` : ''}
              <button
                type="button"
                onClick={() => setRemovePdf((v) => !v)}
                className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${
                  removePdf ? 'bg-red-100 text-red-700' : 'bg-ink-100 text-ink-600 hover:bg-red-50 hover:text-red-600'
                }`}
              >
                {removePdf ? 'Will be removed — undo' : 'Remove file'}
              </button>
            </p>
          ) : null}

          <details className="mt-4 rounded-2xl border border-ink-100 bg-ink-50/50 p-4">
            <summary className="cursor-pointer text-[13px] font-bold text-ink-800">
              Or link a file stored elsewhere (S3 / Drive / Cloudinary)
            </summary>
            <input
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://your-bucket.s3.amazonaws.com/nift-gat.pdf"
              className="input mt-3"
            />
            <p className="mt-2 text-[12px] leading-5 text-ink-500">
              If set, this URL is used instead of an uploaded file. Only use it if the URL is private or signed — a
              public URL can be shared by anyone who finds it.
            </p>
          </details>

          <label className="mt-4 block">
            <span className="label">Free preview file (optional — shown on the product page)</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                setPreview(e.target.files?.[0] || null);
                setRemovePreview(false);
              }}
              className="block w-full cursor-pointer rounded-xl border border-ink-200 bg-white p-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink-100 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-ink-800"
            />
          </label>
          {product?.preview_file ? (
            <button
              type="button"
              onClick={() => setRemovePreview((v) => !v)}
              className={`mt-2 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${
                removePreview ? 'bg-red-100 text-red-700' : 'bg-ink-100 text-ink-600'
              }`}
            >
              {removePreview ? 'Preview will be removed — undo' : `Remove current preview (${product.preview_file})`}
            </button>
          ) : null}
        </section>

        {/* -------- details -------- */}
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-lg font-extrabold text-ink-950">2. What the student sees</h2>

          <div className="mt-4 grid gap-4">
            <div>
              <label className="label" htmlFor="f-title">
                Product title <span className="text-red-500">*</span>
              </label>
              <input
                id="f-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="NIFT GAT Quantitative Ability — 240 Practice Questions with Solutions"
                className="input"
                maxLength={160}
              />
              <p className="mt-1.5 text-[12px] text-ink-500">
                Put the search phrase a student would type first. {title.length}/160 characters.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="f-subtitle">
                One-line subtitle
              </label>
              <input
                id="f-subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Topic-wise practice for percentages, ratios, averages, interest and data interpretation."
                className="input"
                maxLength={220}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="f-cat">
                  Section (category)
                </label>
                <select id="f-cat" value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                  {CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="f-course">
                  For which course?
                </label>
                <select id="f-course" value={course} onChange={(e) => setCourse(e.target.value)} className="input">
                  {COURSES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="f-year">
                  Exam year
                </label>
                <input id="f-year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2027" className="input" maxLength={20} />
              </div>
              <div>
                <label className="label" htmlFor="f-pages">
                  Number of pages
                </label>
                <input
                  id="f-pages"
                  type="number"
                  min={0}
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  placeholder="120"
                  className="input"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="f-high">
                What’s inside (one bullet per line)
              </label>
              <textarea
                id="f-high"
                rows={6}
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder={'240 practice questions across 18 Quant topics\nDetailed solutions, not just answer keys\nShortcut methods for percentages and ratios\nTwo full-length sectional tests\nPrintable A4 format'}
                className="input resize-y font-mono text-[13px]"
              />
              <p className="mt-1.5 text-[12px] text-ink-500">These become the ticked bullet list on the product page.</p>
            </div>

            <div>
              <label className="label" htmlFor="f-desc">
                Full description
              </label>
              <textarea
                id="f-desc"
                rows={10}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the material in detail. This text is indexed by Google — write the way a student would search."
                className="input resize-y"
              />
              <p className="mt-1.5 text-[12px] text-ink-500">
                {description.length} characters. Plain text, line breaks are kept. Aim for 150+ words for good SEO.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="f-tags">
                Tags (comma separated)
              </label>
              <input
                id="f-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="NIFT GAT, quantitative ability, percentages, practice questions"
                className="input"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {suggestedTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTags((prev) => (prev ? `${prev}, ${t}` : t))}
                    className="chip"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* -------- bundle -------- */}
        <section className="card p-5 sm:p-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={isBundle}
              onChange={(e) => setIsBundle(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-brand-600"
            />
            <span>
              <span className="block font-display text-[15px] font-extrabold text-ink-950">This is a bundle</span>
              <span className="mt-0.5 block text-[13px] leading-6 text-ink-600">
                A bundle unlocks every product you tick below when someone buys it. Use it for “Complete NIFT 2027
                Pack”. The bundle itself needs no file.
              </span>
            </span>
          </label>

          {isBundle && (
            <div className="mt-4 rounded-2xl border border-ink-100 bg-ink-50/50 p-4">
              <p className="label">Products included</p>
              <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {allProducts.filter((p) => p.id !== product?.id && !Number(p.is_bundle)).length === 0 ? (
                  <p className="text-[13px] text-ink-500">
                    No other products yet. Create a few single PDFs first, then come back and bundle them.
                  </p>
                ) : (
                  allProducts
                    .filter((p) => p.id !== product?.id && !Number(p.is_bundle))
                    .map((p) => (
                      <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-xl bg-white px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={bundleIds.includes(p.id)}
                          onChange={(e) =>
                            setBundleIds((prev) =>
                              e.target.checked ? [...prev, p.id] : prev.filter((x) => x !== p.id),
                            )
                          }
                          className="h-5 w-5 accent-brand-600"
                        />
                        <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-ink-900">{p.title}</span>
                        <span className="shrink-0 text-[12.5px] font-extrabold text-brand-700">
                          ₹{(Number(p.price_paise) / 100).toFixed(0)}
                        </span>
                      </label>
                    ))
                )}
              </div>
              {bundleIds.length > 0 && (
                <p className="mt-3 text-[13px] font-bold text-mint-700">
                  {bundleIds.length} product{bundleIds.length === 1 ? '' : 's'} included • combined value ₹
                  {(
                    allProducts
                      .filter((p) => bundleIds.includes(p.id))
                      .reduce((s, p) => s + Number(p.price_paise), 0) / 100
                  ).toFixed(0)}
                </p>
              )}
            </div>
          )}
        </section>

        {/* -------- advanced -------- */}
        <section className="card p-5 sm:p-6">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex w-full items-center justify-between gap-3 text-left"
            aria-expanded={showAdvanced}
          >
            <span>
              <span className="block font-display text-[15px] font-extrabold text-ink-950">
                Advanced: SEO, cover image & ranking
              </span>
              <span className="mt-0.5 block text-[13px] text-ink-600">Optional — sensible defaults are used if you skip this.</span>
            </span>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-600 transition ${
                showAdvanced ? 'rotate-45' : ''
              }`}
            >
              +
            </span>
          </button>

          {showAdvanced && (
            <div className="mt-5 grid gap-4 border-t border-ink-100 pt-5">
              <div>
                <label className="label">Cover image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setCover(e.target.files?.[0] || null);
                    setRemoveCover(false);
                  }}
                  className="block w-full cursor-pointer rounded-xl border border-ink-200 bg-white p-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink-100 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-ink-800"
                />
                <p className="mt-1.5 text-[12px] text-ink-500">
                  Square or 3:4 works best. If you leave this empty the store auto-generates a gradient cover with the
                  title on it, so nothing ever looks broken.
                </p>
                {product?.cover_path || product?.cover_url ? (
                  <button
                    type="button"
                    onClick={() => setRemoveCover((v) => !v)}
                    className={`mt-2 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${
                      removeCover ? 'bg-red-100 text-red-700' : 'bg-ink-100 text-ink-600'
                    }`}
                  >
                    {removeCover ? 'Cover will be removed — undo' : 'Remove current cover'}
                  </button>
                ) : null}
              </div>

              <div>
                <label className="label" htmlFor="f-seotitle">
                  Google result title (SEO title)
                </label>
                <input
                  id="f-seotitle"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="NIFT GAT Quant PDF 2027 — 240 Practice Questions | Instant Download"
                  className="input"
                  maxLength={70}
                />
                <p className="mt-1.5 text-[12px] text-ink-500">{seoTitle.length}/70 — this is the blue link in Google.</p>
              </div>

              <div>
                <label className="label" htmlFor="f-seodesc">
                  Google result description (meta description)
                </label>
                <textarea
                  id="f-seodesc"
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Download 240 NIFT GAT quantitative ability practice questions with full solutions. Percentages, ratios, averages, interest, time & work. Instant PDF download after payment."
                  className="input resize-y"
                  maxLength={170}
                />
                <p className="mt-1.5 text-[12px] text-ink-500">{seoDescription.length}/170 characters.</p>
              </div>

              <div>
                <label className="label" htmlFor="f-seokw">
                  SEO keywords (comma separated)
                </label>
                <input
                  id="f-seokw"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="NIFT GAT quant PDF, NIFT quantitative ability practice, NIFT 2027 maths"
                  className="input"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="label" htmlFor="f-rating">
                    Rating shown
                  </label>
                  <input id="f-rating" type="number" step="0.1" min="0" max="5" value={rating} onChange={(e) => setRating(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="f-ratingcount">
                    Review count
                  </label>
                  <input id="f-ratingcount" type="number" min="0" value={ratingCount} onChange={(e) => setRatingCount(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="f-sort">
                    Manual sort order
                  </label>
                  <input id="f-sort" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="input" />
                  <p className="mt-1 text-[11.5px] text-ink-500">Lower appears first.</p>
                </div>
              </div>

              <div>
                <label className="label" htmlFor="f-slug">
                  URL slug
                </label>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-[13px] font-semibold text-ink-400">/p/</span>
                  <input
                    id="f-slug"
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'));
                    }}
                    className="input"
                    maxLength={80}
                  />
                </div>
                <p className="mt-1.5 text-[12px] text-ink-500">
                  Changing this on a live product breaks old links. Google will show the new one after re-crawling.
                </p>
              </div>

              <div>
                <label className="label" htmlFor="f-lang">
                  Language
                </label>
                <input id="f-lang" value={language} onChange={(e) => setLanguage(e.target.value)} className="input" maxLength={40} />
              </div>
            </div>
          )}
        </section>
      </div>

      {/* -------- right rail: price + publish -------- */}
      <aside className="space-y-5 lg:sticky lg:top-20">
        <section className="card p-5">
          <h2 className="font-display text-base font-extrabold text-ink-950">Price</h2>
          <div className="mt-4 grid gap-4">
            <div>
              <label className="label" htmlFor="f-price">
                Selling price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                id="f-price"
                type="number"
                min={0}
                step={1}
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input font-display text-xl font-extrabold"
                inputMode="decimal"
              />
              <p className="mt-1.5 text-[12px] text-ink-500">Set 0 to give it away free.</p>
            </div>
            <div>
              <label className="label" htmlFor="f-mrp">
                MRP / strike-through price (₹)
              </label>
              <input
                id="f-mrp"
                type="number"
                min={0}
                step={1}
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                placeholder="499"
                className="input"
                inputMode="decimal"
              />
              {mrpPaise > pricePaise && pricePaise > 0 ? (
                <p className="mt-1.5 text-[12.5px] font-bold text-gold-700">
                  Shows as {Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100)}% OFF
                </p>
              ) : mrp ? (
                <p className="mt-1.5 text-[12px] text-ink-500">Must be higher than the selling price to show a discount.</p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 space-y-2 border-t border-ink-100 pt-4">
            <Toggle label="Live in the store" hint="Turn off to hide it as a draft." checked={isActive} onChange={setIsActive} />
            <Toggle label="Featured" hint="Shows on the home page hero." checked={isFeatured} onChange={setIsFeatured} />
            <Toggle label="Bestseller badge" hint="Adds the black Bestseller tag." checked={isBestseller} onChange={setIsBestseller} />
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-base font-extrabold text-ink-950">Publish</h2>

          {error ? (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] font-bold leading-5 text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="mt-3 rounded-xl border border-mint-200 bg-mint-50 px-3 py-2.5 text-[12.5px] font-bold leading-5 text-mint-800" role="status">
              ✓ {saved}
            </p>
          ) : null}

          {!canSave && (
            <p className="mt-3 rounded-xl border border-gold-200 bg-gold-50 px-3 py-2.5 text-[12.5px] font-semibold leading-5 text-gold-800">
              {isBundle && !bundleIds.length
                ? 'Pick at least one product for this bundle.'
                : 'Add a title and a PDF file to enable saving.'}
            </p>
          )}

          <button type="submit" disabled={busy || !canSave} className="btn-primary mt-4 w-full !py-3.5">
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Publish product'}
          </button>

          <div className="mt-3 flex gap-2">
            <Link href="/admin/products" className="btn-ghost flex-1">
              Cancel
            </Link>
            {product?.slug ? (
              <Link href={`/p/${product.slug}`} target="_blank" className="btn-ghost flex-1">
                View page ↗
              </Link>
            ) : null}
          </div>

          <p className="mt-4 text-[11.5px] leading-5 text-ink-500">
            Saving updates the shop page, the category page, <code>sitemap.xml</code> and the product’s Google listing
            automatically. Nothing else to do.
          </p>
        </section>
      </aside>
    </form>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl px-1 py-2 hover:bg-ink-50">
      <span>
        <span className="block text-[13.5px] font-bold text-ink-900">{label}</span>
        {hint ? <span className="block text-[11.5px] text-ink-500">{hint}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-mint-500' : 'bg-ink-200'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="hidden" />
    </label>
  );
}
