import type { NextRequest } from 'next/server';
import type { CurrentDraft } from '@rmmm/api';
import { handler, json } from '@/lib/api';
import { serverEnv } from '@/lib/env';
import { db, q } from '@/lib/server/db';
import { DRAFT_COOKIE, parsePair, reportAccess, type ReportRow } from '@/lib/server/report-access';
import { draftView } from '@/lib/server/reports';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/current: the draft to resume (this browser's cookie, else the member's
 * latest). "Nothing to resume" is a normal answer, not an error.
 */
export const GET = handler('reports.current', async (req: NextRequest) => {
  const env = serverEnv();
  if (!env.supabaseUrl || !env.serviceRoleKey)
    return json<CurrentDraft>({ available: false, draft: null });
  const cookie = parsePair(req.cookies.get(DRAFT_COOKIE)?.value);
  if (cookie) {
    const access = await reportAccess(req, cookie.id);
    if (access?.report.status === 'draft')
      return json<CurrentDraft>({ available: true, draft: await draftView(access.report) });
  }
  const session = await getSession();
  if (session) {
    const [row] = await db.select<ReportRow>(
      'reports',
      `reporter_id=eq.${q(session.user.id)}&status=eq.draft&select=*&order=updated_at.desc&limit=1`,
    );
    if (row) return json<CurrentDraft>({ available: true, draft: await draftView(row) });
  }
  return json<CurrentDraft>({ available: true, draft: null });
});
