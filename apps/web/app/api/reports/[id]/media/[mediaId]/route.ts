import type { NextRequest } from 'next/server';
import { apiError, handler, json, sameOrigin } from '@/lib/api';
import { db, q } from '@/lib/server/db';
import { editable, reportAccess } from '@/lib/server/report-access';
import type { MediaRow } from '@/lib/server/reports';
import { deleteObject } from '@/lib/server/storage';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string; mediaId: string }> };

/** DELETE /api/reports/:id/media/:mediaId: remove a file from a draft (row and object). */
export const DELETE = handler<Ctx>('reports.media.delete', async (req: NextRequest, { params }) => {
  if (!sameOrigin(req)) return apiError(403, 'forbidden', 'Request refused.');
  const { id, mediaId } = await params;
  const access = await reportAccess(req, id);
  if (!access || !/^[0-9a-f-]{36}$/.test(mediaId))
    return apiError(404, 'not_found', 'That file was not found.');
  if (!editable(access.report.status))
    return apiError(409, 'conflict', 'This report was already sent.');
  const [row] = await db.select<MediaRow>(
    'media',
    `id=eq.${q(mediaId)}&report_id=eq.${q(id)}&select=id,storage_path`,
  );
  if (!row) return apiError(404, 'not_found', 'That file was not found.');
  await db.remove('media', `id=eq.${q(mediaId)}`);
  await deleteObject(row.storage_path).catch(() => undefined);
  return json({ ok: true });
});
