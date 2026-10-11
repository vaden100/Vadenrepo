import type { NextRequest } from 'next/server';
import { FLYER_MAX_BYTES, type FlyerResponse } from '@rmmm/api';
import { phash } from '@rmmm/media-hash';
import { apiError, handler, json, sameOrigin } from '@/lib/api';
import { db } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

const IMAGE = /^image\/(jpeg|png|webp)$/;

/**
 * POST /api/search/image (SPEC 8.3): flyer or screenshot check. The image is fingerprinted in
 * memory and discarded; it is never stored. Matches only evidence from reviewed reports.
 */
export const POST = handler('search.image', async (req: NextRequest) => {
  if (!sameOrigin(req)) return apiError(403, 'forbidden', 'Request refused.');
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (declared > FLYER_MAX_BYTES + 64 * 1024)
    return apiError(413, 'invalid', 'Images can be 15 MB at most.', { file: 'too_large' });
  const form = await req.formData().catch(() => null);
  const file = form?.get('image');
  if (!(file instanceof Blob))
    return apiError(422, 'invalid', 'Choose an image.', { file: 'required' });
  if (file.size > FLYER_MAX_BYTES)
    return apiError(413, 'invalid', 'Images can be 15 MB at most.', { file: 'too_large' });
  if (!IMAGE.test(file.type))
    return apiError(422, 'invalid', 'Use a JPEG, PNG or WebP image.', { file: 'type' });
  let hash: string;
  try {
    hash = await phash(new Uint8Array(await file.arrayBuffer()));
  } catch {
    return apiError(422, 'invalid', 'That image could not be read.', { file: 'unreadable' });
  }
  return json(await db.rpc<FlyerResponse>('search_flyer', { query_phash: hash }));
});
