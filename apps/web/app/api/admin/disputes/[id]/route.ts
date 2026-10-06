import { UpdateDispute, fieldErrors } from '@rmmm/api';
import { adminRoute, pgError } from '@/lib/admin/api';
import { apiError, json, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/disputes/:id: review and log the outcome (SPEC 10.6). */
export const PATCH = adminRoute<Ctx>('disputes.update', async (req, staff, { params }) => {
  const { id } = await params;
  const parsed = UpdateDispute.safeParse(await readJson(req, 32_000));
  if (!parsed.success)
    return apiError(422, 'invalid', 'Pick an outcome.', fieldErrors(parsed.error));
  const d = parsed.data;
  const patch: Record<string, unknown> = { status: d.status, reviewed_by: staff.userId };
  if (d.staffNote !== undefined) patch.staff_note = d.staffNote || null;
  if (d.status === 'resolved')
    Object.assign(patch, { outcome: d.outcome, resolved_at: new Date().toISOString() });
  const { data, error } = await staff.sb.from('disputes').update(patch).eq('id', id).select('id');
  if (pgError(error)) return pgError(error)!;
  return data?.length ? json({ ok: true }) : apiError(404, 'not_found', 'Not found.');
});
