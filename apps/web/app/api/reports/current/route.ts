import type { NextRequest } from 'next/server';
import type { CurrentDraft } from '@rmmm/api';
import { handler, json } from '@/lib/api';
import { serverEnv } from '@/lib/env';
import { db, q } from '@/lib/server/db';
import { draftPair, reportAccess, type ReportRow } from '@/lib/server/report-access';
import { draftView } from '@/lib/server/reports';
import { caller } from '@/lib/server/caller';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/current: the draft to resume (this browser's cookie, else the member's
 * latest). "Nothing to resume" is a normal answer, not an error.
 */
export const GET = handler('reports.current', async (req: NextRequest) => {
  const env = serverEnv();
  if (!env.supabaseUrl || !env.serviceRoleKey)
    return json<CurrentDraft>({ available: false, draft: null });
  const cookie = draftPair(req);
  if (cookie) {
    const access = await reportAccess(req, cookie.id);
    if (access?.report.status === 'draft')
      return json<CurrentDraft>({ available: true, draft: await draftView(access.report) });
  }
  const who = await caller(req);
  if (who) {
    const [row] = await db.select<ReportRow>(
      'reports',
      `reporter_id=eq.${q(who.userId)}&status=eq.draft&select=*&order=updated_at.desc&limit=1`,
    );
    if (row) return json<CurrentDraft>({ available: true, draft: await draftView(row) });
  }
  return json<CurrentDraft>({ available: true, draft: null });
});
