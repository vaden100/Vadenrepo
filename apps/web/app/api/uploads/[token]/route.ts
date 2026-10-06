import type { NextRequest } from 'next/server';
import { apiError, handler, json } from '@/lib/api';
import { storageDriver, verifyLocalToken, writeLocalObject } from '@/lib/server/storage';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ token: string }> };

/**
 * PUT /api/uploads/:token: the local storage driver's stand-in for a signed storage URL
 * (development and E2E only). The HMAC token names one object, its size cap and expiry.
 */
export const PUT = handler<Ctx>('uploads.put', async (req: NextRequest, { params }) => {
  if (storageDriver() !== 'local') return apiError(404, 'not_found', 'Not found.');
  const t = verifyLocalToken((await params).token);
  if (!t) return apiError(403, 'forbidden', 'This upload link expired. Try again.');
  const declared = Number(req.headers.get('content-length') ?? 'NaN');
  if (Number.isFinite(declared) && declared > t.m)
    return apiError(413, 'invalid', 'That file is too large.');
  const data = new Uint8Array(await req.arrayBuffer());
  if (data.byteLength > t.m) return apiError(413, 'invalid', 'That file is too large.');
  // The proxy buffers bodies up to a limit and silently truncates past it.
  if (Number.isFinite(declared) && data.byteLength !== declared) {
    return apiError(400, 'bad_request', 'The upload was cut short. Try again.');
  }
  await writeLocalObject(t.k, data);
  return json({ ok: true });
});
