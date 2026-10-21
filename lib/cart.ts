'use client';

/**
 * cart.ts — the storefront basket.
 *
 * Products are single PDFs, so the "cart" is really a set: adding the same
 * PDF twice does not double-charge the student. Everything lives in
 * localStorage so the basket survives page reloads on a phone.
 */

export interface CartLine {
  id: string;
  slug: string;
  title: string;
  price_paise: number;
  mrp_paise?: number | null;
  cover_url?: string | null;
  cover_path?: string | null;
  category?: string | null;
}

const KEY = 'studypalace.cart.v1';

function read(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
    window.dispatchEvent(new CustomEvent('sp:cart', { detail: { lines } }));
  } catch {
    /* private browsing / quota — ignore */
  }
}

export function getCart(): CartLine[] {
  return read();
}

export function cartCount(): number {
  return read().length;
}

export function cartTotalPaise(): number {
  return read().reduce((sum, l) => sum + Number(l.price_paise || 0), 0);
}

export function isInCart(id: string): boolean {
  return read().some((l) => l.id === id);
}

export function addToCart(line: CartLine): CartLine[] {
  const lines = read();
  if (lines.some((l) => l.id === line.id)) return lines;
  lines.push(line);
  write(lines);
  return lines;
}

export function removeFromCart(id: string): CartLine[] {
  const lines = read().filter((l) => l.id !== id);
  write(lines);
  return lines;
}

export function clearCart(): void {
  write([]);
}

export function subscribeToCart(cb: (lines: CartLine[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => cb((e as CustomEvent).detail?.lines ?? read());
  const storageHandler = () => cb(read());
  window.addEventListener('sp:cart', handler as EventListener);
  window.addEventListener('storage', storageHandler);
  cb(read());
  return () => {
    window.removeEventListener('sp:cart', handler as EventListener);
    window.removeEventListener('storage', storageHandler);
  };
}

export function formatPaise(paise: number): string {
  const rupees = (Number(paise) || 0) / 100;
  return `₹${rupees.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/* ------------------------------------------------------------------ */
/* Server reconciliation                                               */
/* ------------------------------------------------------------------ */

const SYNC_TS_KEY = 'studypalace.cart.syncedAt';
const SYNC_EVERY_MS = 2 * 60 * 1000; // throttle background syncs to once per 2 min

export interface CartSyncResult {
  /** ids that are gone / unpublished / unsellable and were dropped */
  removed: string[];
  /** the cart as it now stands, with fresh prices & titles from the server */
  kept: CartLine[];
}

function sessionGet(key: string): string {
  try {
    return window.sessionStorage.getItem(key) || '';
  } catch {
    return '';
  }
}
function sessionSet(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* private browsing — ignore */
  }
}

/**
 * Reconcile the local basket with the live catalogue.
 *
 * Products deleted or unpublished from the admin panel disappear from the
 * cart, and surviving lines pick up current prices/titles/covers. Safe to
 * call often: background calls are throttled to once every couple of minutes,
 * and checkout passes { force: true } to always get a fresh answer.
 */
export async function syncCartWithServer(opts: { force?: boolean } = {}): Promise<CartSyncResult> {
  if (typeof window === 'undefined') return { removed: [], kept: [] };
  const lines = read();
  if (!lines.length) return { removed: [], kept: lines };

  if (!opts.force) {
    const last = Number(sessionGet(SYNC_TS_KEY) || 0);
    if (Date.now() - last < SYNC_EVERY_MS) return { removed: [], kept: lines };
  }
  sessionSet(SYNC_TS_KEY, String(Date.now()));

  try {
    const res = await fetch(`/api/cart/sync?ids=${encodeURIComponent(lines.map((l) => l.id).join(','))}`, {
      cache: 'no-store',
    });
    if (!res.ok) return { removed: [], kept: lines };
    const data: { ok?: boolean; lines?: CartLine[]; removed?: string[] } = await res.json();

    const server = new Map((data.lines || []).map((l) => [l.id, l]));
    const removed = (data.removed || []).filter((id) => lines.some((l) => l.id === id));
    const kept = lines.filter((l) => server.has(l.id)).map((l) => server.get(l.id)!);

    const changed =
      removed.length > 0 ||
      kept.length !== lines.length ||
      JSON.stringify(kept) !== JSON.stringify(lines);
    if (changed) write(kept);

    return { removed, kept };
  } catch {
    return { removed: [], kept: lines };
  }
}
