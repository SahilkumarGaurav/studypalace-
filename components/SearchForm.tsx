'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SearchForm({
  placeholder = 'Search “GAT quant”, “CAT drawing”, “situation test”…',
  initialQuery = '',
  autoFocus = false,
  id = 'site-search',
  compact = false,
}: {
  placeholder?: string;
  initialQuery?: string;
  autoFocus?: boolean;
  id?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  return (
    <form
      role="search"
      action="/shop"
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
      }}
      className={`relative flex w-full items-center ${compact ? '' : 'gap-2'}`}
    >
      <label htmlFor={id} className="sr-only">
        Search NIFT study material
      </label>
      <div className="relative flex-1">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-300"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          id={id}
          name="q"
          type="search"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          className="input !rounded-full !py-3.5 pl-12 pr-4 text-[15px]"
        />
      </div>
      <button type="submit" className="btn-primary shrink-0 !rounded-full">
        <span className="hidden sm:inline">Search</span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 sm:hidden" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}
