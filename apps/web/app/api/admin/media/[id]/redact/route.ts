import sharp from 'sharp';
import { RedactRequest, fieldErrors } from '@rmmm/api';
import { adminRoute, pgError } from '@/lib/admin/api';
import { apiError, json, readJson } from '@/lib/api';
import { readObject, writeObject } from '@/lib/server/storage';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/media/:id/redact: staff cover details in an image (SPEC 10.3). The
 * original stays private as evidence; the covered copy is what can ever be published.
 */
export const POST = adminRoute<Ctx>(
  'media.redact',
  async (req, staff, { params }) => {
    const { id } = await params;
    const parsed = RedactRequest.safeParse(await readJson(req));
    if (!parsed.success)
      return apiError(422, 'invalid', 'Check the boxes.', fieldErrors(parsed.error));
    const { data: m, error } = await staff.sb
      .from('media')
      .select('id, kind, storage_path, upload_status')
      .eq('id', id)
      .maybeSingle();
    if (pgError(error)) return pgError(error)!;
    if (!m) return apiError(404, 'not_found', 'Not found.');
    if (m.kind !== 'image' || m.upload_status !== 'ready')
      return apiError(422, 'invalid', 'Only cleaned images can be covered.');
    const original = await readObject(m.storage_path);
    if (!original) return apiError(404, 'not_found', 'File not found in storage.');

    const upright = await sharp(original, { limitInputPixels: 80_000_000 })
      .rotate()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { width, height, channels } = upright.info;
    const clamp = (v: number, max: number) => Math.min(Math.max(Math.round(v), 0), max);
    const rects = parsed.data.boxes
      .map((b) => {
        const left = clamp(b.x * width, width - 1);
        const top = clamp(b.y * height, height - 1);
        return {
          left,
          top,
          w: clamp(b.w * width, width - left),
          h: clamp(b.h * height, height - top),
        };
      })
      .filter((r) => r.w > 0 && r.h > 0);
    const out = await sharp(upright.data, { raw: { width, height, channels } })
      .composite(
        rects.map((r) => ({
          input: {
            create: {
              width: r.w,
              height: r.h,
              channels: 4 as const,
              background: { r: 0, g: 0, b: 0, alpha: 1 },
            },
          },
          left: r.left,
          top: r.top,
        })),
      )
      .jpeg({ quality: 90 })
      .toBuffer();
    const key = m.storage_path.replace(/\.[a-z0-9]+$/i, '') + '.covered.jpg';
    await writeObject(key, out, 'image/jpeg');
    const { error: uErr } = await staff.sb
      .from('media')
      .update({ redacted_path: key })
      .eq('id', id);
    if (pgError(uErr)) return pgError(uErr)!;
    return json({ ok: true });
  },
  ['moderator', 'admin'],
);
