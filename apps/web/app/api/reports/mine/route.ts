import { apiError, handler, json } from '@/lib/api';
import { db, q } from '@/lib/server/db';
import type { ReportRow } from '@/lib/server/report-access';
import { statusView } from '@/lib/server/reports';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** GET /api/reports/mine: the signed-in member's sent reports, newest first. */
export const GET = handler('reports.mine', async () => {
  const session = await getSession();
  if (!session) return apiError(401, 'unauthorized', 'Sign in to see your reports.');
  const rows = await db.select<ReportRow>(
    'reports',
    `reporter_id=eq.${q(session.user.id)}&status=neq.draft&select=*&order=submitted_at.desc&limit=50`,
  );
  return json({ reports: await Promise.all(rows.map(statusView)) });
});
