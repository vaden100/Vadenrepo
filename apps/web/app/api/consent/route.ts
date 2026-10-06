import type { NextRequest } from 'next/server';
import { ConsentInput } from '@rmmm/api';
import { apiError, handler, json, readJson, sameOrigin } from '@/lib/api';
import { CONSENT_COOKIE, CONSENT_VERSION, type ConsentState } from '@/lib/consent';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** POST /api/consent: stores privacy choices (cookie) and logs them for signed-in users. */
export const POST = handler('consent', async (req: NextRequest) => {
  if (!sameOrigin(req)) return apiError(403, 'forbidden', 'Request refused.');
  const parsed = ConsentInput.safeParse(await readJson(req, 1024));
  if (!parsed.success) return apiError(422, 'invalid', 'Choose on or off for each category.');

  const state: ConsentState = {
    version: CONSENT_VERSION,
    analytics: parsed.data.analytics,
    marketing: false,
    decidedAt: new Date().toISOString(),
  };

  const supabase = await supabaseServer();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user)
      await supabase.rpc('log_cookie_consent', {
        analytics: state.analytics,
        version: CONSENT_VERSION,
      });
  }

  const res = json({ ok: true, consent: state });
  res.cookies.set(CONSENT_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    secure: req.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
});
