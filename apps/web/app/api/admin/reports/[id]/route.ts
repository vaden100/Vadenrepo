import { ModerateReport, fieldErrors } from '@rmmm/api';
import { adminRoute, pgError } from '@/lib/admin/api';
import { apiError, json, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const TO_STATUS = {
  triage: 'triage',
  request_evidence: 'needs_evidence',
  ready: 'ready_for_review',
  approve: 'approved',
  reject: 'rejected',
} as const;

/** PATCH /api/admin/reports/:id: move a report through the queue (SPEC 10.2, 10.3). */
export const PATCH = adminRoute<Ctx>(
  'reports.moderate',
  async (req, staff, { params }) => {
    const { id } = await params;
    const parsed = ModerateReport.safeParse(await readJson(req, 32_000));
    if (!parsed.success)
      return apiError(422, 'invalid', 'Check the form.', fieldErrors(parsed.error));
    const m = parsed.data;
    let patch: Record<string, unknown>;
    switch (m.action) {
      case 'note':
        patch = { staff_note: m.staffNote || null };
        break;
      case 'excerpt':
        patch = { public_excerpt: m.publicExcerpt || null };
        break;
      case 'request_evidence':
        patch = { status: TO_STATUS[m.action], evidence_request: m.evidenceRequest };
        break;
      case 'approve':
        patch = { status: 'approved', public_excerpt: m.publicExcerpt };
        break;
      case 'reject':
        patch = { status: 'rejected', rejected_reason: m.rejectedReason };
        break;
      default:
        patch = { status: TO_STATUS[m.action] };
    }
    const { data, error } = await staff.sb
      .from('reports')
      .update(patch)
      .eq('id', id)
      .select('id, status');
    const refused = pgError(error);
    if (refused) return refused;
    if (!data?.length) return apiError(404, 'not_found', 'That report was not found.');
    return json({ ok: true, status: data[0]!.status });
  },
  ['moderator', 'admin'],
);
