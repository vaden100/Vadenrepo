import type { NextRequest } from 'next/server';
import { ClientErrorInput } from '@rmmm/api';
import { handler, json, readJson, requestId, sameOrigin } from '@/lib/api';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/** Browser error reports from error boundaries (WBS 42). Message + path only, no user data. */
export const POST = handler('client-errors', async (req: NextRequest) => {
  if (!sameOrigin(req)) return json({ ok: false }, 403);
  const parsed = ClientErrorInput.safeParse(await readJson(req, 2048));
  if (parsed.success) {
    const { message, digest, path } = parsed.data;
    log('warn', 'client.error', { requestId: requestId(req), error: message, digest, path });
  }
  return json({ ok: true }, 202);
});
