'use client';

import { useState } from 'react';

export interface DownloadFile {
  product_id: string;
  title: string;
  slug?: string;
  file_name?: string;
  category?: string | null;
  file_size?: number;
  fromBundle?: string | null;
  /** Optional pre-built protected URL (used by My Downloads lookups). */
  downloadUrl?: string;
}

/**
 * DownloadButtons — the actual "get my PDF" moment.
 *
 * Each button hits the protected route /api/download/<token>?product=<id>.
 * We use a hidden iframe-style anchor download so the browser shows its native
 * download UI, and we track per-file state so the student knows it worked.
 */
export default function DownloadButtons({ token = '', files }: { token?: string; files: DownloadFile[] }) {
  const [state, setState] = useState<Record<string, 'idle' | 'working' | 'done' | 'error'>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!files.length) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-gold-300 bg-gold-50 p-6 text-center">
        <p className="font-display text-base font-extrabold text-ink-950">
          Your order is paid, but there is no file attached to it yet.
        </p>
        <p className="mt-2 text-sm leading-6 text-ink-700">
          This usually means the seller has not uploaded the PDF for this product. Email support with your order number
          and you will get the file as soon as it is available.
        </p>
      </div>
    );
  }

  async function download(file: DownloadFile) {
    const url =
      file.downloadUrl || `/api/download/${encodeURIComponent(token)}?product=${encodeURIComponent(file.product_id)}`;
    setState((s) => ({ ...s, [file.product_id]: 'working' }));
    setErrors((e) => ({ ...e, [file.product_id]: '' }));

    try {
      const res = await fetch(url, { method: 'GET', cache: 'no-store' });
      if (!res.ok) {
        let message = 'Download failed. Please try again.';
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          /* non-JSON error */
        }
        setState((s) => ({ ...s, [file.product_id]: 'error' }));
        setErrors((e) => ({ ...e, [file.product_id]: message }));
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
      const filename = match ? decodeURIComponent(match[1]) : file.file_name || `${file.slug || 'studypalace'}.pdf`;

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 20_000);

      setState((s) => ({ ...s, [file.product_id]: 'done' }));
      window.spTrack?.('file_download', {
        item_id: file.slug,
        item_name: file.title,
      });
    } catch {
      setState((s) => ({ ...s, [file.product_id]: 'error' }));
      setErrors((e) => ({
        ...e,
        [file.product_id]: 'Network problem while downloading. Check your connection and try again.',
      }));
    }
  }

  return (
    <div className="space-y-3">
      {files.map((f) => {
        const st = state[f.product_id] || 'idle';
        return (
          <div key={`${f.product_id}-${f.fromBundle || ''}`} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                <path d="M6 2h8l4 4v16H6V2Zm7 1.5V7h3.5L13 3.5Z" />
              </svg>
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-extrabold leading-snug text-ink-950">{f.title}</p>
              <p className="mt-0.5 text-[12.5px] font-semibold text-ink-500">
                {f.file_name || `${f.slug}.pdf`}
                {f.file_size ? ` • ${(f.file_size / 1024 / 1024).toFixed(1)} MB` : ''}
                {f.fromBundle ? ` • included in ${f.fromBundle}` : ''}
              </p>
              {st === 'error' && errors[f.product_id] ? (
                <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] font-semibold text-red-700">
                  {errors[f.product_id]}
                </p>
              ) : null}
              {st === 'done' ? (
                <p className="mt-2 text-[12.5px] font-bold text-mint-700">
                  ✓ Saved. On phones check your Downloads folder or your browser’s download list.
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => download(f)}
              disabled={st === 'working'}
              className={`shrink-0 ${st === 'done' ? 'btn-ghost' : 'btn-primary'} w-full sm:w-auto`}
            >
              {st === 'working' ? (
                <>
                  <Spinner /> Preparing file…
                </>
              ) : st === 'done' ? (
                <>
                  <Refresh /> Download again
                </>
              ) : st === 'error' ? (
                <>
                  <Refresh /> Retry download
                </>
              ) : (
                <>
                  <Down /> Download PDF
                </>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
const Down = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
    <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 19h16" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Refresh = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
    <path d="M20 11a8 8 0 1 0-2.3 6.3M20 5v6h-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
