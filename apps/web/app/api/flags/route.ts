import type { NextRequest } from 'next/server';
import { FlagInput, fieldErrors } from '@rmmm/api';
import { apiError, handler, json, readJson, sameOrigin } from '@/lib/api';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/flags: a signed-in member reports content (Apple 1.2, SPEC 10.7). Written with
 * the member's own session, so RLS checks who they are and that they are not banned. The
 * 24-hour clock is set by Postgres.
 */
export const POST = handler('flags.create', async (req: NextRequest) => {
  if (!sameOrigin(req)) return apiError(403, 'forbidden', 'Request refused.');
  const sb = await supabaseServer();
  const user = sb ? (await sb.auth.getUser()).data.user : null;
  if (!sb || !user) return apiError(401, 'unauthorized', 'Sign in to report content.');
  const parsed = FlagInput.safeParse(await readJson(req));
  if (!parsed.success) return apiError(422, 'invalid', 'Pick a reason.', fieldErrors(parsed.error));
  const f = parsed.data;
  const { error } = await sb.from('content_flags').insert({
    target_type: f.targetType,
    target_id: f.targetId,
    reason: f.reason,
    details: f.details || null,
    reporter_id: user.id,
  });
  if (error) {
    if (error.code === '42501') return apiError(403, 'forbidden', 'Request refused.');
    throw new Error(`flag insert: ${error.code}`);
  }
  return json({ ok: true }, 201);
});
