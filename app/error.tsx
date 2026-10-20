'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface the error in the server console where you can actually see it.
    console.error('[StudyPalace] unhandled page error:', error);
  }, [error]);

  return (
    <div className="container-x py-16 text-center">
      <p className="font-display text-6xl font-extrabold text-brand-200">Oops</p>
      <h1 className="h-display mt-3 text-3xl">Something broke on this page</h1>
      <p className="mx-auto mt-3 max-w-lg text-[15px] leading-7 text-ink-600">
        Nothing you bought is affected — your downloads are safe. Try again, and if it keeps happening email support
        with the reference below.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-ink-400">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/shop" className="btn-ghost">
          Go to the shop
        </Link>
        <Link href="/my-downloads" className="btn-ghost">
          My downloads
        </Link>
      </div>
    </div>
  );
}
