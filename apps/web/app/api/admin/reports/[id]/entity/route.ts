import { z } from 'zod';
import { adminRoute, pgError } from '@/lib/admin/api';
import { slugify } from '@/lib/admin/slug';
import { apiError, json, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const Body = z
  .object({
    entityId: z.uuid().optional(),
    displayName: z.string().trim().min(1).max(120).optional(),
  })
  .strict()
  .refine((v) => Boolean(v.entityId) !== Boolean(v.displayName));

/**
 * POST /api/admin/reports/:id/entity: link the report to an entity, creating one from the
 * report's identifiers when a name is given. Nothing becomes public here (two-person rule).
 */
export const POST = adminRoute<Ctx>(
  'reports.entity',
  async (req, staff, { params }) => {
    const { id: reportId } = await params;
    const parsed = Body.safeParse(await readJson(req));
    if (!parsed.success) return apiError(422, 'invalid', 'Pick an entity or give a name.');
    const { sb } = staff;

    const { data: report, error: rErr } = await sb
      .from('reports')
      .select('id, category, city, state')
      .eq('id', reportId)
      .maybeSingle();
    if (pgError(rErr)) return pgError(rErr)!;
    if (!report) return apiError(404, 'not_found', 'That report was not found.');

    let entityId = parsed.data.entityId;
    if (!entityId) {
      const { data: created, error } = await sb
        .from('entities')
        .insert({
          slug: slugify(parsed.data.displayName!),
          display_name: parsed.data.displayName,
          category: report.category,
          city: report.city,
          state: report.state,
        })
        .select('id')
        .single();
      if (pgError(error)) return pgError(error)!;
      entityId = created!.id as string;
      const { data: idents, error: iErr } = await sb
        .from('report_identifiers')
        .select('type, raw, norm, norm_loose')
        .eq('report_id', reportId);
      if (pgError(iErr)) return pgError(iErr)!;
      const rows = (idents ?? [])
        .filter((i) => i.type !== 'name')
        .map((i) => ({ ...i, entity_id: entityId, source_report_id: reportId }));
      if (rows.length) {
        const { error } = await sb.from('entity_identifiers').insert(rows);
        if (pgError(error)) return pgError(error)!;
      }
    }
    const { error } = await sb
      .from('report_entities')
      .upsert({ report_id: reportId, entity_id: entityId }, { ignoreDuplicates: true });
    if (pgError(error)) return pgError(error)!;
    return json({ entityId }, 201);
  },
  ['moderator', 'admin'],
);

/** DELETE /api/admin/reports/:id/entity?entityId=: unlink. */
export const DELETE = adminRoute<Ctx>(
  'reports.entity.unlink',
  async (req, staff, { params }) => {
    const { id } = await params;
    const entityId = req.nextUrl.searchParams.get('entityId') ?? '';
    if (!z.uuid().safeParse(entityId).success) return apiError(422, 'invalid', 'Pick an entity.');
    const { error } = await staff.sb
      .from('report_entities')
      .delete()
      .eq('report_id', id)
      .eq('entity_id', entityId);
    if (pgError(error)) return pgError(error)!;
    return json({ ok: true });
  },
  ['moderator', 'admin'],
);
