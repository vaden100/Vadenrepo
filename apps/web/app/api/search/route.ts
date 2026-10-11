import type { NextRequest } from 'next/server';
import { SEARCH_MAX_LENGTH } from '@rmmm/api';
import { apiError, handler, json } from '@/lib/api';
import { searchEverything } from '@/lib/server/search';

export const dynamic = 'force-dynamic';

/** GET /api/search?q= (SPEC 9): rate limited to 30/min/IP by the proxy. */
export const GET = handler('search', async (req: NextRequest) => {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  if (!q) return apiError(422, 'invalid', 'Type something to search for.', { q: 'required' });
  if (q.length > SEARCH_MAX_LENGTH)
    return apiError(422, 'invalid', 'That is too long to search for.', { q: 'too_long' });
  return json(await searchEverything(q));
});
