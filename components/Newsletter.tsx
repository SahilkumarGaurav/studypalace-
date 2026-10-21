'use client';

import { useState } from 'react';

export default function Newsletter({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'loading') return;
    setState('loading');
    setMessage('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState('error');
        setMessage(data?.error || 'Something went wrong. Please try again.');
        return;
      }
      setState('done');
      setMessage(data?.already ? 'You are already on the list. 🎉' : 'Done! Watch your inbox for the free sample PDF.');
      setEmail('');
      window.spTrack?.('newsletter_signup', { method: 'footer' });
    } catch {
      setState('error');
      setMessage('Network error. Please try again.');
    }
  }

  if (state === 'done') {
    return (
      <div className={`rounded-3xl border border-mint-200 bg-mint-50 p-5 text-center ${compact ? '' : 'sm:p-7'}`}>
        <p className="font-display text-lg font-extrabold text-mint-800">You’re on the list ✅</p>
        <p className="mt-1 text-sm text-mint-700">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={compact ? '' : 'mx-auto max-w-xl'}>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label htmlFor="nl-email" className="sr-only">
          Email address
        </label>
        <input
          id="nl-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="input flex-1"
          autoComplete="email"
          inputMode="email"
        />
        <button type="submit" disabled={state === 'loading'} className="btn-gold shrink-0">
          {state === 'loading' ? 'Sending…' : 'Get free sample PDF'}
        </button>
      </div>
      {state === 'error' && message ? (
        <p className="mt-2 text-sm font-semibold text-red-600" role="alert">
          {message}
        </p>
      ) : (
        <p className="mt-2 text-xs text-ink-500">
          Free GAT sample questions + exam updates. No spam, unsubscribe anytime.
        </p>
      )}
    </form>
  );
}
