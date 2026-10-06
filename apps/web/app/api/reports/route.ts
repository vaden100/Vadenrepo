import type { NextRequest } from 'next/server';
import { ReportDraft } from '@rmmm/api';
import { apiError, handler, json, readJson, requestId, sameOrigin } from '@/lib/api';
import { log } from '@/lib/log';
import { sha256Hex } from '@/lib/security/client';
import { db } from '@/lib/server/db';
import { DRAFT_COOKIE, newToken, setOwnerCookie, type ReportRow } from '@/lib/server/report-access';
import { draftView } from '@/lib/server/reports';
import { DEVICE_HEADER } from '@/lib/security/client';
import { caller } from '@/lib/server/caller';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reports: start a draft (SPEC 4.1). Signed-in members own it by account; everyone
 * else by an httpOnly draft cookie whose token is stored only as a hash.
 */
export const POST = handler('reports.create', async (req: NextRequest) => {
  if (!sameOrigin(req)) return apiError(403, 'forbidden', 'Request refused.');
  const body = (await readJson(req)) ?? {};
  const parsed = ReportDraft.pick({ category: true }).safeParse(body);
  if (!parsed.success) return apiError(422, 'invalid', 'Some fields need attention.');

  const who = await caller(req);
  const member = who?.onboarded ? who.userId : null;
  const token = newToken();
  const [row] = await db.insert<ReportRow>('reports', {
    reporter_id: member,
    status: 'draft',
    step: 1,
    category: parsed.data.category ?? null,
    draft_token_hash: await sha256Hex(`draft:${token}`),
  });
  if (!row) throw new Error('draft insert returned nothing');
  log('info', 'report.draft_created', {
    requestId: requestId(req),
    mode: member ? 'account' : 'anonymous',
  });
  // The app keeps the token in its keychain; browsers only get the httpOnly cookie.
  const app = req.headers.has(DEVICE_HEADER);
  const view = await draftView(row);
  const res = json(app ? { ...view, draftToken: `${row.id}.${token}` } : view, 201);
  setOwnerCookie(res, req, DRAFT_COOKIE, `${row.id}.${token}`, 30);
  return res;
});
