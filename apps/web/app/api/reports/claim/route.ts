import type { NextRequest } from 'next/server';
import { ClaimInput } from '@rmmm/api';
import { apiError, handler, json, readJson, sameOrigin } from '@/lib/api';
import { serverEnv } from '@/lib/env';
import { sha256Hex } from '@/lib/security/client';
import { db, q } from '@/lib/server/db';
import {
  CLAIM_COOKIE,
  parsePair,
  setOwnerCookie,
  type ReportRow,
} from '@/lib/server/report-access';
import { statusView } from '@/lib/server/reports';

export const dynamic = 'force-dynamic';

const generic = () =>
  apiError(404, 'not_found', 'That case code and claim code do not match a report.');

/**
 * POST /api/reports/claim: an anonymous reporter checks their report with case code + claim
 * code (SPEC 4.1). Same answer for a wrong code and an unknown case (no existence leak).
 * Rate limited to 10/hour/IP by the proxy.
 */
export const POST = handler('reports.claim', async (req: NextRequest) => {
  if (!sameOrigin(req)) return apiError(403, 'forbidden', 'Request refused.');
  const parsed = ClaimInput.safeParse(await readJson(req));
  if (!parsed.success)
    return apiError(422, 'invalid', 'Check the codes and try again.', { code: 'format' });
  const { code, claim } = parsed.data;
  const [row] = await db.select<ReportRow>('reports', `public_code=eq.${q(code)}&select=*`);
  if (!row?.anon_claim_hash || row.anon_claim_hash !== (await sha256Hex(`claim:${claim}`)))
    return generic();
  const res = json(await statusView(row));
  setOwnerCookie(res, req, CLAIM_COOKIE, `${row.id}.${claim}`, 30);
  return res;
});

/** GET /api/reports/claim: status for the claim saved in this browser ({ report: null } if none). */
export const GET = handler('reports.claim.status', async (req: NextRequest) => {
  const pair = parsePair(req.cookies.get(CLAIM_COOKIE)?.value);
  const env = serverEnv();
  if (!pair || !env.supabaseUrl || !env.serviceRoleKey) return json({ report: null });
  const [row] = await db.select<ReportRow>('reports', `id=eq.${q(pair.id)}&select=*`);
  if (!row?.anon_claim_hash || row.anon_claim_hash !== (await sha256Hex(`claim:${pair.token}`))) {
    return json({ report: null });
  }
  return json({ report: await statusView(row) });
});
