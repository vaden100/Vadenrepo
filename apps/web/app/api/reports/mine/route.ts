import type { NextRequest } from 'next/server';
import { apiError, handler, json } from '@/lib/api';
import { db, q } from '@/lib/server/db';
import type { ReportRow } from '@/lib/server/report-access';
import { statusView } from '@/lib/server/reports';
import { caller } from '@/lib/server/caller';

export const dynamic = 'force-dynamic';

/** GET /api/reports/mine: the signed-in member's sent reports, newest first. */
export const GET = handler('reports.mine', async (req: NextRequest) => {
  const who = await caller(req);
  if (!who) return apiError(401, 'unauthorized', 'Sign in to see your reports.');
  const rows = await db.select<ReportRow>(
    'reports',
    `reporter_id=eq.${q(who.userId)}&status=neq.draft&select=*&order=submitted_at.desc&limit=50`,
  );
  return json({ reports: await Promise.all(rows.map(statusView)) });
});
