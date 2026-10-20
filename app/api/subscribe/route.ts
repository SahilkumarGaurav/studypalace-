import { NextResponse } from 'next/server';
import { addSubscriber, logEvent } from '@/lib/repo';
import { isValidEmail, normalizeEmail } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/subscribe — newsletter / free-sample signup. */
export async function POST(req: Request) {
  let body: { email?: string; source?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = normalizeEmail(String(body.email || ''));
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const added = addSubscriber(email, String(body.source || 'web').slice(0, 40));
  if (added) logEvent('newsletter.signup', undefined, undefined, email);

  return NextResponse.json({
    ok: true,
    already: !added,
    message: added
      ? 'You are in. The free GAT sample PDF is on its way to your inbox.'
      : 'You are already subscribed.',
  });
}
