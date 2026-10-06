import { BanSource, fieldErrors } from '@rmmm/api';
import { adminRoute, pgError } from '@/lib/admin/api';
import { apiError, json, readJson } from '@/lib/api';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/reports/:id/ban: ban the IP address and device a report came from
 * (SPEC 11 shortcut). Admins only; the address itself never leaves Postgres.
 */
export const POST = adminRoute<Ctx>(
  'reports.ban',
  async (req, staff, { params }) => {
    const { id } = await params;
    const parsed = BanSource.safeParse(await readJson(req));
    if (!parsed.success)
      return apiError(422, 'invalid', 'Give a reason.', fieldErrors(parsed.error));
    const days = parsed.data.duration === 'forever' ? null : Number(parsed.data.duration);
    const { data, error } = await staff.sb.rpc('ban_report_source', {
      report: id,
      reason: parsed.data.reason,
      days,
    });
    const refused = pgError(error);
    if (refused) return refused;
    log('info', 'admin.report_source_banned', { report: id, by: staff.userId });
    return json(data as { ip: boolean; device: boolean; ipKnown: boolean; deviceKnown: boolean });
  },
  ['admin'],
);
