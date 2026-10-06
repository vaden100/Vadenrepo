import type { NextRequest } from 'next/server';
import { DisputeInput, fieldErrors } from '@rmmm/api';
import { apiError, handler, json, readJson, requestId, sameOrigin } from '@/lib/api';
import { serverEnv } from '@/lib/env';
import { log } from '@/lib/log';
import { clientIp } from '@/lib/security/client';
import { verifyTurnstile } from '@/lib/security/turnstile';
import { db, q } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/disputes: a business answers what is published about it (SPEC 10.6). Only
 * public entities can be disputed (others do not exist publicly). Staff review within 7 days.
 */
export const POST = handler('disputes.create', async (req: NextRequest) => {
  if (!sameOrigin(req)) return apiError(403, 'forbidden', 'Request refused.');
  const parsed = DisputeInput.safeParse(await readJson(req, 32_000));
  if (!parsed.success)
    return apiError(422, 'invalid', 'Some fields need attention.', fieldErrors(parsed.error));
  const d = parsed.data;
  if (
    !(await verifyTurnstile(d.turnstileToken, clientIp(req.headers, serverEnv().clientIpHeader)))
  ) {
    return apiError(400, 'invalid', 'The verification check did not pass. Try again.', {
      turnstileToken: 'failed',
    });
  }
  const [entity] = await db.select<{ id: string }>(
    'entities',
    `slug=eq.${q(d.entitySlug)}&is_public=eq.true&select=id`,
  );
  if (!entity) return apiError(404, 'not_found', 'That page was not found.');
  const [row] = await db.insert<{ id: string }>(
    'disputes',
    { entity_id: entity.id, contact_name: d.name, contact_email: d.email, body: d.body },
    'id',
  );
  log('info', 'dispute.received', { requestId: requestId(req) });
  return json({ ok: true, ref: row?.id.slice(0, 8).toUpperCase() }, 201);
});
