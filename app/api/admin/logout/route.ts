import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/admin/logout */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(config.admin.cookieName, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return res;
}
