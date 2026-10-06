import type { NextRequest } from 'next/server';
import { MEDIA_RULES } from '@rmmm/api';
import { apiError, handler, json, sameOrigin } from '@/lib/api';
import { db, q } from '@/lib/server/db';
import { reportAccess } from '@/lib/server/report-access';
import { mediaView, type MediaRow } from '@/lib/server/reports';
import { deleteObject, objectExists } from '@/lib/server/storage';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string; mediaId: string }> };

/**
 * POST /api/reports/:id/media/:mediaId/complete: the browser finished uploading. We confirm
 * the object exists and fits the limit, then queue it for the worker (EXIF strip, scan).
 */
export const POST = handler<Ctx>('reports.media.complete', async (req: NextRequest, { params }) => {
  if (!sameOrigin(req)) return apiError(403, 'forbidden', 'Request refused.');
  const { id, mediaId } = await params;
  const access = await reportAccess(req, id);
  if (!access || !/^[0-9a-f-]{36}$/.test(mediaId))
    return apiError(404, 'not_found', 'That file was not found.');
  const [row] = await db.select<MediaRow>(
    'media',
    `id=eq.${q(mediaId)}&report_id=eq.${q(id)}&select=*`,
  );
  if (!row) return apiError(404, 'not_found', 'That file was not found.');
  if (row.upload_status !== 'awaiting_upload') return json({ media: mediaView(row) });

  const size = await objectExists(row.storage_path);
  if (size === null) return apiError(409, 'conflict', 'The upload did not finish. Try again.');
  if (size > MEDIA_RULES[row.kind].maxBytes) {
    await deleteObject(row.storage_path).catch(() => undefined);
    const [rejected] = await db.update<MediaRow>('media', `id=eq.${q(mediaId)}`, {
      upload_status: 'rejected',
      reject_reason: 'too_large',
    });
    return json({ media: mediaView(rejected ?? row) });
  }
  const [updated] = await db.update<MediaRow>(
    'media',
    `id=eq.${q(mediaId)}&upload_status=eq.awaiting_upload`,
    { upload_status: 'uploaded', bytes: size || row.bytes },
  );
  return json({ media: mediaView(updated ?? row) });
});
