import { NextResponse } from 'next/server';
import { adminRoute, pgError } from '@/lib/admin/api';
import { apiError } from '@/lib/api';
import { readObject } from '@/lib/server/storage';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/media/:id[?copy=covered]: stream an evidence file to staff. Access is
 * checked with the staff member's own session (RLS on media); bytes come from private
 * storage. Served inline, never cached, sandboxed so a file cannot run script.
 */
export const GET = adminRoute<Ctx>('media.view', async (req, staff, { params }) => {
  const { id } = await params;
  const { data: m, error } = await staff.sb
    .from('media')
    .select('id, storage_path, redacted_path, mime, upload_status')
    .eq('id', id)
    .maybeSingle();
  if (pgError(error)) return pgError(error)!;
  if (!m) return apiError(404, 'not_found', 'Not found.');
  const covered = req.nextUrl.searchParams.get('copy') === 'covered';
  const key = covered ? m.redacted_path : m.storage_path;
  if (!key) return apiError(404, 'not_found', 'Not found.');
  const bytes = await readObject(key);
  if (!bytes) return apiError(404, 'not_found', 'File not found in storage.');
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'content-type': covered ? 'image/jpeg' : (m.mime ?? 'application/octet-stream'),
      'content-length': String(bytes.length),
      'content-disposition': 'inline',
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "sandbox; default-src 'none'; img-src 'self'; media-src 'self'",
    },
  });
});
