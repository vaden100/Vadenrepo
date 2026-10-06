import { AccountBan, fieldErrors } from '@rmmm/api';
import { adminRoute, pgError } from '@/lib/admin/api';
import { apiError, json, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** POST /api/admin/accounts: ban or unban an account (profiles.banned_at). Admins only. */
export const POST = adminRoute(
  'accounts.ban',
  async (req, staff) => {
    const parsed = AccountBan.safeParse(await readJson(req));
    if (!parsed.success)
      return apiError(422, 'invalid', 'Check the form.', fieldErrors(parsed.error));
    const { userId, reason, banned } = parsed.data;
    if (userId === staff.userId) return apiError(422, 'invalid', 'You cannot ban yourself.');
    const { data, error } = await staff.sb
      .from('profiles')
      .update({
        banned_at: banned ? new Date().toISOString() : null,
        ban_reason: banned ? reason || null : null,
      })
      .eq('id', userId)
      .select('id');
    if (pgError(error)) return pgError(error)!;
    return data?.length
      ? json({ ok: true })
      : apiError(404, 'not_found', 'No account with that id.');
  },
  ['admin'],
);
