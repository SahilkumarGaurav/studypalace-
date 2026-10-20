'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: 'chart' },
  { href: '/admin/products', label: 'Products', icon: 'book' },
  { href: '/admin/orders', label: 'Orders', icon: 'receipt' },
  { href: '/admin/coupons', label: 'Coupons', icon: 'tag' },
  { href: '/admin/media', label: 'Files', icon: 'folder' },
  { href: '/admin/settings', label: 'Settings', icon: 'gear' },
];

export default function AdminShell({
  notices,
  children,
}: {
  notices: { tone: 'danger' | 'warn'; text: string }[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dismissed, setDismissed] = useState<number[]>([]);

  useEffect(() => setMenuOpen(false), [pathname]);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  const visible = notices.filter((_, i) => !dismissed.includes(i));

  return (
    <div className="min-h-screen bg-[#f6f5fb]">
      {/* top bar */}
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-ink-950 text-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle admin menu"
            aria-expanded={menuOpen}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-gold-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 3 2 8l10 5 8-4v6h2V8L12 3Z" />
              </svg>
            </span>
            <span className="font-display text-[15px] font-extrabold tracking-tight">
              StudyPalace <span className="text-white/45">admin</span>
            </span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {NAV.map((n) => {
              const active = n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold transition ${
                    active ? 'bg-white text-ink-950' : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="hidden rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] font-bold text-white/80 hover:bg-white/20 sm:inline-block"
            >
              View store ↗
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-full bg-red-500/90 px-3.5 py-1.5 text-[13px] font-bold text-white hover:bg-red-500"
            >
              Log out
            </button>
          </div>
        </div>

        {/* mobile nav */}
        {menuOpen && (
          <nav className="border-t border-white/10 px-4 py-3 lg:hidden">
            <div className="grid grid-cols-2 gap-2">
              {NAV.map((n) => {
                const active = n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`rounded-2xl px-4 py-3 text-[14px] font-bold ${
                      active ? 'bg-white text-ink-950' : 'bg-white/10 text-white'
                    }`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {visible.length > 0 && (
          <div className="mb-6 space-y-2">
            {notices.map((n, i) =>
              dismissed.includes(i) ? null : (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-[13.5px] leading-6 ${
                    n.tone === 'danger'
                      ? 'border-red-200 bg-red-50 text-red-800'
                      : 'border-gold-300 bg-gold-50 text-gold-800'
                  }`}
                  role={n.tone === 'danger' ? 'alert' : 'status'}
                >
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0" fill="currentColor" aria-hidden="true">
                    <path d="M12 2 1 21h22L12 2Zm1 14h-2v2h2v-2Zm0-7h-2v5h2V9Z" />
                  </svg>
                  <p className="flex-1 font-semibold">{n.text}</p>
                  <button
                    type="button"
                    onClick={() => setDismissed((d) => [...d, i])}
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold opacity-60 hover:opacity-100"
                    aria-label="Dismiss notice"
                  >
                    ✕
                  </button>
                </div>
              ),
            )}
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
