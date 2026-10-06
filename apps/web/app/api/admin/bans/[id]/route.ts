import { z } from 'zod';
import { adminRoute, pgError } from '@/lib/admin/api';
import { apiError, json } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/admin/bans/:id?kind=ip|device: lift a ban. Admins only. */
export const DELETE = adminRoute<Ctx>(
  'bans.lift',
  async (req, staff, { params }) => {
    const { id } = await params;
    const kind = req.nextUrl.searchParams.get('kind');
    if (kind === 'device') {
      if (!/^[0-9a-f]{16,128}$|^[\w-]{1,128}$/i.test(id))
        return apiError(422, 'invalid', 'Not a device id.');
      const { error } = await staff.sb.from('device_bans').delete().eq('device_hash', id);
      return pgError(error) ?? json({ ok: true });
    }
    if (!z.uuid().safeParse(id).success) return apiError(422, 'invalid', 'Not a ban id.');
    const { error } = await staff.sb.from('ip_bans').delete().eq('id', id);
    return pgError(error) ?? json({ ok: true });
  },
  ['admin'],
);
