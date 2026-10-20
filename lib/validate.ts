/** Shared validation helpers used by both client forms and API routes. */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
export const PHONE_RE = /^[0-9+\-\s()]{7,17}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test((email || '').trim()) && (email || '').trim().length <= 254;
}

export function isValidPhone(phone: string): boolean {
  const digits = (phone || '').replace(/\D/g, '');
  return PHONE_RE.test(phone || '') && digits.length >= 10 && digits.length <= 15;
}

export function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

/** Indian phone numbers get a +91 prefix for Razorpay (it wants E.164-ish). */
export function normalizePhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function cleanText(value: string | undefined | null, max = 4000): string {
  return (value || '').replace(/\u0000/g, '').trim().slice(0, max);
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

/** Parse "₹199" / "199" / "199.50" (rupees) into integer paise. */
export function rupeesToPaise(value: unknown): number {
  const s = String(value ?? '').replace(/[^0-9.]/g, '');
  if (!s) return 0;
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Alias kept for readability at call sites. */
export const toPaise = rupeesToPaise;
