import type { NextRequest } from 'next/server';
import { ContactInput, fieldErrors } from '@rmmm/api';
import { apiError, handler, json, readJson, requestId, sameOrigin } from '@/lib/api';
import { serverEnv } from '@/lib/env';
import { log } from '@/lib/log';
import {
  clientIp,
  DEVICE_COOKIE,
  DEVICE_HEADER,
  deviceHash,
  sha256Hex,
} from '@/lib/security/client';
import { insertRows } from '@/lib/security/postgrest';
import { verifyTurnstile } from '@/lib/security/turnstile';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * POST /api/contact. Server-side validation (zod), honeypot, Turnstile when configured,
 * rate limit (proxy: 5/hour/IP), same-origin check. Stores via the service role; the client
 * gets a reference only after the database confirms the insert (WBS 147).
 */
export const POST = handler('contact', async (req: NextRequest) => {
  if (!sameOrigin(req)) return apiError(403, 'forbidden', 'Request refused.');
  const body = await readJson(req);
  if (body === undefined) return apiError(400, 'bad_request', 'The request could not be read.');

  const parsed = ContactInput.safeParse(body);
  if (!parsed.success) {
    const fields = fieldErrors(parsed.error);
    // Honeypot filled: a bot. Answer like a success without storing anything.
    if (fields.website && Object.keys(fields).length === 1) {
      log('info', 'contact.honeypot', { requestId: requestId(req) });
      return json({ ok: true, ref: 'RECEIVED' });
    }
    return apiError(422, 'invalid', 'Some fields need attention.', fields);
  }

  const env = serverEnv();
  const ip = clientIp(req.headers, env.clientIpHeader);
  if (!(await verifyTurnstile(parsed.data.turnstileToken, ip))) {
    return apiError(400, 'invalid', 'The verification check did not pass. Try again.', {
      turnstileToken: 'failed',
    });
  }
  if (!env.supabaseUrl || !env.serviceRoleKey) {
    log('error', 'contact.unconfigured', { requestId: requestId(req) });
    return apiError(503, 'unavailable', 'Messages cannot be sent right now. Email us instead.');
  }

  const session = await getSession();
  const app = req.headers.get(DEVICE_HEADER);
  const [row] = await insertRows<{ public_ref: string }>(
    env.supabaseUrl,
    env.serviceRoleKey,
    'contact_messages',
    {
      reason: parsed.data.reason,
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      user_id: session?.user.id ?? null,
      ip_hash: ip ? await sha256Hex(`ip:${ip}`) : null,
      device_hash: app
        ? await deviceHash('app', app)
        : await deviceHash('web', req.cookies.get(DEVICE_COOKIE)?.value),
    },
    'public_ref',
  );
  log('info', 'contact.received', { requestId: requestId(req), reason: parsed.data.reason });
  return json({ ok: true, ref: row?.public_ref }, 201);
});
