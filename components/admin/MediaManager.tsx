'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Media {
  id: string;
  kind: string;
  filename: string;
  path?: string | null;
  url?: string | null;
  size: number;
  created_at: string;
}

interface StorageInfo {
  writable: boolean;
  uploadDir: string;
  files: number;
  size: string;
  externalBase: string | null;
  database: string;
  persistent: boolean;
}

export default function MediaManager({ media, storage }: { media: Media[]; storage: StorageInfo }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<'pdf' | 'cover' | 'preview'>('pdf');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setError('Choose a file first.');
    setBusy(true);
    setError('');
    setMessage('');
    setProgress(0);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('kind', kind);

    try {
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else {
            let msg = 'Upload failed.';
            try {
              msg = JSON.parse(xhr.responseText).error || msg;
            } catch {
              /* ignore */
            }
            reject(new Error(msg));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload.'));
        xhr.open('POST', '/api/admin/media');
        xhr.send(fd);
      });
      setMessage(`Uploaded ${file.name}. You can now attach it to a product, or just keep it in the library.`);
      setFile(null);
      setProgress(100);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(m: Media) {
    if (!window.confirm(`Delete "${m.filename}" from the library?\n\nIf a product is using it, that product's download will break — check first.`)) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/media?id=${encodeURIComponent(m.id)}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-ink-950 sm:text-3xl">Files</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-600">
          Everything you have uploaded. These files live <strong>outside</strong> the public web folder — they can only
          be reached through a verified, paid download link.
        </p>
      </header>

      {!storage.writable && (
        <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-5">
          <h2 className="font-display text-base font-extrabold text-red-800">This host cannot store files</h2>
          <p className="mt-2 text-[13.5px] leading-6 text-red-700">
            The folder <code>{storage.uploadDir}</code> is not writable (this happens on Vercel and other serverless
            platforms, which have no persistent disk). Two fixes:
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13.5px] leading-6 text-red-700">
            <li>Deploy on a host with a disk — a ₹300/month VPS, Railway, Render or Fly.io all work with zero changes.</li>
            <li>
              Or store PDFs in S3 / Cloudflare R2 / Drive and paste the direct URL into the product form’s “link a file
              stored elsewhere” field. Set <code>PUBLIC_ASSET_BASE_URL</code> to your bucket URL.
            </li>
          </ol>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form onSubmit={upload} className="card h-fit p-5 lg:sticky lg:top-20">
          <h2 className="font-display text-lg font-extrabold text-ink-950">Upload a file</h2>
          <label className="mt-4 block">
            <span className="label">File</span>
            <input
              type="file"
              accept=".pdf,.zip,.epub,image/*"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setError('');
              }}
              className="block w-full cursor-pointer rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/50 p-4 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:border-brand-300"
            />
          </label>
          {file ? (
            <p className="mt-2 text-[13px] font-bold text-ink-800">
              {file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          ) : null}

          <div className="mt-4">
            <span className="label">What is it?</span>
            <div className="grid grid-cols-3 gap-2">
              {(['pdf', 'cover', 'preview'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`rounded-xl border px-3 py-2.5 text-[12.5px] font-bold capitalize transition ${
                    kind === k ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-ink-200 bg-white text-ink-600'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {error ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] font-bold text-red-700">{error}</p> : null}
          {message ? <p className="mt-3 rounded-xl border border-mint-200 bg-mint-50 px-3 py-2 text-[12.5px] font-bold text-mint-800">✓ {message}</p> : null}

          {busy && progress > 0 && progress < 100 ? (
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
                <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-center text-[12px] font-bold text-ink-600">{progress}%</p>
            </div>
          ) : null}

          <button type="submit" disabled={busy || !file} className="btn-primary mt-4 w-full">
            {busy ? 'Uploading…' : 'Upload'}
          </button>

          <p className="mt-3 text-[11.5px] leading-5 text-ink-500">
            Uploading here just puts the file in the library. To sell it, open a product and attach the file there (the
            product form has its own upload field, which is the normal way to do it).
          </p>
        </form>

        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="font-display text-base font-extrabold text-ink-950">Storage</h2>
            <dl className="mt-3 grid gap-3 text-[13px] sm:grid-cols-2">
              <Field label="Upload folder" value={storage.uploadDir} />
              <Field label="Writable" value={storage.writable ? 'Yes ✓' : 'NO ✗'} danger={!storage.writable} />
              <Field label="Files stored" value={`${storage.files} (${storage.size})`} />
              <Field label="Database" value={`${storage.database}${storage.persistent ? '' : ' — NOT PERSISTENT'}`} danger={!storage.persistent} />
              <Field label="External base URL" value={storage.externalBase || 'not set (files stream from disk)'} />
            </dl>
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-ink-100 px-5 py-4">
              <h2 className="font-display text-lg font-extrabold text-ink-950">Library ({media.length})</h2>
            </div>
            {media.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-500">Nothing uploaded yet.</p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {media.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <span className="badge bg-ink-100 text-ink-600 uppercase">{m.kind}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold text-ink-900">{m.filename}</p>
                      <p className="truncate text-[11.5px] text-ink-500">
                        {m.path || m.url} • {(Number(m.size) / 1024 / 1024).toFixed(2)} MB •{' '}
                        {new Date(m.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(m)}
                      disabled={busy}
                      className="btn btn-sm border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-xl bg-ink-50/70 px-3 py-2">
      <dt className="text-[10.5px] font-bold uppercase tracking-widest text-ink-400">{label}</dt>
      <dd className={`mt-0.5 break-all font-semibold ${danger ? 'text-red-700' : 'text-ink-800'}`}>{value}</dd>
    </div>
  );
}
