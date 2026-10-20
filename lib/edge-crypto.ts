/**
 * edge-crypto.ts — WebCrypto versions of the signing helpers.
 *
 * Next.js middleware runs on the Edge runtime, where Node's `crypto` module is
 * not available. These functions produce byte-identical HMAC-SHA256 output to
 * lib/crypto.ts, so a session cookie signed on the server verifies in
 * middleware and vice versa.
 */

import { config } from './config';

const enc = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Same output as lib/crypto.ts `sign()`. */
export async function edgeSign(payload: string): Promise<string> {
  const secret = config.appSecret || 'studypalace-dev-secret';
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return toHex(sig);
}

/** Same logic as lib/crypto.ts `unseal()`, but async because WebCrypto is. */
export async function edgeUnseal(sealed: string | undefined | null): Promise<string | null> {
  if (!sealed) return null;
  const parts = sealed.split('.');
  if (parts.length !== 3) return null;
  const [body, expStr] = parts;
  const expected = await edgeSign(`${body}.${expStr}`);

  const given = parts[2] || '';
  if (given.length !== expected.length) return null;
  // constant-time-ish comparison
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  if (diff !== 0) return null;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;

  try {
    const json = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json?.v === 'string' ? json.v : null;
  } catch {
    return null;
  }
}

/** True when the request carries a valid admin session cookie. */
export async function hasAdminSession(req: Request): Promise<boolean> {
  const header = req.headers.get('cookie');
  if (!header) return false;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === config.admin.cookieName) {
      return (await edgeUnseal(part.slice(idx + 1).trim())) === 'admin';
    }
  }
  return false;
}
