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
