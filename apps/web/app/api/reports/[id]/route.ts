import type { NextRequest } from 'next/server';
import { amountToCents, ReportDraft } from '@rmmm/api';
import { fieldErrors } from '@rmmm/api';
import { apiError, handler, json, readJson, sameOrigin } from '@/lib/api';
import { db, q } from '@/lib/server/db';
import { identifiersFromWho } from '@/lib/server/identifiers';
import { editable, reportAccess, type ReportRow } from '@/lib/server/report-access';
import { draftView } from '@/lib/server/reports';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const notFound = () => apiError(404, 'not_found', 'That report was not found.');

/** GET /api/reports/:id: resume a draft, or see your own report. 404 for anyone else. */
export const GET = handler<Ctx>('reports.get', async (req, { params }) => {
  const access = await reportAccess(req, (await params).id);
  if (!access) return notFound();
  return json(await draftView(access.report));
});

const yn = (v: 'yes' | 'no' | undefined) => (v === undefined ? undefined : v === 'yes');

/**
 * PATCH /api/reports/:id: autosave any subset of the draft. The client shows "Saved" only
 * after this returns 200 (WBS 147).
 */
export const PATCH = handler<Ctx>('reports.patch', async (req: NextRequest, { params }) => {
  if (!sameOrigin(req)) return apiError(403, 'forbidden', 'Request refused.');
  const access = await reportAccess(req, (await params).id);
  if (!access) return notFound();
  if (!editable(access.report.status))
    return apiError(409, 'conflict', 'This report was already sent.');

  const body = await readJson(req, 64_000);
  if (body === undefined) return apiError(400, 'bad_request', 'The request could not be read.');
  const parsed = ReportDraft.safeParse(body);
  if (!parsed.success)
    return apiError(422, 'invalid', 'Some fields need attention.', fieldErrors(parsed.error));
  const d = parsed.data;

  const patch: Record<string, unknown> = {};
  if (d.category !== undefined) patch.category = d.category;
  if (d.step !== undefined) patch.step = d.step;
  if (d.story !== undefined) patch.story = d.story.trim() || null;
  if (d.who) {
    patch.city = d.who.city ?? null;
    patch.state = d.who.state ?? null;
  }
  if (d.money) {
    const m = d.money;
    if ('amount' in m) patch.amount_cents = amountToCents(m.amount);
    if (m.currency) patch.currency = m.currency;
    if ('paidOn' in m) patch.paid_on = m.paidOn ?? null;
    if ('rail' in m) patch.rail = m.rail ?? null;
    if ('wasDeposit' in m) patch.was_deposit = yn(m.wasDeposit) ?? null;
    if ('refundRequested' in m) patch.refund_requested = yn(m.refundRequested) ?? null;
    if ('refundResponse' in m) patch.refund_response = m.refundResponse ?? null;
  }

  const id = access.report.id;
  let row = access.report;
  if (Object.keys(patch).length) {
    const [updated] = await db.update<ReportRow>('reports', `id=eq.${q(id)}`, patch);
    if (updated) row = updated;
  }
  if (d.who) {
    // The step sends the whole form, so its identifiers replace what we had.
    await db.remove('report_identifiers', `report_id=eq.${q(id)}`);
    const rows = identifiersFromWho(d.who).map((r) => ({ ...r, report_id: id }));
    if (rows.length) await db.insert('report_identifiers', rows, 'id');
  }
  return json(await draftView(row));
});
