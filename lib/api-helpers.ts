import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';

/** Every /api/admin/* route calls this first. No cookie, no access. */
export function requireAdmin(req: Request): NextResponse | null {
  if (isAdminRequest(req)) return null;
  return NextResponse.json({ error: 'Not authenticated. Please sign in to the admin panel.' }, { status: 401 });
}

/** Read a multipart form; returns null if the body was not multipart. */
export async function readForm(req: Request): Promise<FormData | null> {
  try {
    return await req.formData();
  } catch {
    return null;
  }
}

export function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

export function int(form: FormData, key: string, fallback = 0): number {
  const v = form.get(key);
  const n = Number(typeof v === 'string' ? v.trim() : v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

export function flag(form: FormData, key: string): number {
  const v = form.get(key);
  if (v === null) return 0;
  const s = String(v).toLowerCase();
  return ['1', 'true', 'on', 'yes'].includes(s) ? 1 : 0;
}

export function fileOf(form: FormData, key: string): File | null {
  const v = form.get(key);
  return v instanceof File && v.size > 0 ? v : null;
}
