import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { config } from './config';
import { seal, unseal } from './crypto';

/**
 * Admin authentication.
 *
 * There is exactly ONE admin — you. Credentials come from the environment
 * (ADMIN_EMAIL / ADMIN_PASSWORD). On first run the password is stored as a
 * bcrypt hash inside the process so comparisons are constant-time.
 *
 * The session is a signed, expiring cookie. It cannot be forged without
 * APP_SECRET and it never contains the password.
 */

let cachedHash: string | null = null;
function passwordHash(): string {
  if (!cachedHash) cachedHash = bcrypt.hashSync(config.admin.password, 10);
  return cachedHash;
}

/* ------------------------- login rate limiting ------------------------- */
const attempts = new Map<string, { count: number; blockedUntil: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function rateLimitLogin(key: string): { blocked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry) return { blocked: false, retryAfterSeconds: 0 };
  if (now > entry.blockedUntil) {
    attempts.delete(key);
    return { blocked: false, retryAfterSeconds: 0 };
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return { blocked: true, retryAfterSeconds: Math.ceil((entry.blockedUntil - now) / 1000) };
  }
  return { blocked: false, retryAfterSeconds: 0 };
}

export function registerFailedLogin(key: string) {
  const entry = attempts.get(key) || { count: 0, blockedUntil: Date.now() + WINDOW_MS };
  entry.count += 1;
  entry.blockedUntil = Date.now() + WINDOW_MS;
  attempts.set(key, entry);
}

export function clearFailedLogins(key: string) {
  attempts.delete(key);
}

/* ------------------------------ credentials ------------------------------ */

export function verifyCredentials(email: string, password: string): boolean {
  const emailOk =
    email.trim().toLowerCase() === config.admin.email ||
    email.trim().toLowerCase() === config.admin.email.split('@')[0];
  if (!emailOk) return false;
  try {
    return bcrypt.compareSync(password, passwordHash());
  } catch {
    return false;
  }
}

/* -------------------------------- session -------------------------------- */

export function makeSessionCookie(): { name: string; value: string; maxAge: number } {
  const maxAge = config.admin.sessionDays * 24 * 60 * 60;
  return {
    name: config.admin.cookieName,
    value: seal('admin', maxAge),
    maxAge,
  };
}

export function sessionValueFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map((p) => p.trim());
  for (const p of parts) {
    const idx = p.indexOf('=');
    if (idx < 0) continue;
    const name = p.slice(0, idx);
    if (name === config.admin.cookieName) return p.slice(idx + 1);
  }
  return null;
}

/** Server-side check for Server Components / route handlers. */
export async function isAdminLoggedIn(): Promise<boolean> {
  try {
    const store = await cookies();
    const raw = store.get(config.admin.cookieName)?.value;
    return unseal(raw) === 'admin';
  } catch {
    return false;
  }
}

/** Same check but from a raw Request (middleware-safe). */
export function isAdminRequest(req: NextRequest | Request): boolean {
  const header =
    'headers' in req && typeof req.headers?.get === 'function' ? req.headers.get('cookie') : null;
  return unseal(sessionValueFromCookieHeader(header)) === 'admin';
}

export function clientIp(req: Request): string {
  const h = req.headers;
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return h.get('x-real-ip') || 'unknown';
}

export function adminWarning(): string | null {
  if (!config.isProd) return null;
  if (config.admin.passwordIsDefault) {
    return 'ADMIN_PASSWORD is not set — the store is protected by the default password. Set it in your host’s environment variables NOW.';
  }
  return null;
}
