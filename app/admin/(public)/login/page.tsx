'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Login failed.');
        setBusy(false);
        return;
      }
      router.replace('/admin');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 hero-grid opacity-20" aria-hidden="true" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-gold-400 text-white shadow-pop">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
              <path d="M12 3 2 8l10 5 8-4v6h2V8L12 3Z" />
              <path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5l-6 3-6-3Z" opacity=".75" />
            </svg>
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-white">StudyPalace admin</h1>
          <p className="mt-1.5 text-sm text-white/60">Owner access only. This page is blocked from search engines.</p>
        </div>

        <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-white/[.06] p-6 backdrop-blur-xl">
          <label className="mb-1.5 block text-[13px] font-bold text-white/80" htmlFor="a-email">
            Admin email
          </label>
          <input
            id="a-email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@studypalace.in"
            className="w-full rounded-xl border border-white/15 bg-ink-900/70 px-4 py-3 text-[15px] text-white outline-none transition placeholder:text-white/30 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/25"
          />

          <label className="mb-1.5 mt-4 block text-[13px] font-bold text-white/80" htmlFor="a-pass">
            Password
          </label>
          <div className="relative">
            <input
              id="a-pass"
              type={show ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-white/15 bg-ink-900/70 px-4 py-3 pr-16 text-[15px] text-white outline-none transition placeholder:text-white/30 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/25"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-[12px] font-bold text-white/60 hover:bg-white/10 hover:text-white"
            >
              {show ? 'Hide' : 'Show'}
            </button>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-[13.5px] font-semibold text-red-200" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={busy} className="btn-primary mt-5 w-full !py-3.5">
            {busy ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="3" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Checking…
              </>
            ) : (
              <>Sign in to the store</>
            )}
          </button>

          <p className="mt-4 text-center text-[12px] leading-5 text-white/45">
            Credentials come from <code className="rounded bg-white/10 px-1">ADMIN_EMAIL</code> and{' '}
            <code className="rounded bg-white/10 px-1">ADMIN_PASSWORD</code> in your environment file. After 8 failed
            attempts you are locked out for 15 minutes.
          </p>
        </form>

        <a
          href="/"
          className="mt-6 block text-center text-[13px] font-bold text-white/50 hover:text-white"
        >
          ← Back to the public store
        </a>
      </div>
    </div>
  );
}
