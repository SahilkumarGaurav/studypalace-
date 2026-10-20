import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { config } from './config';

function secret(): string {
  return config.appSecret || 'studypalace-dev-secret';
}

/** Stable HMAC-SHA256 signature (hex) for any string. */
export function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('hex');
}

/** Constant-time comparison of two signature strings. */
export function verifySignature(payload: string, signature: string): boolean {
  if (!signature) return false;
  const expected = Buffer.from(sign(payload), 'hex');
  const given = Buffer.from(signature, 'hex');
  if (expected.length !== given.length) return false;
  try {
    return timingSafeEqual(expected, given);
  } catch {
    return false;
  }
}

/** Raw HMAC used to verify Razorpay webhook bodies (compares base64/hex digests). */
export function hmacHex(key: string, body: string): string {
  return createHmac('sha256', key).update(body, 'utf8').digest('hex');
}

/** Razorpay sends the signature as hex of HMAC_SHA256(secret, rawBody). */
export function verifyRazorpaySignature(
  rawBody: string,
  signature: string,
  keySecret: string,
): boolean {
  const expected = hmacHex(keySecret, rawBody);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Random, URL-safe token (used for download links + order ids). */
export function token(bytes = 24): string {
  return randomBytes(bytes).toString('base64url');
}

export function uuid(): string {
  return randomUUID();
}

/** Short, human-readable order number, e.g. SP-7K3FQ2 */
export function orderNumber(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  const buf = randomBytes(6);
  for (let i = 0; i < 6; i++) out += alphabet[buf[i] % alphabet.length];
  return `SP-${out}`;
}

/**
 * Signed, expiring value. Format: base64url(payload).expiry.signature
 * Used for the admin session cookie so it survives restarts and cannot be forged.
 */
export function seal(value: string, ttlSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = Buffer.from(JSON.stringify({ v: value, e: exp }), 'utf8').toString('base64url');
  return `${body}.${exp}.${sign(`${body}.${exp}`)}`;
}

export function unseal(sealed: string | undefined | null): string | null {
  if (!sealed) return null;
  const parts = sealed.split('.');
  if (parts.length !== 3) return null;
  const [body, expStr, sig] = parts;
  if (!verifySignature(`${body}.${expStr}`, sig)) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return typeof parsed?.v === 'string' ? parsed.v : null;
  } catch {
    return null;
  }
}

/** Keyed sha256 hex of a string — used for integrity checks, never for passwords. */
export function sha256(value: string): string {
  return createHmac('sha256', secret()).update(value, 'utf8').digest('hex');
}

/** Deterministic slug from any text. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
