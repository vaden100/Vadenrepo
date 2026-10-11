import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, handler, json, readJson, sameOrigin } from '@/lib/api';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ slug: string }> };
const Body = z.object({ statement: z.string().trim().min(20).max(2000) }).strict();

/** POST /api/entities/:slug/reply (SPEC 9): verified business rep only, checked in Postgres. */
export const POST = handler<Ctx>('entities.reply', async (req: NextRequest, { params }) => {
  if (!sameOrigin(req)) return apiError(403, 'forbidden', 'Request refused.');
  const sb = await supabaseServer();
  const user = sb ? (await sb.auth.getUser()).data.user : null;
  if (!sb || !user) return apiError(401, 'unauthorized', 'Sign in first.');
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success)
    return apiError(422, 'invalid', 'Write 20 to 2,000 characters.', { statement: 'length' });
  const { error } = await sb.rpc('post_entity_reply', {
    entity_slug: (await params).slug,
    statement: parsed.data.statement,
  });
  if (error?.code === '42501')
    return apiError(403, 'forbidden', 'Only the verified business can post a response.');
  if (error) throw new Error(`reply: ${error.code}`);
  return json({ ok: true });
});
