import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { clientIp, clearFailedLogins, makeSessionCookie, rateLimitLogin, registerFailedLogin, verifyCredentials } from '@/lib/auth';
import { logEvent } from '@/lib/repo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/admin/login — only you can reach /admin. */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimitLogin(ip);
  if (limited.blocked) {
    return NextResponse.json(
      {
        error: `Too many failed attempts. Try again in ${Math.ceil(limited.retryAfterSeconds / 60)} minute(s).`,
      },
      { status: 429 },
    );
  }

  let body: { email?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = String(body.email || '');
  const password = String(body.password || '');

  if (!email || !password) {
    return NextResponse.json({ error: 'Enter both your email and password.' }, { status: 400 });
  }

  if (!verifyCredentials(email, password)) {
    registerFailedLogin(ip);
    logEvent('admin.login_failed', undefined, undefined, `${email} from ${ip}`);
    return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
  }

  clearFailedLogins(ip);
  logEvent('admin.login', undefined, undefined, `${config.admin.email} from ${ip}`);

  const session = makeSessionCookie();
  const res = NextResponse.json({ ok: true, redirect: '/admin' });
  res.cookies.set(session.name, session.value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    path: '/',
    maxAge: session.maxAge,
  });
  return res;
}

/** GET /api/admin/login — tell the client whether it is already authenticated. */
export async function GET() {
  return NextResponse.json({ ok: true, email: config.admin.email, isTest: !config.isProd });
}
