'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback } from 'react';
import SearchForm from './SearchForm';
import { CATEGORIES } from '@/lib/format';

const SORTS = [
  { id: 'newest', label: 'Newest first' },
  { id: 'popular', label: 'Most downloaded' },
  { id: 'price_asc', label: 'Price: low → high' },
  { id: 'price_desc', label: 'Price: high → low' },
  { id: 'title', label: 'A → Z' },
];

function ShopFiltersInner({ counts }: { counts: Record<string, number> }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const q = params.get('q') || '';
  const cat = params.get('cat') || '';
  const sort = params.get('sort') || 'newest';
  const max = params.get('max') || '';

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      <SearchForm initialQuery={q} id="shop-search" compact placeholder="Search PDFs, topics, sections…" />

      {/* Category chips — horizontally scrollable on mobile */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link
          href={cat ? `${pathname}?${new URLSearchParams({ ...Object.fromEntries(params.entries()), cat: '' }).toString()}` : pathname}
          onClick={(e) => {
            e.preventDefault();
            setParam('cat', '');
          }}
          className={`chip shrink-0 ${!cat ? '!border-brand-600 !bg-brand-600 !text-white' : ''}`}
        >
          All <span className="opacity-60">{total || ''}</span>
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setParam('cat', cat === c.slug ? '' : c.slug);
            }}
            className={`chip shrink-0 ${cat === c.slug ? '!border-brand-600 !bg-brand-600 !text-white' : ''}`}
          >
            {c.short}
            <span className="opacity-60">{counts[c.slug] || 0}</span>
          </Link>
        ))}
      </div>

      {/* Sort + price */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="sort" className="label">
            Sort by
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setParam('sort', e.target.value)}
            className="input !py-2.5"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-40">
          <label htmlFor="max" className="label">
            Max price (₹)
          </label>
          <input
            id="max"
            type="number"
            min={0}
            step={50}
            value={max}
            placeholder="Any"
            onChange={(e) => setParam('max', e.target.value)}
            className="input !py-2.5"
            inputMode="numeric"
          />
        </div>
        {(q || cat || max) && (
          <button
            type="button"
            onClick={() => router.replace(pathname, { scroll: false })}
            className="btn-ghost btn-sm shrink-0"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

export default function ShopFilters({ counts }: { counts: Record<string, number> }) {
  return (
    <Suspense
      fallback={<div className="h-24 animate-pulse rounded-3xl bg-ink-100" />}
    >
      <ShopFiltersInner counts={counts} />
    </Suspense>
  );
}
