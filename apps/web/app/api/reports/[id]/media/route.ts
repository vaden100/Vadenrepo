import { randomUUID } from 'node:crypto';
import type { NextRequest } from 'next/server';
import {
  fieldErrors,
  kindForMime,
  MAX_FILES_PER_REPORT,
  MEDIA_RULES,
  MediaRequest,
  VIDEO_MAX_SECONDS,
  VOICE_NOTE_MAX_SECONDS,
} from '@rmmm/api';
import { apiError, handler, json, readJson, sameOrigin } from '@/lib/api';
import { db } from '@/lib/server/db';
import { editable, reportAccess } from '@/lib/server/report-access';
import { listMedia, mediaView, type MediaRow } from '@/lib/server/reports';
import { createSignedUpload, extForMime, objectKey } from '@/lib/server/storage';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/reports/:id/media: reserve an evidence slot and get a 5-minute signed upload URL
 * (SPEC 6, 11). Type and size are checked here and again by magic bytes in the worker.
 */
export const POST = handler<Ctx>('reports.media.create', async (req: NextRequest, { params }) => {
  if (!sameOrigin(req)) return apiError(403, 'forbidden', 'Request refused.');
  const access = await reportAccess(req, (await params).id);
  if (!access) return apiError(404, 'not_found', 'That report was not found.');
  if (!editable(access.report.status))
    return apiError(409, 'conflict', 'This report was already sent.');

  const parsed = MediaRequest.safeParse(await readJson(req));
  if (!parsed.success)
    return apiError(422, 'invalid', 'That file could not be added.', fieldErrors(parsed.error));
  const m = parsed.data;
  const mime = m.mime.toLowerCase().split(';')[0]!.trim();
  const kind = kindForMime(mime);
  if (!kind) return apiError(422, 'invalid', 'That file type is not accepted.', { mime: 'type' });
  if (m.bytes > MEDIA_RULES[kind].maxBytes)
    return apiError(422, 'invalid', 'That file is too large.', { bytes: 'too_large' });
  if (m.voiceNote && kind !== 'audio')
    return apiError(422, 'invalid', 'A voice note must be audio.', { mime: 'type' });
  if (m.durationSeconds !== undefined) {
    const max = kind === 'video' ? VIDEO_MAX_SECONDS : m.voiceNote ? VOICE_NOTE_MAX_SECONDS : null;
    if (max !== null && m.durationSeconds > max + 1) {
      return apiError(422, 'invalid', 'That recording is too long.', {
        durationSeconds: 'too_long',
      });
    }
  }

  const reportId = access.report.id;
  const existing = (await listMedia(reportId)).filter((x) => x.upload_status !== 'rejected');
  if (existing.length >= MAX_FILES_PER_REPORT) {
    return apiError(422, 'invalid', `A report can hold ${MAX_FILES_PER_REPORT} files.`, {
      files: 'too_many',
    });
  }

  const id = randomUUID();
  const key = objectKey(reportId, id, extForMime(mime));
  const [row] = await db.insert<MediaRow>('media', {
    id,
    report_id: reportId,
    kind,
    mime,
    bytes: m.bytes,
    storage_path: key,
    duration_ms: m.durationSeconds ? Math.round(m.durationSeconds * 1000) : null,
    voice_note: Boolean(m.voiceNote),
    reporter_redacted: Boolean(m.redacted),
  });
  if (!row) throw new Error('media insert returned nothing');
  const upload = await createSignedUpload(key, mime, MEDIA_RULES[kind].maxBytes, id);
  return json({ media: mediaView(row), upload }, 201);
});

/** GET /api/reports/:id/media: upload and processing status for each file. */
export const GET = handler<Ctx>('reports.media.list', async (req, { params }) => {
  const access = await reportAccess(req, (await params).id);
  if (!access) return apiError(404, 'not_found', 'That report was not found.');
  return json({ media: (await listMedia(access.report.id)).map(mediaView) });
});
