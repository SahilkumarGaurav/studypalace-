'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cartCount, subscribeToCart } from '@/lib/cart';
import { CATEGORIES } from '@/lib/format';

const NAV = [
  { href: '/shop', label: 'All PDFs' },
  { href: '/nift-gat-syllabus-pdf', label: 'GAT' },
  { href: '/nift-cat-drawing-practice-pdf', label: 'CAT' },
  { href: '/nift-situation-test-material', label: 'Situation Test' },
  { href: '/guides', label: 'Free Guides' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => subscribeToCart((lines) => setCount(lines.length)), []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/85 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="StudyPalace home">
          <Logo />
          <span className="font-display text-[19px] font-extrabold leading-none tracking-tight text-ink-950">
            Study<span className="text-brand-600">Palace</span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3.5 py-2 text-[14px] font-semibold transition ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50 hover:text-ink-950'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/shop"
            className="hidden items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-ink-600 transition hover:border-brand-300 hover:text-brand-700 md:flex"
            aria-label="Search PDFs"
          >
            <SearchIcon />
            <span className="hidden lg:inline">Search NIFT PDFs…</span>
          </Link>

          <Link
            href="/checkout"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-800 transition hover:border-brand-300 hover:text-brand-700"
            aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          <Link href="/checkout" className="btn-primary btn-sm hidden sm:inline-flex">
            Buy now
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-800 lg:hidden"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-white lg:hidden">
          <div className="container-x space-y-6 py-6">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-ink-400">Study material</p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/c/${c.slug}`}
                    className="rounded-2xl border border-ink-100 bg-ink-50/50 p-3 text-[13px] font-bold text-ink-800"
                  >
                    {c.short}
                  </Link>
                ))}
              </div>
            </div>

            <nav className="space-y-1" aria-label="Mobile">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-ink-800 hover:bg-brand-50"
                >
                  {item.label}
                  <Chevron />
                </Link>
              ))}
              <Link
                href="/my-downloads"
                className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-ink-800 hover:bg-brand-50"
              >
                My downloads
                <Chevron />
              </Link>
            </nav>

            <div className="rounded-3xl bg-brand-600 p-5 text-white">
              <p className="font-display text-lg font-extrabold">Targeting NIFT 2027?</p>
              <p className="mt-1 text-sm text-white/85">
                Start with the GAT + CAT combo pack — the two sections that decide your rank.
              </p>
              <Link href="/shop?sort=popular" className="btn-gold btn-sm mt-4 w-full">
                Browse bestsellers
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function Logo() {
  return (
    <span className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-ink-900 text-white shadow-pop">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M12 3 2 8l10 5 8-4v6h2V8L12 3Z" />
        <path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5l-6 3-6-3Z" opacity=".75" />
      </svg>
    </span>
  );
}

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
  </svg>
);
const CartIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M6 6h15l-1.5 9h-12L5 3H2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="20" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="18" cy="20" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
  </svg>
);
const Chevron = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink-300" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
    <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
