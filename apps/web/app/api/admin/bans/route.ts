import { AddIpBans, fieldErrors, isIpOrCidr } from '@rmmm/api';
import { adminRoute, pgError } from '@/lib/admin/api';
import { apiError, json, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** POST /api/admin/bans: add IP / CIDR bans in bulk (SPEC 11). Admins only. */
export const POST = adminRoute(
  'bans.add',
  async (req, staff) => {
    const parsed = AddIpBans.safeParse(await readJson(req, 32_000));
    if (!parsed.success)
      return apiError(422, 'invalid', 'Check the form.', fieldErrors(parsed.error));
    const { addresses, reason, days } = parsed.data;
    const bad = addresses.find((a) => !isIpOrCidr(a));
    if (bad)
      return apiError(422, 'invalid', `Not an IP address or range: ${bad}`, {
        addresses: 'invalid',
      });
    const expires = days ? new Date(Date.now() + days * 86_400_000).toISOString() : null;
    const { data, error } = await staff.sb
      .from('ip_bans')
      .insert(
        [...new Set(addresses)].map((cidr) => ({
          cidr,
          reason,
          expires_at: expires,
          created_by: staff.userId,
        })),
      )
      .select('id');
    if (pgError(error)) return pgError(error)!;
    return json({ added: data?.length ?? 0 }, 201);
  },
  ['admin'],
);
