import { ResolveFlag, fieldErrors } from '@rmmm/api';
import { adminRoute, pgError } from '@/lib/admin/api';
import { apiError, json, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/flags/:id: resolve within the 24-hour SLA (SPEC 10.7). */
export const PATCH = adminRoute<Ctx>(
  'flags.resolve',
  async (req, staff, { params }) => {
    const { id } = await params;
    const parsed = ResolveFlag.safeParse(await readJson(req));
    if (!parsed.success)
      return apiError(422, 'invalid', 'Pick what you did.', fieldErrors(parsed.error));
    const { data, error } = await staff.sb
      .from('content_flags')
      .update({
        action: parsed.data.action,
        resolution: parsed.data.resolution || null,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .is('resolved_at', null)
      .select('id');
    if (pgError(error)) return pgError(error)!;
    return data?.length ? json({ ok: true }) : apiError(409, 'conflict', 'Already resolved.');
  },
  ['moderator', 'admin'],
);
