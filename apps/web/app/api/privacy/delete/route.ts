import type { NextRequest } from 'next/server';
import { DeletionInput } from '@rmmm/api';
import { apiError, handler, json, readJson, requestId, sameOrigin } from '@/lib/api';
import { log } from '@/lib/log';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/privacy/delete (SPEC 9, 12; WBS 104). Signed-in users only: the session is the
 * verification. Inserted with the user's own session, so RLS enforces user_id = auth.uid().
 */
export const POST = handler('privacy.delete', async (req: NextRequest) => {
  if (!sameOrigin(req)) return apiError(403, 'forbidden', 'Request refused.');
  if (!DeletionInput.safeParse(await readJson(req, 1024)).success) {
    return apiError(422, 'invalid', 'Confirm that you understand this cannot be undone.', {
      confirm: 'required',
    });
  }
  const supabase = await supabaseServer();
  if (!supabase)
    return apiError(
      503,
      'unavailable',
      'Deletion requests cannot be taken right now. Contact us instead.',
    );
  const { data } = await supabase.auth.getUser();
  if (!data.user) return apiError(401, 'unauthorized', 'Sign in to request deletion.');

  const { error } = await supabase.from('deletion_requests').insert({ user_id: data.user.id });
  if (error?.code === '23505')
    return apiError(409, 'conflict', 'You already have a deletion request in progress.');
  if (error) throw new Error(error.message);
  log('info', 'privacy.delete.requested', { requestId: requestId(req) });
  return json({ ok: true }, 201);
});
